import { ClientUserSignupBodyDto } from "@/api/v1/client/auth/user-signup/dto/user-signup.dto";
import { ValidationResult } from "@/libs/validation/validate";

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

const CLIENT_CODE_REGEX = /^[A-Za-z0-9_-]{3,50}$/;
const PHONE_REGEX = /^[0-9]{8,20}$/;
const ACCOUNT_REGEX = /^[A-Za-z0-9._@-]{4,120}$/;

// 외주업체 회원가입 요청 body 검증
export const parseClientUserSignupBody = (input: unknown): ValidationResult<ClientUserSignupBodyDto> => {
  const source = (input ?? {}) as Record<string, unknown>;
  const issues: { field: string; reason: string }[] = [];

  const clientCode = source.clientCode;
  const clientName = source.clientName;
  const senderPhone = source.senderPhone;
  const account = source.account;
  const password = source.password;
  const userName = source.userName;

  if (!isNonEmptyString(clientCode) || !CLIENT_CODE_REGEX.test(clientCode.trim())) {
    issues.push({
      field: "clientCode",
      reason: "클라이언트 코드는 3-50자의 영문 대소문자, 숫자, -, _ 조합이어야 합니다.",
    });
  }

  if (!isNonEmptyString(clientName)) {
    issues.push({ field: "clientName", reason: "클라이언트 이름은 필수 입력 항목입니다." });
  } else if (clientName.trim().length > 120) {
    issues.push({ field: "clientName", reason: "클라이언트 이름은 120자 이하여야 합니다." });
  }

  if (!isNonEmptyString(senderPhone) || !PHONE_REGEX.test(senderPhone.trim())) {
    issues.push({
      field: "senderPhone",
      reason: "발신자 전화번호는 8-20자의 숫자로 이루어져야 합니다.",
    });
  }

  if (!isNonEmptyString(account) || !ACCOUNT_REGEX.test(account.trim())) {
    issues.push({
      field: "account",
      reason: "계정명은 4-120자의 영문 대소문자, 숫자, ., _, @, - 조합이어야 합니다.",
    });
  }

  if (!isNonEmptyString(password)) {
    issues.push({ field: "password", reason: "비밀번호는 필수 입력 항목입니다." });
  } else if (password.length < 8 || password.length > 100) {
    issues.push({ field: "password", reason: "비밀번호는 8자 이상 100자 이하여야 합니다." });
  }

  if (!isNonEmptyString(userName)) {
    issues.push({ field: "userName", reason: "사용자 이름은 필수 입력 항목입니다." });
  } else if (userName.trim().length > 120) {
    issues.push({ field: "userName", reason: "사용자 이름은 120자 이하여야 합니다." });
  }

  if (issues.length > 0) {
    return { success: false, issues };
  }

  return {
    success: true,
    data: {
      clientCode: String(clientCode).trim(),
      clientName: String(clientName).trim(),
      senderPhone: String(senderPhone).trim(),
      account: String(account).trim(),
      password: String(password),
      userName: String(userName).trim(),
    },
  };
};
