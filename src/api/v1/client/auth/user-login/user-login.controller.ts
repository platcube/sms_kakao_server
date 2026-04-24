import { Request, Response } from "express";

import { ClientUserLoginBodyDto } from "@/api/v1/client/auth/user-login/dto/user-login.dto";
import { loginClientUser } from "@/api/v1/client/auth/user-login/user-login.service";
import { authConfig } from "@/config/auth.config";
import { getRefreshTokenCookieName, getRefreshTokenCookieOptions } from "@/libs/auth/token";

const getClientIp = (req: Request): string | undefined => {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string") {
    return forwardedFor.split(",")[0]?.trim();
  }

  return req.ip;
};

// 외주업체 사용자 로그인 컨트롤러
export const clientUserLoginController = async (req: Request, res: Response) => {
  const validatedBody = res.locals.validatedBody as ClientUserLoginBodyDto;
  const data = await loginClientUser(validatedBody, {
    userAgent: req.get("user-agent"),
    ipAddress: getClientIp(req),
  });

  res.cookie(
    getRefreshTokenCookieName(),
    data.refreshToken,
    getRefreshTokenCookieOptions(authConfig.clientRefreshTokenExpiresInMs),
  );

  return res.status(200).json({
    success: true,
    data: {
      accessToken: data.accessToken,
    },
    error: null,
  });
};
