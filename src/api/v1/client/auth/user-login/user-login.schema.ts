import { ClientUserLoginBodyDto } from "@/api/v1/client/auth/user-login/dto/user-login.dto";
import { ValidationResult } from "@/libs/validation/validate";

// 외주업체 사용자 로그인 요청 body 검증 함수 자리입니다.
export const parseClientUserLoginBody = (_input: unknown): ValidationResult<ClientUserLoginBodyDto> => {
  return {
    success: false,
    issues: [
      {
        field: "body",
        reason: "로그인 스키마가 아직 구현되지 않았습니다.",
      },
    ],
  };
};
