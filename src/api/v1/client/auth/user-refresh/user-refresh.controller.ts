import { Request, Response } from "express";

import { refreshClientUserToken } from "@/api/v1/client/auth/user-refresh/user-refresh.service";

// 외주업체 사용자 액세스 토큰 재발급 컨트롤러
export const clientUserRefreshController = async (_req: Request, res: Response) => {
  const data = await refreshClientUserToken();

  return res.status(200).json({
    success: true,
    data,
    error: null,
  });
};
