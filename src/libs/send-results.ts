import { Prisma } from "@prisma/client";

import { AppError } from "@/libs/error/app-error";
import { ERROR_CODES } from "@/libs/error/error-codes";
import {
  getPrcompanyResultCount,
  NormalizedPrcompanyResultCount,
} from "@/libs/integrations/prcompany/prcompany.report";
import { prisma } from "@/libs/prisma/client";

type SyncSendResultStatus = "SAVED" | "NOT_FOUND";

export type SyncSendResultForMessageResult = {
  status: SyncSendResultStatus;
  messageId: number;
  deliveryResultId?: number;
  normalizedResult: NormalizedPrcompanyResultCount;
};

const toInputJson = (value: unknown) => value as Prisma.InputJsonValue;

// prcompany 집계 결과를 Message의 최종 상태로 변환
const getFinalMessageStatus = (result: NormalizedPrcompanyResultCount) => {
  if (result.successCount > 0) return "DELIVERED";
  return "FAILED";
};

// 일부 실패/전체 실패 상황을 운영자가 구분할 수 있도록 상태 사유를 생성
const getStatusReason = (result: NormalizedPrcompanyResultCount) => {
  if (result.successCount > 0 && result.failedCount > 0) {
    return {
      code: "PARTIAL_DELIVERY_FAILED",
      message: result.providerResultMessage,
    };
  }

  if (result.successCount === 0 && result.failedCount > 0) {
    return {
      code: result.providerResultCode ? `PR_RESULT_${result.providerResultCode}` : "DELIVERY_FAILED",
      message: result.providerResultMessage,
    };
  }

  return {
    code: null,
    message: null,
  };
};

// 특정 Message를 기준으로 prcompany 전송결과 API를 호출하고 DeliveryResult에 저장
export const syncSendResultForMessage = async (messageId: number): Promise<SyncSendResultForMessageResult> => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: {
      id: true,
      idempotencyKey: true,
      messageType: true,
      requestedAt: true,
    },
  });

  if (!message) {
    throw new AppError(404, ERROR_CODES.COMMON_404_NOT_FOUND, "메시지를 찾을 수 없습니다.");
  }

  if (message.messageType !== "ALIMTALK" && message.messageType !== "BRANDTALK") {
    throw new AppError(400, ERROR_CODES.COMMON_400_VALIDATION, "카카오 메시지만 전송결과 조회를 지원합니다.");
  }

  if (!message.idempotencyKey) {
    throw new AppError(400, ERROR_CODES.COMMON_400_VALIDATION, "전송결과 조회를 위한 idempotencyKey가 없습니다.");
  }

  const normalizedResult = await getPrcompanyResultCount({
    messageType: message.messageType,
    idempotencyKey: message.idempotencyKey,
    requestedAt: message.requestedAt,
  });

  if (!normalizedResult.found) {
    return {
      status: "NOT_FOUND",
      messageId: message.id,
      normalizedResult,
    };
  }

  const confirmedAt = new Date();
  const finalStatus = getFinalMessageStatus(normalizedResult);
  const statusReason = getStatusReason(normalizedResult);

  const deliveryResult = await prisma.$transaction(async (tx) => {
    const savedDeliveryResult = await tx.deliveryResult.upsert({
      where: { messageId: message.id },
      create: {
        messageId: message.id,
        idempotencyKey: message.idempotencyKey,
        totalCount: normalizedResult.totalCount,
        successCount: normalizedResult.successCount,
        failedCount: normalizedResult.failedCount,
        providerResultCode: normalizedResult.providerResultCode,
        providerResultMessage: normalizedResult.providerResultMessage,
        rawJson: toInputJson(normalizedResult.rawJson),
        confirmedAt,
      },
      update: {
        idempotencyKey: message.idempotencyKey,
        totalCount: normalizedResult.totalCount,
        successCount: normalizedResult.successCount,
        failedCount: normalizedResult.failedCount,
        providerResultCode: normalizedResult.providerResultCode,
        providerResultMessage: normalizedResult.providerResultMessage,
        rawJson: toInputJson(normalizedResult.rawJson),
        confirmedAt,
      },
    });

    await tx.message.update({
      where: { id: message.id },
      data: {
        status: finalStatus,
        finalizedAt: confirmedAt,
        deliveryPollStatus: "COMPLETE",
        deliveryPollAttempt: { increment: 1 },
        lastPolledAt: confirmedAt,
        statusReasonCode: statusReason.code,
        statusReasonMessage: statusReason.message,
      },
    });

    await tx.messageEvent.create({
      data: {
        messageId: message.id,
        eventType: finalStatus,
        detailJson: {
          deliveryResultId: savedDeliveryResult.id,
          totalCount: normalizedResult.totalCount,
          successCount: normalizedResult.successCount,
          failedCount: normalizedResult.failedCount,
          providerResultCode: normalizedResult.providerResultCode,
          providerResultMessage: normalizedResult.providerResultMessage,
        },
      },
    });

    return savedDeliveryResult;
  });

  return {
    status: "SAVED",
    messageId: message.id,
    deliveryResultId: deliveryResult.id,
    normalizedResult,
  };
};
