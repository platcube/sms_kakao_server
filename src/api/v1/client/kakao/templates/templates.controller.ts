import { Request, Response } from "express";

import { ClientUserMeAuthDto } from "@/api/v1/client/auth/user-me/dto/user-me.dto";
import { listKakaoTemplates } from "@/api/v1/client/kakao/templates/templates.service";
import { ListKakaoTemplatesQueryDto } from "@/api/v1/client/kakao/templates/dto/list-kakao-templates.dto";

export const kakaoTemplatesController = async (_req: Request, res: Response) => {
  const authClientUser = res.locals.authClientUser as ClientUserMeAuthDto;
  const validatedQuery = res.locals.validatedQuery as ListKakaoTemplatesQueryDto;
  const data = await listKakaoTemplates(authClientUser, validatedQuery);

  return res.status(200).json({
    success: true,
    data,
    error: null,
  });
};
