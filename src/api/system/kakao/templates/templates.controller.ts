import { Request, Response } from "express";

import { RegisterKakaoTemplatesBodyDto } from "@/api/system/kakao/templates/dto/register-kakao-templates.dto";
import { registerKakaoTemplates } from "@/api/system/kakao/templates/templates.service";

// 시스템용 카카오 템플릿 등록 컨트롤러
export const registerKakaoTemplatesController = async (_req: Request, res: Response) => {
  const validatedBody = res.locals.validatedBody as RegisterKakaoTemplatesBodyDto;
  const data = await registerKakaoTemplates(validatedBody);

  return res.status(201).json({
    success: true,
    data,
    error: null,
  });
};
