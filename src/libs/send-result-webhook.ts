import axios from "axios";
import { Prisma } from "@prisma/client";

import { AppError } from "@/libs/error/app-error";
import { ERROR_CODES } from "@/libs/error/error-codes";
import { prisma } from "@/libs/prisma/client";

const WEBHOOK_TIMEOUT_MS = 60_000;
const WEBHOOK_RETRY_DELAY_MS = 5 * 60 * 1000;

export type SendStatusWebhookResult = {
  messageId: number;
  deliveryResultId: number;
  callbackAttemptId: number;
  success: boolean;
  responseStatus: number | null;
  responseBody: string | null;
};

const toInputJson = (value: unknown) => value as Prisma.InputJsonValue;

const toResponseBody = (value: unknown) => {
  if (value === undefined || value === null) return null;
  if (typeof value === "string") return value;
  return JSON.stringify(value);
};

const getNextRetryAt = () => new Date(Date.now() + WEBHOOK_RETRY_DELAY_MS);

// prcompany 요청 성공 시 빈 문자열, 실패 시 결과조회 응답 메시지 전달
const buildWebhookResultMessage = (deliveryResult: { failedCount: number; providerResultMessage: string | null }) => {
  if (deliveryResult.failedCount <= 0) return "";

  return deliveryResult.providerResultMessage?.trim() || "prcompany 전송결과 조회 응답을 받지 못했습니다.";
};

// Client 설정 또는 테스트용 환경변수에서 webhook URL을 결정
const resolveWebhookUrl = (client: { deliveryCallbackEnabled: boolean; deliveryCallbackUrl: string | null }) => {
  if (client.deliveryCallbackEnabled && client.deliveryCallbackUrl) {
    return client.deliveryCallbackUrl;
  }

  return process.env.KAKAO_SEND_STATUS_WEBHOOK_URL?.trim() || null;
};

// 특정 Message의 전송결과를 외주사 카카오 발송현황 webhook으로 전달 및 호출 이력을 저장
export const sendKakaoSendStatusWebhook = async (messageId: number): Promise<SendStatusWebhookResult> => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: {
      id: true,
      clientId: true,
      idempotencyKey: true,
      messageType: true,
      client: {
        select: {
          deliveryCallbackEnabled: true,
          deliveryCallbackUrl: true,
        },
      },
      deliveryResult: {
        select: {
          id: true,
          totalCount: true,
          successCount: true,
          failedCount: true,
          providerResultMessage: true,
        },
      },
    },
  });

  if (!message) {
    throw new AppError(404, ERROR_CODES.COMMON_404_NOT_FOUND, "메시지를 찾을 수 없습니다.");
  }

  if (message.messageType !== "ALIMTALK" && message.messageType !== "BRANDTALK") {
    throw new AppError(400, ERROR_CODES.COMMON_400_VALIDATION, "카카오 메시지만 webhook 전송을 지원합니다.");
  }

  if (!message.deliveryResult) {
    throw new AppError(400, ERROR_CODES.COMMON_400_VALIDATION, "저장된 전송결과가 없습니다.");
  }

  const callbackUrl = resolveWebhookUrl(message.client);
  if (!callbackUrl) {
    throw new AppError(400, ERROR_CODES.COMMON_400_VALIDATION, "전송현황 webhook URL이 설정되어 있지 않습니다.");
  }

  const payload = {
    idempotencyKey: message.idempotencyKey,
    totalCount: message.deliveryResult.totalCount,
    successCount: message.deliveryResult.successCount,
    failedCount: message.deliveryResult.failedCount,
    message: buildWebhookResultMessage(message.deliveryResult),
  };

  const requestedAt = new Date();
  const lastAttempt = await prisma.clientDeliveryCallbackAttempt.findFirst({
    where: { messageId: message.id },
    select: { attemptNo: true },
    orderBy: { attemptNo: "desc" },
  });

  const attemptNo = (lastAttempt?.attemptNo ?? 0) + 1;

  const apiKey = process.env.RNR_SERVER_APIKEY?.trim();
  try {
    const response = await axios.patch(callbackUrl, payload, {
      timeout: WEBHOOK_TIMEOUT_MS,
      validateStatus: () => true,
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "X-API-KEY": apiKey } : {}),
      },
    });

    const success = response.status >= 200 && response.status < 300;
    const responseBody = toResponseBody(response.data);
    const respondedAt = new Date();

    const attempt = await prisma.clientDeliveryCallbackAttempt.create({
      data: {
        clientId: message.clientId,
        messageId: message.id,
        deliveryResultId: message.deliveryResult.id,
        attemptNo,
        callbackUrl,
        requestPayloadJson: toInputJson(payload),
        responseStatus: response.status,
        responseBody,
        success,
        nextRetryAt: success ? null : getNextRetryAt(),
        requestedAt,
        respondedAt,
      },
    });

    return {
      messageId: message.id,
      deliveryResultId: message.deliveryResult.id,
      callbackAttemptId: attempt.id,
      success,
      responseStatus: response.status,
      responseBody,
    };
  } catch (error) {
    const responseStatus = axios.isAxiosError(error) ? (error.response?.status ?? null) : null;
    const responseBody = axios.isAxiosError(error) ? toResponseBody(error.response?.data ?? error.message) : null;
    const respondedAt = new Date();

    const attempt = await prisma.clientDeliveryCallbackAttempt.create({
      data: {
        clientId: message.clientId,
        messageId: message.id,
        deliveryResultId: message.deliveryResult.id,
        attemptNo,
        callbackUrl,
        requestPayloadJson: toInputJson(payload),
        responseStatus,
        responseBody,
        success: false,
        nextRetryAt: getNextRetryAt(),
        requestedAt,
        respondedAt,
      },
    });

    return {
      messageId: message.id,
      deliveryResultId: message.deliveryResult.id,
      callbackAttemptId: attempt.id,
      success: false,
      responseStatus,
      responseBody,
    };
  }
};
