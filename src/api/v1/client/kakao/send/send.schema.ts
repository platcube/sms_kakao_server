import { SendKakaoBodyDto } from "@/api/v1/client/kakao/send/dto/send-kakao.dto";
import { ValidationResult } from "@/libs/validation/validate";

const PHONE_REGEX = /^[0-9]{9,20}$/;
const RESERVED_TIME_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

const isNonEmptyString = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const isOptionalString = (v: unknown): v is string | undefined => v === undefined || typeof v === "string";
const isValidTempBtn1 = (v: unknown): v is string | Record<string, unknown> =>
  v === undefined || typeof v === "string" || (typeof v === "object" && v !== null && !Array.isArray(v));

export const parseKakaoSendBody = (input: unknown): ValidationResult<SendKakaoBodyDto> => {
  const source = (input ?? {}) as Record<string, unknown>;
  const issues: { field: string; reason: string }[] = [];

  const clientCode = source.clientCode;
  const messageType = source.messageType;
  const recipientPhone = source.recipientPhone;
  const senderKey = source.senderKey;
  const message = source.message;
  const title = source.title;
  const profileKey = source.profileKey;
  const tempCode = source.tempCode;
  const tempBtn1 = source.tempBtn1;
  const failFlag = source.failFlag;
  const smsGubn = source.smsGubn;
  const ketc1 = source.ketc1;
  const ketc2 = source.ketc2;
  const idempotencyKey = source.idempotencyKey;

  if (!isNonEmptyString(clientCode)) issues.push({ field: "clientCode", reason: "clientCode is required" });
  if (messageType !== "ALIMTALK") issues.push({ field: "messageType", reason: "messageType must be 'ALIMTALK'" });
  if (!isNonEmptyString(recipientPhone) || !PHONE_REGEX.test(recipientPhone.trim())) {
    issues.push({ field: "recipientPhone", reason: "recipientPhone must be numeric string" });
  }
  if (!isNonEmptyString(senderKey)) issues.push({ field: "senderKey", reason: "senderKey is required" });
  if (!isNonEmptyString(message)) issues.push({ field: "message", reason: "message is required" });
  if (!isNonEmptyString(profileKey)) issues.push({ field: "profileKey", reason: "profileKey is required" });
  if (!isNonEmptyString(tempCode)) issues.push({ field: "tempCode", reason: "tempCode is required" });
  if (!isValidTempBtn1(tempBtn1)) issues.push({ field: "tempBtn1", reason: "tempBtn1 must be string or object" });
  if (failFlag !== undefined && typeof failFlag !== "number") issues.push({ field: "failFlag", reason: "failFlag must be number" });
  if (smsGubn !== "Y" && smsGubn !== "N") issues.push({ field: "smsGubn", reason: "smsGubn must be 'Y' or 'N'" });
  if (!isOptionalString(title)) issues.push({ field: "title", reason: "title must be string" });
  if (!isOptionalString(ketc1)) issues.push({ field: "ketc1", reason: "ketc1 must be string" });
  if (!isOptionalString(ketc2)) issues.push({ field: "ketc2", reason: "ketc2 must be string" });
  if (!isOptionalString(idempotencyKey)) issues.push({ field: "idempotencyKey", reason: "idempotencyKey must be string" });

  if (isNonEmptyString(message) && message.length > 1000) {
    issues.push({ field: "message", reason: "message must be 1000 chars or less for ALIMTALK" });
  }

  if (isNonEmptyString(title) && Buffer.byteLength(title, "utf8") > 20) {
    issues.push({ field: "title", reason: "title must be 20 bytes or less" });
  }

  if (isNonEmptyString(ketc1) && Buffer.byteLength(ketc1, "utf8") > 160) {
    issues.push({ field: "ketc1", reason: "ketc1 must be 160 bytes or less" });
  }

  if (isNonEmptyString(ketc2) && Buffer.byteLength(ketc2, "utf8") > 160) {
    issues.push({ field: "ketc2", reason: "ketc2 must be 160 bytes or less" });
  }

  if (source.reservedTime !== undefined) {
    issues.push({ field: "reservedTime", reason: "reservedTime is not allowed in kakao send endpoint" });
  }

  if (issues.length > 0) {
    return { success: false, issues };
  }

  return {
    success: true,
    data: {
      clientCode: String(clientCode).trim(),
      messageType: "ALIMTALK",
      recipientPhone: String(recipientPhone).trim(),
      senderKey: String(senderKey).trim(),
      message: String(message),
      profileKey: String(profileKey).trim(),
      tempCode: String(tempCode).trim(),
      smsGubn: smsGubn as "Y" | "N",
      ...(isNonEmptyString(title) ? { title: title.trim() } : {}),
      ...(tempBtn1 !== undefined ? { tempBtn1: tempBtn1 as string | Record<string, unknown> } : {}),
      ...(typeof failFlag === "number" ? { failFlag } : {}),
      ...(isNonEmptyString(ketc1) ? { ketc1: ketc1.trim() } : {}),
      ...(isNonEmptyString(ketc2) ? { ketc2: ketc2.trim() } : {}),
      ...(isNonEmptyString(idempotencyKey) ? { idempotencyKey: idempotencyKey.trim() } : {}),
    },
  };
};
