import { NextFunction, Request, Response } from "express";

import { authConfig } from "@/config/auth.config";
import { verifySignedToken } from "@/libs/auth/token";
import { prisma } from "@/libs/prisma/client";

const parseAuthorizationHeader = (authorization: string | undefined) => {
  if (!authorization) return null;

  const trimmed = authorization.trim();
  if (!trimmed) return null;

  if (trimmed.toLowerCase().startsWith("bearer ")) {
    return trimmed.slice(7).trim();
  }

  return trimmed;
};

// 외주업체 사용자 accessToken 인증 미들웨어
// - user-login에서 발급한 accessToken만 검증합니다.
// - 외부 발송 API용 API Key 인증(clientApiKeyAuth)과 역할이 다르므로 분리해서 사용합니다.
export const clientUserAuth = async (req: Request, res: Response, next: NextFunction) => {
  const accessToken = parseAuthorizationHeader(req.header("authorization"));

  if (!accessToken) {
    return res.status(401).json({
      success: false,
      data: null,
      error: {
        code: "AUTH_401_UNAUTHORIZED",
        message: "Authorization header is required",
      },
    });
  }

  try {
    const payload = verifySignedToken(accessToken, {
      secret: authConfig.clientAccessTokenSecret,
      expectedType: "access",
    });

    const clientUser = await prisma.clientUser.findUnique({
      where: { id: payload.userId },
      include: {
        client: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (
      !clientUser ||
      clientUser.status !== "ACTIVE" ||
      clientUser.client.status !== "ACTIVE" ||
      clientUser.clientId !== payload.clientId ||
      clientUser.account !== payload.account
    ) {
      return res.status(401).json({
        success: false,
        data: null,
        error: {
          code: "AUTH_401_UNAUTHORIZED",
          message: "Invalid user token",
        },
      });
    }

    res.locals.authClientUser = {
      userId: clientUser.id,
      clientId: clientUser.clientId,
      account: clientUser.account,
    };

    return next();
  } catch {
    return res.status(401).json({
      success: false,
      data: null,
      error: {
        code: "AUTH_401_UNAUTHORIZED",
        message: "Invalid user token",
      },
    });
  }
};
