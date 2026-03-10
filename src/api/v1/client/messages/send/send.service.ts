import axios from "axios";

import { prisma } from "@/libs/prisma/client";
import { AppError } from "@/libs/error/app-error";
import { ERROR_CODES } from "@/libs/error/error-codes";
import { sendPrcompanySmsImmediate, type PrcompanySmsSendResponse } from "@/libs/integrations/prcompany/prcompany.sms";
import { SendMessageBodyDto, SendMessageResponseDto } from "@/api/v1/client/messages/send/dto/send-message.dto";

const DEFAULT_MAX_RETRY = 3;

// prcompany ResCd를 기준으로 재시도 가능 여부 판정
const isPrcompanyRetryableResponseCode = (code: number) => {
  const nonRetryableCodes = new Set([-2, -4, -5, -6, -7, -8, -9, -14]);
  return !nonRetryableCodes.has(code);
};

// 발송 시도 번호(횟수)에 따른 재시도 지연시간(ms) 계산
const getRetryDelayMs = (attemptNo: number) => {
  const baseByAttempt: Record<number, number> = {
    1: 30_000,
    2: 120_000,
    3: 600_000,
  };

  const base = baseByAttempt[attemptNo] ?? 600_000; // 재시도 횟수에 따른 지수 백오프
  const jitter = Math.floor(Math.random() * 5_000); // 소량 지터 적용
  return base + jitter;
};

// ProviderDispatch.requestPayloadJson에 저장할 공급자 요청 payload 형태로 변환
const buildProviderPayload = (input: SendMessageBodyDto) => ({
  Callback: input.senderKey,
  Phones: input.recipientPhone.join(","),
  Message: input.content,
  ...(input.etc1 ? { Etc1: input.etc1 } : {}),
  ...(input.etc2 ? { Etc2: input.etc2 } : {}),
});

// 서비스 내부 결과를 API 응답 DTO 형태로 변환
const toResponseDto = (args: {
  messageId: number;
  status: string;
  requestedAt: Date;
  reason?: {
    code: string;
    message: string;
  } | null;
}): SendMessageResponseDto => ({
  messageId: args.messageId,
  messageType: "SMS",
  status: args.status,
  requestedAt: args.requestedAt.toISOString(),
  ...(args.reason !== undefined ? { reason: args.reason } : {}),
});

/**
 * SMS 즉시 발송 처리 서비스
 * @param input 외주사 요청 DTO (검증 완료 상태)
 * @returns 발송 처리 결과 DTO
 */
export const sendSmsMessage = async (input: SendMessageBodyDto): Promise<SendMessageResponseDto> => {
  const recipientPhonesCsv = input.recipientPhone.join(",");

  // 1) 외주사(client) 식별 및 활성 상태 확인
  const client = await prisma.client.findFirst({
    where: {
      clientCode: input.clientCode,
      status: "ACTIVE",
    },
  });

  if (!client) {
    throw new AppError(404, ERROR_CODES.COMMON_404_NOT_FOUND, "Client not found");
  }

  // 2) idempotencyKey가 있으면 동일 요청 재처리 대신 기존 메시지 반환
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
    const createdMessage = await tx.message.create({
      data: {
        clientId: client.id,
        idempotencyKey: input.idempotencyKey ?? null,
        messageType: "SMS",
        sendType: "NOW",
        status: "PENDING",
        recipientPhone: recipientPhonesCsv,
        senderKey: input.senderKey,
        content: input.content,
        requestedAt,
      },
    });

    await tx.messageEvent.create({
      data: {
        messageId: createdMessage.id,
        eventType: "REQUESTED",
        detailJson: {
          messageType: "SMS",
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

    return {
      message: createdMessage,
      dispatch: createdDispatch,
    };
  });

  try {
    // 5) prcompany SMS 즉시 발송 호출
    const providerResponse = await sendPrcompanySmsImmediate({
      callback: input.senderKey,
      phones: input.recipientPhone,
      message: input.content,
      etc1: input.etc1,
      etc2: input.etc2,
    });

    return await handleProviderBusinessResponse({
      messageId: message.id,
      dispatchId: dispatch.id,
      providerResponse,
      requestedAt: message.requestedAt,
      attemptNo: dispatch.attemptNo,
    });
  } catch (error) {
    // 6) 네트워크/HTTP 레벨 오류는 재시도 가능 오류로 분류(초안 정책)
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

/**
 * prcompany 응답(ResCd/ResMsg)을 해석하여 ProviderDispatch, Message, MessageEvent를 갱신
 * @param args 메시지/시도 식별자와 공급자 응답 원문
 */
const handleProviderBusinessResponse = async (args: {
  messageId: number;
  dispatchId: number;
  providerResponse: PrcompanySmsSendResponse;
  requestedAt: Date;
  attemptNo: number;
}): Promise<SendMessageResponseDto> => {
  const { providerResponse } = args;
  const respondedAt = new Date();

  const isSuccess = providerResponse.ResCd === 0;
  const isRetryable = isSuccess ? false : isPrcompanyRetryableResponseCode(providerResponse.ResCd);
  const nextRetryAt = !isSuccess && isRetryable ? new Date(Date.now() + getRetryDelayMs(args.attemptNo)) : null;

  // ResCd=0: 공급자 접수 성공
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

  // ResCd!=0 이지만 정책상 재시도 가능한 경우
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

  // 재시도 불가인 경우 최종 실패 처리
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
      message: providerResponse.ResMsg ?? "메시지 발송에 실패했습니다.",
    },
  });
};
