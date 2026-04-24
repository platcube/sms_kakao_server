import { Request, Response } from "express";

import { logoutClientUser } from "@/api/v1/client/auth/user-logout/user-logout.service";
import {
  getCookieValue,
  getRefreshTokenClearCookieOptions,
  getRefreshTokenCookieName,
} from "@/libs/auth/token";

// 외주업체 사용자 로그아웃 컨트롤러
export const clientUserLogoutController = async (req: Request, res: Response) => {
  const cookieName = getRefreshTokenCookieName();
  const refreshToken = getCookieValue(req.headers.cookie, cookieName) ?? undefined;
  const data = await logoutClientUser({ refreshToken });

  res.clearCookie(cookieName, getRefreshTokenClearCookieOptions());

  return res.status(200).json({
    success: true,
    data,
    error: null,
  });
};
