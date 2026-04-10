import axios from "axios";

import { ScheduleMessageBodyDto, ScheduleMessageResponseDto } from "@/api/v1/client/messages/schedule/dto/schedule-message.dto";
import { AppError } from "@/libs/error/app-error";
import { ERROR_CODES } from "@/libs/error/error-codes";
import {
  PrcompanySmsSendResponse,
  sendPrcompanyLmsReserved,
  sendPrcompanySmsReserved,
} from "@/libs/integrations/prcompany/prcompany.sms";
import { prisma } from "@/libs/prisma/client";

const DEFAULT_MAX_RETRY = 3;
const RESERVED_TIME_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

const isPrcompanyRetryableResponseCode = (code: number) => {
  const nonRetryableCodes = new Set([-2, -4, -5, -6, -7, -8, -9, -10, -14]);
  return !nonRetryableCodes.has(code);
};

const getRetryDelayMs = (attemptNo: number) => {
  const baseByAttempt: Record<number, number> = {
    1: 30_000,
    2: 120_000,
    3: 600_000,
  };

  const base = baseByAttempt[attemptNo] ?? 600_000;
  const jitter = Math.floor(Math.random() * 5_000);
  return base + jitter;
};

const parseScheduledAt = (raw: string) => {
  if (RESERVED_TIME_REGEX.test(raw)) {
    return new Date(raw.replace(" ", "T"));
  }
  return new Date(raw);
};

const pad = (v: number) => String(v).padStart(2, "0");

