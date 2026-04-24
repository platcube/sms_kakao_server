import {
  ClientUserRefreshContextDto,
  ClientUserRefreshServiceResultDto,
} from "@/api/v1/client/auth/user-refresh/dto/user-refresh.dto";
import { authConfig } from "@/config/auth.config";
import {
  createClientAccessToken,
  createClientRefreshToken,
  getRefreshTokenExpiresAt,
  hashRefreshToken,
  verifySignedToken,
} from "@/libs/auth/token";
import { AppError } from "@/libs/error/app-error";
import { ERROR_CODES } from "@/libs/error/error-codes";
import { prisma } from "@/libs/prisma/client";

const INVALID_REFRESH_TOKEN_MESSAGE = "유효하지 않은 리프레시 토큰입니다.";

// 외주업체 사용자 토큰 재발급 서비스
// - 쿠키로 받은 refreshToken 검증
// - DB에 저장된 해시와 매칭 후 기존 토큰을 폐기하고 새 refreshToken으로 교체
export const refreshClientUserToken = async (
  context: ClientUserRefreshContextDto,
): Promise<ClientUserRefreshServiceResultDto> => {
  let payload: ReturnType<typeof verifySignedToken>;

  try {
    payload = verifySignedToken(context.refreshToken, {
      secret: authConfig.clientRefreshTokenSecret,
      expectedType: "refresh",
    });
  } catch {
    throw new AppError(401, ERROR_CODES.AUTH_401_UNAUTHORIZED, INVALID_REFRESH_TOKEN_MESSAGE);
  }

  const refreshTokenHash = hashRefreshToken(context.refreshToken);
  const storedRefreshToken = await prisma.clientRefreshToken.findUnique({
    where: { refreshToken: refreshTokenHash },
    include: {
      clientUser: {
        include: {
          client: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!storedRefreshToken) {
    throw new AppError(401, ERROR_CODES.AUTH_401_UNAUTHORIZED, INVALID_REFRESH_TOKEN_MESSAGE);
  }

  const isExpired = storedRefreshToken.expiresAt.getTime() <= Date.now();
  const isRevoked = storedRefreshToken.status !== "ACTIVE" || storedRefreshToken.revokedAt !== null;

  if (isExpired || isRevoked) {
    throw new AppError(401, ERROR_CODES.AUTH_401_UNAUTHORIZED, INVALID_REFRESH_TOKEN_MESSAGE);
  }

  if (
    storedRefreshToken.clientUserId !== payload.userId ||
    storedRefreshToken.clientUser.clientId !== payload.clientId ||
    storedRefreshToken.clientUser.account !== payload.account
  ) {
    throw new AppError(401, ERROR_CODES.AUTH_401_UNAUTHORIZED, INVALID_REFRESH_TOKEN_MESSAGE);
  }

  if (storedRefreshToken.clientUser.status !== "ACTIVE" || storedRefreshToken.clientUser.client.status !== "ACTIVE") {
    throw new AppError(401, ERROR_CODES.AUTH_401_UNAUTHORIZED, "사용할 수 없는 계정입니다.");
  }

  const tokenPayload = {
    userId: storedRefreshToken.clientUser.id,
    clientId: storedRefreshToken.clientUser.clientId,
    account: storedRefreshToken.clientUser.account,
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

  const createdRefreshToken = await prisma.clientRefreshToken.create({
    data: {
      refreshToken: hashRefreshToken(refreshToken),
      expiresAt: getRefreshTokenExpiresAt(authConfig.clientRefreshTokenExpiresInMs),
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
      clientUserId: storedRefreshToken.clientUserId,
    },
  });

  await prisma.clientRefreshToken.update({
    where: { id: storedRefreshToken.id },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
      replacedById: createdRefreshToken.id,
    },
  });

  return {
    accessToken,
    refreshToken,
  };
};
