import { ScheduleBrandTalkBodyDto } from "@/api/v1/client/kakao/brand/schedule/dto/schedule-brandtalk.dto";
import { ValidationResult } from "@/libs/validation/validate";

const PHONE_REGEX = /^[0-9]{9,20}$/;
const SENDER_PHONE_REGEX = /^[0-9]{8,20}$/;
const RESERVED_TIME_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
const MAX_RECIPIENT_COUNT = 100;

const isNonEmptyString = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const isOptionalString = (v: unknown): v is string | undefined => v === undefined || typeof v === "string";

export const parseBrandTalkScheduleBody = (input: unknown): ValidationResult<ScheduleBrandTalkBodyDto> => {
  const source = typeof input === "object" && input !== null && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
  const issues: { field: string; reason: string }[] = [];

  const clientCode = source.clientCode;
  const apiKey = source.apiKey;
  const messageType = source.messageType;
  const recipientPhone = source.recipientPhone;
  const senderPhone = source.senderPhone;
  const message = source.message;
  const title = source.title;
  const profileKey = source.profileKey;
  const failFlag = source.failFlag;
  const smsGubn = source.smsGubn;
  const reservedTime = source.reservedTime;
  const ketc1 = source.ketc1;
  const ketc2 = source.ketc2;
  const idempotencyKey = source.idempotencyKey;

  if (!isNonEmptyString(clientCode)) issues.push({ field: "clientCode", reason: "clientCode is required" });
  if (!isNonEmptyString(apiKey)) issues.push({ field: "apiKey", reason: "apiKey is required" });
  if (messageType !== "BRANDTALK") issues.push({ field: "messageType", reason: "messageType must be 'BRANDTALK'" });

  const normalizedPhones = Array.isArray(recipientPhone)
    ? recipientPhone.map((v) => (typeof v === "string" ? v.trim() : v))
    : null;

  if (!Array.isArray(normalizedPhones) || normalizedPhones.length === 0) {
    issues.push({ field: "recipientPhone", reason: "recipientPhone must be a non-empty array" });
  } else {
    if (normalizedPhones.length > MAX_RECIPIENT_COUNT) {
      issues.push({ field: "recipientPhone", reason: `max ${MAX_RECIPIENT_COUNT} recipients are allowed` });
    }

    normalizedPhones.forEach((phone, index) => {
      if (!isNonEmptyString(phone) || !PHONE_REGEX.test(phone)) {
        issues.push({ field: `recipientPhone[${index}]`, reason: "phone must be numeric string" });
      }
    });
  }

  if (!isNonEmptyString(senderPhone) || !SENDER_PHONE_REGEX.test(senderPhone.trim())) {
    issues.push({ field: "senderPhone", reason: "senderPhone must be numeric string" });
  }
  if (!isNonEmptyString(message)) issues.push({ field: "message", reason: "message is required" });
  if (!isNonEmptyString(profileKey)) issues.push({ field: "profileKey", reason: "profileKey is required" });
  if (failFlag !== undefined && typeof failFlag !== "number") issues.push({ field: "failFlag", reason: "failFlag must be number" });
  if (smsGubn !== "Y" && smsGubn !== "N") issues.push({ field: "smsGubn", reason: "smsGubn must be 'Y' or 'N'" });
  if (!isNonEmptyString(reservedTime) || !RESERVED_TIME_REGEX.test(reservedTime.trim())) {
    issues.push({ field: "reservedTime", reason: "reservedTime must be YYYY-MM-DD HH:mm:ss" });
  }
  if (!isOptionalString(title)) issues.push({ field: "title", reason: "title must be string" });
  if (!isOptionalString(ketc1)) issues.push({ field: "ketc1", reason: "ketc1 must be string" });
  if (!isOptionalString(ketc2)) issues.push({ field: "ketc2", reason: "ketc2 must be string" });
  if (!isOptionalString(idempotencyKey)) issues.push({ field: "idempotencyKey", reason: "idempotencyKey must be string" });

  if (isNonEmptyString(message) && message.length > 1000) {
    issues.push({ field: "message", reason: "message must be 1000 chars or less for BRANDTALK" });
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

  if (issues.length > 0) {
    return { success: false, issues };
  }

  return {
    success: true,
    data: {
      clientCode: String(clientCode).trim(),
      apiKey: String(apiKey).trim(),
      messageType: "BRANDTALK",
      recipientPhone: normalizedPhones as string[],
      senderPhone: String(senderPhone).trim(),
      message: String(message),
      profileKey: String(profileKey).trim(),
      smsGubn: smsGubn as "Y" | "N",
      reservedTime: String(reservedTime).trim(),
      ...(isNonEmptyString(title) ? { title: title.trim() } : {}),
      ...(typeof failFlag === "number" ? { failFlag } : {}),
      ...(isNonEmptyString(ketc1) ? { ketc1: ketc1.trim() } : {}),
      ...(isNonEmptyString(ketc2) ? { ketc2: ketc2.trim() } : {}),
      ...(isNonEmptyString(idempotencyKey) ? { idempotencyKey: idempotencyKey.trim() } : {}),
    },
  };
};