const toProviderReservedTime = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}:${pad(date.getSeconds())}`;

const buildProviderPayload = (input: ScheduleMessageBodyDto, providerReservedTime: string) => ({
  Callback: input.senderKey,
  Phones: input.recipientPhone,
  ...(input.messageType === "LMS" && input.title ? { Title: input.title } : {}),
  Message: input.content,
  ReservedTime: providerReservedTime,
  ...(input.etc1 ? { Etc1: input.etc1 } : {}),
  ...(input.etc2 ? { Etc2: input.etc2 } : {}),
});

const toResponseDto = (args: {
  messageId: number;
  messageType: "SMS" | "LMS";
  status: string;
  requestedAt: Date;
  reason?: {
    code: string;
    message: string;
  } | null;
}): ScheduleMessageResponseDto => ({
  messageId: args.messageId,
  messageType: args.messageType,
  status: args.status,
  requestedAt: args.requestedAt.toISOString(),
  ...(args.reason !== undefined ? { reason: args.reason } : {}),
});

// SMS/LMS 예약 발송 처리 서비스
export const scheduleMessage = async (input: ScheduleMessageBodyDto): Promise<ScheduleMessageResponseDto> => {
  const messageType = input.messageType;
  const recipientPhonesCsv = input.recipientPhone.join(",");
  const scheduledDate = parseScheduledAt(input.scheduledAt);
  const providerReservedTime = toProviderReservedTime(scheduledDate);

  const client = await prisma.client.findFirst({
    where: {
      clientCode: input.clientCode,
      status: "ACTIVE",
    },
  });

  if (!client) {
    throw new AppError(404, ERROR_CODES.COMMON_404_NOT_FOUND, "Client not found");
  }

  if (input.idempotencyKey) {
    const existingMessage = await prisma.message.findFirst({
      where: {
        clientId: client.id,
        idempotencyKey: input.idempotencyKey,
      },
      orderBy: { id: "desc" },
    });

    if (existingMessage) {
      return toResponseDto({
        messageId: existingMessage.id,
        messageType: existingMessage.messageType as "SMS" | "LMS",
        status: existingMessage.status,
        requestedAt: existingMessage.requestedAt,
        reason: {
          code: "MESSAGE_DUPLICATE_REQUEST",
          message: "중복 요청입니다. 기존 메시지 상태를 반환합니다.",
        },
      });
    }
  }

  const requestedAt = new Date();
  const { message, dispatch } = await prisma.$transaction(async (tx) => {
    const createdMessage = await tx.message.create({
      data: {
        clientId: client.id,
        idempotencyKey: input.idempotencyKey ?? null,
        messageType,
        sendType: "SCHEDULED",
        status: "SCHEDULED",
        recipientPhone: recipientPhonesCsv,
        senderKey: input.senderKey,
        subject: input.title ?? null,
        content: input.content,
        scheduledAt: scheduledDate,
        requestedAt,
      },
    });

    await tx.messageEvent.create({
      data: {
        messageId: createdMessage.id,
        eventType: "SCHEDULED",
        detailJson: {
          messageType,
          scheduledAt: scheduledDate.toISOString(),
        },
      },
    });

    const createdDispatch = await tx.providerDispatch.create({
      data: {
        messageId: createdMessage.id,
        attemptNo: 1,
        maxRetry: DEFAULT_MAX_RETRY,
        dispatchedAt: new Date(),
        requestPayloadJson: buildProviderPayload(input, providerReservedTime),
      },
    });

    await tx.message.update({
      where: { id: createdMessage.id },
      data: { status: "DISPATCHING" },
    });

    await tx.messageEvent.create({
      data: {
        messageId: createdMessage.id,
        eventType: "DISPATCH_ATTEMPTED",
        detailJson: { attemptNo: 1, providerDispatchId: createdDispatch.id },
      },
    });

    return { message: createdMessage, dispatch: createdDispatch };
  });

  try {
    const providerResponse =
      messageType === "LMS"
        ? await sendPrcompanyLmsReserved({
            callback: input.senderKey,
            phones: input.recipientPhone,
            title: input.title,
            message: input.content,
            reservedTime: providerReservedTime,
            etc1: input.etc1,
            etc2: input.etc2,
          })
        : await sendPrcompanySmsReserved({
            callback: input.senderKey,
            phones: input.recipientPhone,
            message: input.content,
            reservedTime: providerReservedTime,
            etc1: input.etc1,
            etc2: input.etc2,
          });

    return await handleProviderResponse({
      messageId: message.id,
      messageType,
      dispatchId: dispatch.id,
      providerResponse,
      requestedAt: message.requestedAt,
      attemptNo: dispatch.attemptNo,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const nextRetryAt = new Date(Date.now() + getRetryDelayMs(dispatch.attemptNo));

      await prisma.$transaction(async (tx) => {
        await tx.providerDispatch.update({
          where: { id: dispatch.id },
          data: {
            respondedAt: new Date(),
            responsePayloadJson: error.response?.data ?? null,
            responseMessage: error.message,
            isRetryable: true,
            nextRetryAt,
          },
        });

        await tx.message.update({
          where: { id: message.id },
          data: {
            status: "PENDING",
            statusReasonCode: "PROVIDER_NETWORK_ERROR",
            statusReasonMessage: error.message,
          },
        });

        await tx.messageEvent.create({
          data: {
            messageId: message.id,
            eventType: "RETRIED",
            detailJson: {
              attemptNo: dispatch.attemptNo,
              nextRetryAt: nextRetryAt.toISOString(),
              reason: error.message,
            },
          },
        });
      });

      return toResponseDto({
        messageId: message.id,
        messageType,
        status: "PENDING",
        requestedAt: message.requestedAt,
        reason: {
          code: "MESSAGE_RETRY_SCHEDULED",
          message: "공급자 일시 오류로 재시도가 예약되었습니다.",
        },
      });
    }

    throw error;
  }
};

const handleProviderResponse = async (args: {
  messageId: number;
  messageType: "SMS" | "LMS";
  dispatchId: number;
  providerResponse: PrcompanySmsSendResponse;
  requestedAt: Date;
  attemptNo: number;
}): Promise<ScheduleMessageResponseDto> => {
  const { providerResponse } = args;
  const respondedAt = new Date();

  const isSuccess = providerResponse.ResCd === 0;
  const isRetryable = isSuccess ? false : isPrcompanyRetryableResponseCode(providerResponse.ResCd);
  const nextRetryAt = !isSuccess && isRetryable ? new Date(Date.now() + getRetryDelayMs(args.attemptNo)) : null;

  if (isSuccess) {
    await prisma.$transaction(async (tx) => {
      await tx.providerDispatch.update({
        where: { id: args.dispatchId },
        data: {
          respondedAt,
          responsePayloadJson: providerResponse,
          responseCount: providerResponse.Count ?? null,
          responseCode: providerResponse.ResCd ?? null,
          responseMessage: providerResponse.ResMsg ?? null,
          responseMac: providerResponse.Mac ?? null,
          isRetryable,
          nextRetryAt,
        },
      });

      await tx.message.update({
        where: { id: args.messageId },
        data: {
          status: "SCHEDULED",
          statusReasonCode: null,
          statusReasonMessage: null,
        },
      });

      await tx.messageEvent.create({
        data: {
          messageId: args.messageId,
          eventType: "SCHEDULED",
          detailJson: {
            responseCode: providerResponse.ResCd,
            responseCount: providerResponse.Count,
          },
        },
      });
    });

    return toResponseDto({
      messageId: args.messageId,
      messageType: args.messageType,
      status: "SCHEDULED",
      requestedAt: args.requestedAt,
      reason: null,
    });
  }

  if (isRetryable) {
    await prisma.$transaction(async (tx) => {
      await tx.providerDispatch.update({
        where: { id: args.dispatchId },
        data: {
          respondedAt,
          responsePayloadJson: providerResponse,
          responseCount: providerResponse.Count ?? null,
          responseCode: providerResponse.ResCd ?? null,
          responseMessage: providerResponse.ResMsg ?? null,
          responseMac: providerResponse.Mac ?? null,
          isRetryable,
          nextRetryAt,
        },
      });

      await tx.message.update({
        where: { id: args.messageId },
        data: {
          status: "PENDING",
          statusReasonCode: `PR_RESCODE_${providerResponse.ResCd}`,
          statusReasonMessage: providerResponse.ResMsg ?? null,
        },
      });

      await tx.messageEvent.create({
        data: {
          messageId: args.messageId,
          eventType: "RETRIED",
          detailJson: {
            attemptNo: args.attemptNo,
            responseCode: providerResponse.ResCd,
            responseMessage: providerResponse.ResMsg ?? null,
            nextRetryAt: nextRetryAt?.toISOString() ?? null,
          },
        },
      });
    });

    return toResponseDto({
      messageId: args.messageId,
      messageType: args.messageType,
      status: "PENDING",
      requestedAt: args.requestedAt,
      reason: {
        code: "MESSAGE_RETRY_SCHEDULED",
        message: "공급자 일시 오류로 재시도가 예약되었습니다.",
      },
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.providerDispatch.update({
      where: { id: args.dispatchId },
      data: {
        respondedAt,
        responsePayloadJson: providerResponse,
        responseCount: providerResponse.Count ?? null,
        responseCode: providerResponse.ResCd ?? null,
        responseMessage: providerResponse.ResMsg ?? null,
        responseMac: providerResponse.Mac ?? null,
        isRetryable,
        nextRetryAt,
      },
    });

    await tx.message.update({
      where: { id: args.messageId },
      data: {
        status: "FAILED",
        finalizedAt: new Date(),
        statusReasonCode: `PR_RESCODE_${providerResponse.ResCd}`,
        statusReasonMessage: providerResponse.ResMsg ?? null,
      },
    });

    await tx.messageEvent.create({
      data: {
        messageId: args.messageId,
        eventType: "FAILED",
        detailJson: {
          responseCode: providerResponse.ResCd,
          responseMessage: providerResponse.ResMsg ?? null,
        },
      },
    });
  });

  return toResponseDto({
    messageId: args.messageId,
    messageType: args.messageType,
    status: "FAILED",
    requestedAt: args.requestedAt,
    reason: {
      code: "MESSAGE_SEND_FAILED",
      message: providerResponse.ResMsg ?? "예약 발송에 실패했습니다.",
    },
  });
};
