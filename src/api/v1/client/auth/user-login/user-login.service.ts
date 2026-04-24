import {
  ClientUserLoginBodyDto,
  ClientUserLoginContextDto,
  ClientUserLoginServiceResultDto,
} from "@/api/v1/client/auth/user-login/dto/user-login.dto";
import { authConfig } from "@/config/auth.config";
import { verifyPassword } from "@/libs/auth/password";
import {
  createClientAccessToken,
  createClientRefreshToken,
  getRefreshTokenExpiresAt,
  hashRefreshToken,
} from "@/libs/auth/token";
import { AppError } from "@/libs/error/app-error";
import { ERROR_CODES } from "@/libs/error/error-codes";
import { prisma } from "@/libs/prisma/client";

const INVALID_LOGIN_MESSAGE = "계정 또는 비밀번호가 올바르지 않습니다.";

// 외주업체 사용자 로그인 서비스
// - account/password를 검증하고 accessToken과 refreshToken 발급
// - refreshToken은 원문이 아닌 해시값만 DB에 저장
export const loginClientUser = async (
  input: ClientUserLoginBodyDto,
  context: ClientUserLoginContextDto,
): Promise<ClientUserLoginServiceResultDto> => {
  const clientUser = await prisma.clientUser.findUnique({
    where: { account: input.account },
    include: {
      client: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (!clientUser) {
    throw new AppError(401, ERROR_CODES.AUTH_401_UNAUTHORIZED, INVALID_LOGIN_MESSAGE);
  }

  if (clientUser.status !== "ACTIVE" || clientUser.client.status !== "ACTIVE") {
    throw new AppError(401, ERROR_CODES.AUTH_401_UNAUTHORIZED, "사용할 수 없는 계정입니다.");
  }

  const isValidPassword = verifyPassword({
    plainPassword: input.password,
    salt: clientUser.salt,
    hashedPassword: clientUser.password,
  });

  if (!isValidPassword) {
    throw new AppError(401, ERROR_CODES.AUTH_401_UNAUTHORIZED, INVALID_LOGIN_MESSAGE);
  }

  const tokenPayload = {
    userId: clientUser.id,
    clientId: clientUser.clientId,
    account: clientUser.account,
  };
  const accessToken = createClientAccessToken({
    payload: tokenPayload,
    secret: authConfig.clientAccessTokenSecret,
    expiresInMs: authConfig.clientAccessTokenExpiresInMs,
  });
  const refreshToken = createClientRefreshToken({
    payload: tokenPayload,
    secret: authConfig.clientRefreshTokenSecret,
    expiresInMs: authConfig.clientRefreshTokenExpiresInMs,
  });

  await prisma.$transaction([
    prisma.clientUser.update({
      where: { id: clientUser.id },
      data: { lastLoginAt: new Date() },
    }),
    prisma.clientRefreshToken.create({
      data: {
        refreshToken: hashRefreshToken(refreshToken),
        expiresAt: getRefreshTokenExpiresAt(authConfig.clientRefreshTokenExpiresInMs),
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
        clientUserId: clientUser.id,
      },
    }),
  ]);

  return {
    accessToken,
    refreshToken,
  };
};
