import {
  ClientUserLoginBodyDto,
  ClientUserLoginResponseDto,
} from "@/api/v1/client/auth/user-login/dto/user-login.dto";

// 외주업체 사용자 로그인 서비스 자리입니다.
export const loginClientUser = async (
  _input: ClientUserLoginBodyDto,
): Promise<ClientUserLoginResponseDto> => {
  throw new Error("loginClientUser is not implemented yet");
};
