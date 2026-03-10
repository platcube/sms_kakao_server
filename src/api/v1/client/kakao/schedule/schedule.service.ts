import axios from "axios";

import { ScheduleKakaoBodyDto, ScheduleKakaoResponseDto } from "@/api/v1/client/kakao/schedule/dto/schedule-kakao.dto";
import { AppError } from "@/libs/error/app-error";
import { ERROR_CODES } from "@/libs/error/error-codes";
import {
  PrcompanyKakaoSendResponse,
  sendPrcompanyKakaoReserved,
} from "@/libs/integrations/prcompany/prcompany.kakao";
import { prisma } from "@/libs/prisma/client";

const DEFAULT_MAX_RETRY = 3;

const isRetryableKakaoReservedCode = (code: number) => {
  const nonRetryableCodes = new Set([-2, -4, -5, -6, -7, -8, -9, -10, -11]);
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

const normalizeTempBtn1 = (value: ScheduleKakaoBodyDto["tempBtn1"]) => {
  if (value === undefined) return undefined;
  return typeof value === "string" ? value : JSON.stringify(value);
};

const buildProviderPayload = (input: ScheduleKakaoBodyDto) => ({
  Callback: input.senderKey,
  Phones: input.recipientPhone,
  ...(input.title ? { Title: input.title } : {}),
  Message: input.message,
  ProfileKey: input.profileKey,
  TempCode: input.tempCode,
  ...(normalizeTempBtn1(input.tempBtn1) ? { TempBtn1: normalizeTempBtn1(input.tempBtn1) } : {}),
  FailFlag: String(input.failFlag ?? 0),
  SMSGubn: input.smsGubn,
  Etc1: "N",
  ReservedTime: input.reservedTime,
  ...(input.ketc1 ? { Ketc1: input.ketc1 } : {}),
  ...(input.ketc2 ? { Ketc2: input.ketc2 } : {}),
});

const toResponseDto = (args: {
  messageId: number;
  status: string;
  requestedAt: Date;
  reason?: {
    code: string;
    message: string;
  } | null;
}): ScheduleKakaoResponseDto => ({
  messageId: args.messageId,
  messageType: "ALIMTALK",
  status: args.status,
  requestedAt: args.requestedAt.toISOString(),
  ...(args.reason !== undefined ? { reason: args.reason } : {}),
});

export const scheduleKakaoMessage = async (input: ScheduleKakaoBodyDto): Promise<ScheduleKakaoResponseDto> => {
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
    const normalizedTempBtn1 = normalizeTempBtn1(input.tempBtn1);

    const createdMessage = await tx.message.create({
      data: {
        clientId: client.id,
        idempotencyKey: input.idempotencyKey ?? null,
        messageType: "ALIMTALK",
        sendType: "SCHEDULED",
        status: "SCHEDULED",
        recipientPhone: input.recipientPhone,
        senderKey: input.senderKey,
        subject: input.title ?? null,
        content: input.message,
        templateCode: input.tempCode,
        ...(normalizedTempBtn1 ? { buttonsJson: { raw: normalizedTempBtn1 } } : {}),
        scheduledAt: new Date(input.reservedTime.replace(" ", "T")),
        requestedAt,
      },
    });

    await tx.messageEvent.create({
      data: {
        messageId: createdMessage.id,
        eventType: "SCHEDULED",
        detailJson: {
          messageType: "ALIMTALK",
          reservedTime: input.reservedTime,
        },
      },
    });

    const createdDispatch = await tx.providerDispatch.create({
      data: {
        messageId: createdMessage.id,
        attemptNo: 1,
        maxRetry: DEFAULT_MAX_RETRY,
        dispatchedAt: new Date(),
        requestPayloadJson: buildProviderPayload(input),
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
    const providerResponse = await sendPrcompanyKakaoReserved({
      callback: input.senderKey,
      phones: input.recipientPhone,
      title: input.title,
      message: input.message,
      profileKey: input.profileKey,
      tempCode: input.tempCode,
      tempBtn1: normalizeTempBtn1(input.tempBtn1),
      failFlag: input.failFlag ?? 0,
      smsGubn: input.smsGubn,
      reservedTime: input.reservedTime,
      ketc1: input.ketc1,
      ketc2: input.ketc2,
    });

    return await handleProviderResponse({
      messageId: message.id,
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
  dispatchId: number;
  providerResponse: PrcompanyKakaoSendResponse;
  requestedAt: Date;
  attemptNo: number;
}): Promise<ScheduleKakaoResponseDto> => {
  const { providerResponse } = args;
  const respondedAt = new Date();

  const isSuccess = providerResponse.ResCd === 0;
  const isRetryable = isSuccess ? false : isRetryableKakaoReservedCode(providerResponse.ResCd);
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
          status: "ACCEPTED",
          statusReasonCode: null,
          statusReasonMessage: null,
        },
      });

      await tx.messageEvent.create({
        data: {
          messageId: args.messageId,
          eventType: "ACCEPTED",
          detailJson: {
            responseCode: providerResponse.ResCd,
            responseCount: providerResponse.Count,
          },
        },
      });
    });

    return toResponseDto({
      messageId: args.messageId,
      status: "ACCEPTED",
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
    status: "FAILED",
    requestedAt: args.requestedAt,
    reason: {
      code: "MESSAGE_SEND_FAILED",
      message: providerResponse.ResMsg ?? "카카오 알림톡 예약 발송에 실패했습니다.",
    },
  });
};
