import { ValidationResult } from "@/libs/validation/validate";
import { SendMessageBodyDto } from "@/api/v1/client/messages/send/dto/send-message.dto";

const isNonEmptyString = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

const isOptionalString = (v: unknown): v is string | undefined => v === undefined || typeof v === "string";

const PHONE_REGEX = /^[0-9]{9,20}$/;

// SMS 즉시 발송 요청 body 검증
export const parseSendMessageBody = (input: unknown): ValidationResult<SendMessageBodyDto> => {
  const source = (input ?? {}) as Record<string, unknown>;
  const issues: { field: string; reason: string }[] = [];

  const clientCode = source.clientCode;
  const messageType = source.messageType;
  const recipientPhone = source.recipientPhone;
  const senderKey = source.senderKey;
  const content = source.content;
  const idempotencyKey = source.idempotencyKey;
  const etc1 = source.etc1;
  const etc2 = source.etc2;

  if (!isNonEmptyString(clientCode)) issues.push({ field: "clientCode", reason: "clientCode is required" });
  if (messageType !== "SMS") issues.push({ field: "messageType", reason: "messageType must be 'SMS'" });
  if (!isNonEmptyString(recipientPhone) || !PHONE_REGEX.test(recipientPhone.trim())) {
    issues.push({ field: "recipientPhone", reason: "recipientPhone must be numeric string" });
  }
  if (!isNonEmptyString(senderKey)) issues.push({ field: "senderKey", reason: "senderKey is required" });
  if (!isNonEmptyString(content)) issues.push({ field: "content", reason: "content is required" });
  if (!isOptionalString(idempotencyKey)) issues.push({ field: "idempotencyKey", reason: "idempotencyKey must be string" });
  if (!isOptionalString(etc1)) issues.push({ field: "etc1", reason: "etc1 must be string" });
  if (!isOptionalString(etc2)) issues.push({ field: "etc2", reason: "etc2 must be string" });

  // 문서 기준 SMS 본문 최대 90바이트
  if (isNonEmptyString(content) && Buffer.byteLength(content, "utf8") > 90) {
    issues.push({ field: "content", reason: "content must be 90 bytes or less for SMS" });
  }

  // 문서 기준 Etc1/Etc2 최대 160바이트
  if (isNonEmptyString(etc1) && Buffer.byteLength(etc1, "utf8") > 160) {
    issues.push({ field: "etc1", reason: "etc1 must be 160 bytes or less" });
  }

  if (isNonEmptyString(etc2) && Buffer.byteLength(etc2, "utf8") > 160) {
    issues.push({ field: "etc2", reason: "etc2 must be 160 bytes or less" });
  }

  if (issues.length > 0) {
    return { success: false, issues };
  }

  return {
    success: true,
    data: {
      clientCode: String(clientCode).trim(),
      messageType: "SMS",
      recipientPhone: String(recipientPhone).trim(),
      senderKey: String(senderKey).trim(),
      content: String(content),
      ...(isNonEmptyString(idempotencyKey) ? { idempotencyKey: idempotencyKey.trim() } : {}),
      ...(isOptionalString(etc1) && etc1 !== undefined ? { etc1: etc1.trim() } : {}),
      ...(isOptionalString(etc2) && etc2 !== undefined ? { etc2: etc2.trim() } : {}),
    },
  };
};
