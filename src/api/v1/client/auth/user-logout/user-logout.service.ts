import {
  ClientUserLogoutContextDto,
  ClientUserLogoutResponseDto,
} from "@/api/v1/client/auth/user-logout/dto/user-logout.dto";
import { hashRefreshToken } from "@/libs/auth/token";
import { prisma } from "@/libs/prisma/client";

// 외주업체 사용자 로그아웃
// - refreshToken 쿠키가 있으면 DB의 활성 토큰 폐기
// - 쿠키가 없거나 이미 폐기된 토큰이어도 로그아웃 응답은 성공으로 반환
export const logoutClientUser = async (context: ClientUserLogoutContextDto): Promise<ClientUserLogoutResponseDto> => {
  if (!context.refreshToken) {
    return { loggedOut: true };
  }

  await prisma.clientRefreshToken.updateMany({
    where: {
      refreshToken: hashRefreshToken(context.refreshToken),
      status: "ACTIVE",
      revokedAt: null,
    },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
    },
  });

  return { loggedOut: true };
};
