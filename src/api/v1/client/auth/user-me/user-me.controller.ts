import { Request, Response } from "express";

import { ClientUserMeAuthDto } from "@/api/v1/client/auth/user-me/dto/user-me.dto";
import { getClientUserMe } from "@/api/v1/client/auth/user-me/user-me.service";

// 외주업체 사용자 본인 정보 조회 컨트롤러
export const clientUserMeController = async (_req: Request, res: Response) => {
  const authUser = res.locals.authClientUser as ClientUserMeAuthDto;
  const data = await getClientUserMe(authUser);

  return res.status(200).json({
    success: true,
    data,
    error: null,
  });
};
