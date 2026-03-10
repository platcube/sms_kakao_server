import { ClientCreateBodyDto } from "@/api/system/client/dto/client.dto";
import { ValidationResult } from "@/libs/validation/validate";

const isNonEmptyString = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const isOptionalString = (v: unknown): v is string | undefined => v === undefined || typeof v === "string";

const CLIENT_CODE_REGEX = /^[A-Za-z0-9_-]{3,50}$/;
const PHONE_REGEX = /^[0-9]{8,20}$/;

// 시스템용 Client 생성 요청 body 검증(validation)
export const parseClientCreateBody = (input: unknown): ValidationResult<ClientCreateBodyDto> => {
  const source = (input ?? {}) as Record<string, unknown>;
  const issues: { field: string; reason: string }[] = [];

  const clientCode = source.clientCode;
  const name = source.name;
  const senderPhone = source.senderPhone;
  const status = source.status;

  if (!isNonEmptyString(clientCode) || !CLIENT_CODE_REGEX.test(clientCode.trim())) {
    issues.push({
      field: "clientCode",
      reason: "clientCode must be 3-50 chars (A-Z, a-z, 0-9, _, -)",
    });
  }

  if (!isNonEmptyString(name)) {
    issues.push({ field: "name", reason: "name is required" });
  } else if (name.trim().length > 120) {
    issues.push({ field: "name", reason: "name must be 120 chars or less" });
  }

  if (!isNonEmptyString(senderPhone) || !PHONE_REGEX.test(senderPhone.trim())) {
    issues.push({
      field: "senderPhone",
      reason: "senderPhone must be numeric string (8-20 digits)",
    });
  }

  if (!isOptionalString(status) || (status !== undefined && status !== "ACTIVE" && status !== "INACTIVE")) {
    issues.push({ field: "status", reason: "status must be ACTIVE or INACTIVE" });
  }

  if (issues.length > 0) {
    return { success: false, issues };
  }

  return {
    success: true,
    data: {
      clientCode: String(clientCode).trim(),
      name: String(name).trim(),
      senderPhone: String(senderPhone).trim(),
      ...(status ? { status: status as "ACTIVE" | "INACTIVE" } : {}),
    },
  };
};
