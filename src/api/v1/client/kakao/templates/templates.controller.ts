import { Request, Response } from "express";

import { listKakaoTemplates } from "@/api/v1/client/kakao/templates/templates.service";
import { ListKakaoTemplatesQueryDto } from "@/api/v1/client/kakao/templates/dto/list-kakao-templates.dto";

export const kakaoTemplatesController = async (_req: Request, res: Response) => {
  const validatedQuery = res.locals.validatedQuery as ListKakaoTemplatesQueryDto;
  const data = await listKakaoTemplates(validatedQuery);

  return res.status(200).json({
    success: true,
    data,
    error: null,
  });
};
