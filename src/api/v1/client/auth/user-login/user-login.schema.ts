import { ClientUserLoginBodyDto } from "@/api/v1/client/auth/user-login/dto/user-login.dto";
import { ValidationResult } from "@/libs/validation/validate";

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

const ACCOUNT_REGEX = /^[A-Za-z0-9._@-]{4,120}$/;

// 외주업체 사용자 로그인 요청 body 검증
export const parseClientUserLoginBody = (input: unknown): ValidationResult<ClientUserLoginBodyDto> => {
  const source = (input ?? {}) as Record<string, unknown>;
  const issues: { field: string; reason: string }[] = [];

  const account = source.account;
  const password = source.password;

  if (!isNonEmptyString(account) || !ACCOUNT_REGEX.test(account.trim())) {
    issues.push({
      field: "account",
      reason: "account must be 4-120 chars (A-Z, a-z, 0-9, ., _, @, -)",
    });
  }

  if (!isNonEmptyString(password)) {
    issues.push({ field: "password", reason: "password is required" });
  } else if (password.length < 8 || password.length > 100) {
    issues.push({ field: "password", reason: "password must be between 8 and 100 chars" });
  }

  if (issues.length > 0) {
    return { success: false, issues };
  }

  return {
    success: true,
    data: {
      account: String(account).trim(),
      password: String(password),
    },
  };
};
