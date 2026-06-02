import {
  TestPrcompanySendResultBodyDto,
  TestSyncSendResultBodyDto,
} from "@/api/v1/test/send-result/dto/test-send-result.dto";

type ValidationResult<T> = { success: true; data: T } | { success: false; issues: { field: string; reason: string }[] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

// prcompany 전송결과 테스트 요청 body를 검증합니다.
export const parseTestPrcompanySendResultBody = (body: unknown): ValidationResult<TestPrcompanySendResultBodyDto> => {
  const issues: { field: string; reason: string }[] = [];

  if (!isRecord(body)) {
    return { success: false, issues: [{ field: "body", reason: "body must be an object" }] };
  }

  const idempotencyKey = body.idempotencyKey;
  const sDate = body.sDate;
  const messageType = body.messageType;

  if (messageType !== "ALIMTALK" && messageType !== "BRANDTALK") {
    issues.push({
      field: "messageType",
      reason: "messageType must be ALIMTALK or BRANDTALK",
    });
  }

  if (!isNonEmptyString(idempotencyKey)) {
    issues.push({ field: "idempotencyKey", reason: "idempotencyKey is required" });
  }

  if (sDate !== undefined && !isNonEmptyString(sDate)) {
    issues.push({ field: "sDate", reason: "sDate must be YYYY-MM-DD string" });
  }

  if (issues.length > 0) {
    return { success: false, issues };
  }

  return {
    success: true,
    data: {
      idempotencyKey: String(idempotencyKey).trim(),
      messageType: messageType as "ALIMTALK" | "BRANDTALK",
      ...(isNonEmptyString(sDate) ? { sDate: sDate.trim() } : {}),
    },
  };
};

// DeliveryResult 저장 테스트 요청 body 검증
export const parseTestSyncSendResultBody = (body: unknown): ValidationResult<TestSyncSendResultBodyDto> => {
  const issues: { field: string; reason: string }[] = [];

  if (!isRecord(body)) {
    return { success: false, issues: [{ field: "body", reason: "body must be an object" }] };
  }

  const messageId = body.messageId;
  const normalizedMessageId = typeof messageId === "string" ? Number(messageId) : messageId;

  if (typeof normalizedMessageId !== "number" || !Number.isInteger(normalizedMessageId) || normalizedMessageId <= 0) {
    issues.push({ field: "messageId", reason: "messageId must be a positive integer" });
  }

  if (issues.length > 0) {
    return { success: false, issues };
  }

  return {
    success: true,
    data: {
      messageId: normalizedMessageId as number,
    },
  };
};
