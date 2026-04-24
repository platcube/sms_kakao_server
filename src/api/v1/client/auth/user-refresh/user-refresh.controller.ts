import { Request, Response } from "express";

import { refreshClientUserToken } from "@/api/v1/client/auth/user-refresh/user-refresh.service";
import { authConfig } from "@/config/auth.config";
import {
  getCookieValue,
  getRefreshTokenClearCookieOptions,
  getRefreshTokenCookieName,
  getRefreshTokenCookieOptions,
} from "@/libs/auth/token";
import { AppError } from "@/libs/error/app-error";
import { ERROR_CODES } from "@/libs/error/error-codes";

const getClientIp = (req: Request): string | undefined => {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string") {
    return forwardedFor.split(",")[0]?.trim();
  }

  return req.ip;
};

// 외주업체 사용자 액세스 토큰 재발급 컨트롤러
export const clientUserRefreshController = async (req: Request, res: Response) => {
  const cookieName = getRefreshTokenCookieName();
  const refreshToken = getCookieValue(req.headers.cookie, cookieName);

  if (!refreshToken) {
    res.clearCookie(cookieName, getRefreshTokenClearCookieOptions());
    throw new AppError(401, ERROR_CODES.AUTH_401_UNAUTHORIZED, "리프레시 토큰 쿠키가 없습니다.");
  }

  const data = await refreshClientUserToken({
    refreshToken,
    userAgent: req.get("user-agent"),
    ipAddress: getClientIp(req),
  });

  res.cookie(cookieName, data.refreshToken, getRefreshTokenCookieOptions(authConfig.clientRefreshTokenExpiresInMs));

  return res.status(200).json({
    success: true,
    data: {
      accessToken: data.accessToken,
    },
    error: null,
  });
};
