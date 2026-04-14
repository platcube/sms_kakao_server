import { Request, Response } from "express";

import { ClientUserLoginBodyDto } from "@/api/v1/client/auth/user-login/dto/user-login.dto";
import { loginClientUser } from "@/api/v1/client/auth/user-login/user-login.service";

// 외주업체 사용자 로그인 컨트롤러
export const clientUserLoginController = async (_req: Request, res: Response) => {
  const validatedBody = res.locals.validatedBody as ClientUserLoginBodyDto;
  const data = await loginClientUser(validatedBody);

  return res.status(200).json({
    success: true,
    data,
    error: null,
  });
};
