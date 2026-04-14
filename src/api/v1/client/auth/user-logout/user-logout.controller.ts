import { Request, Response } from "express";

import { logoutClientUser } from "@/api/v1/client/auth/user-logout/user-logout.service";

// 외주업체 사용자 로그아웃 컨트롤러
export const clientUserLogoutController = async (_req: Request, res: Response) => {
  const data = await logoutClientUser();

  return res.status(200).json({
    success: true,
    data,
    error: null,
  });
};
