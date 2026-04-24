import { ScheduleMessageBodyDto } from "@/api/v1/client/messages/schedule/dto/schedule-message.dto";
import { ValidationResult } from "@/libs/validation/validate";

const isNonEmptyString = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const isOptionalString = (v: unknown): v is string | undefined => v === undefined || typeof v === "string";
const PHONE_REGEX = /^[0-9]{9,20}$/;
const RESERVED_TIME_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
const MAX_RECIPIENT_COUNT = 100;

const isSupportedMessageType = (v: unknown): v is ScheduleMessageBodyDto["messageType"] => v === "SMS" || v === "LMS";

const parseScheduledAt = (raw: string) => {
  if (RESERVED_TIME_REGEX.test(raw)) {
    const localDate = new Date(raw.replace(" ", "T"));
    return Number.isNaN(localDate.getTime()) ? null : localDate;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

// SMS/LMS 예약 발송 요청 body 검증
export const parseScheduleMessageBody = (input: unknown): ValidationResult<ScheduleMessageBodyDto> => {
  const source = (input ?? {}) as Record<string, unknown>;
  const issues: { field: string; reason: string }[] = [];

  const clientCode = source.clientCode;
  const apiKey = source.apiKey;
  const messageType = source.messageType;
  const recipientPhone = source.recipientPhone;
  const senderKey = source.senderKey;
  const title = source.title;
  const content = source.content;
  const scheduledAt = source.scheduledAt ?? source.reservedTime;
  const idempotencyKey = source.idempotencyKey;
  const etc1 = source.etc1;
  const etc2 = source.etc2;

  const normalizedPhones = Array.isArray(recipientPhone)
    ? recipientPhone.map((v) => (typeof v === "string" ? v.trim() : v))
    : null;

  if (!isNonEmptyString(clientCode)) issues.push({ field: "clientCode", reason: "clientCode is required" });
  if (!isNonEmptyString(apiKey)) issues.push({ field: "apiKey", reason: "apiKey is required" });
  if (!isSupportedMessageType(messageType)) issues.push({ field: "messageType", reason: "messageType must be 'SMS' or 'LMS'" });

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

  if (!isNonEmptyString(senderKey)) issues.push({ field: "senderKey", reason: "senderKey is required" });
  if (!isNonEmptyString(content)) issues.push({ field: "content", reason: "content is required" });
  if (!isNonEmptyString(scheduledAt)) {
    issues.push({ field: "scheduledAt", reason: "scheduledAt (or reservedTime) is required" });
  }
  if (!isOptionalString(title)) issues.push({ field: "title", reason: "title must be string" });
  if (!isOptionalString(idempotencyKey)) issues.push({ field: "idempotencyKey", reason: "idempotencyKey must be string" });
  if (!isOptionalString(etc1)) issues.push({ field: "etc1", reason: "etc1 must be string" });
  if (!isOptionalString(etc2)) issues.push({ field: "etc2", reason: "etc2 must be string" });

  if (isNonEmptyString(content) && messageType === "SMS" && Buffer.byteLength(content, "utf8") > 90) {
    issues.push({ field: "content", reason: "content must be 90 bytes or less for SMS" });
  }

  if (isNonEmptyString(content) && messageType === "LMS" && Buffer.byteLength(content, "utf8") > 2000) {
    issues.push({ field: "content", reason: "content must be 2000 bytes or less for LMS" });
  }

  if (isNonEmptyString(title) && Buffer.byteLength(title, "utf8") > 20) {
    issues.push({ field: "title", reason: "title must be 20 bytes or less" });
  }

  if (isNonEmptyString(etc1) && Buffer.byteLength(etc1, "utf8") > 160) {
    issues.push({ field: "etc1", reason: "etc1 must be 160 bytes or less" });
  }

  if (isNonEmptyString(etc2) && Buffer.byteLength(etc2, "utf8") > 160) {
    issues.push({ field: "etc2", reason: "etc2 must be 160 bytes or less" });
  }

  if (isNonEmptyString(scheduledAt)) {
    const parsedSchedule = parseScheduledAt(scheduledAt.trim());
    if (!parsedSchedule) {
      issues.push({ field: "scheduledAt", reason: "scheduledAt must be valid datetime" });
    } else {
      const minAllowed = Date.now() + 10 * 60 * 1000;
      if (parsedSchedule.getTime() < minAllowed) {
        issues.push({ field: "scheduledAt", reason: "scheduledAt must be at least 10 minutes in the future" });
      }
    }
  }

  if (issues.length > 0) {
    return { success: false, issues };
  }

  return {
    success: true,
    data: {
      clientCode: String(clientCode).trim(),
      apiKey: String(apiKey).trim(),
      messageType: messageType as "SMS" | "LMS",
      recipientPhone: normalizedPhones as string[],
      senderKey: String(senderKey).trim(),
      ...(isNonEmptyString(title) ? { title: title.trim() } : {}),
      content: String(content),
      scheduledAt: String(scheduledAt).trim(),
      ...(isNonEmptyString(idempotencyKey) ? { idempotencyKey: idempotencyKey.trim() } : {}),
      ...(isOptionalString(etc1) && etc1 !== undefined ? { etc1: etc1.trim() } : {}),
      ...(isOptionalString(etc2) && etc2 !== undefined ? { etc2: etc2.trim() } : {}),
    },
  };
};
