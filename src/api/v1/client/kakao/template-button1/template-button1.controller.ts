import { Request, Response } from "express";

import { getKakaoTemplateButton1 } from "@/api/v1/client/kakao/template-button1/template-button1.service";
import { GetKakaoTemplateButton1QueryDto } from "@/api/v1/client/kakao/template-button1/dto/get-kakao-template-button1.dto";

export const kakaoTemplateButton1Controller = async (req: Request, res: Response) => {
  const validatedQuery = res.locals.validatedQuery as GetKakaoTemplateButton1QueryDto;
  const templateCodeRaw = req.params.templateCode;
  const templateCode = Array.isArray(templateCodeRaw) ? templateCodeRaw[0] ?? "" : templateCodeRaw ?? "";
  const data = await getKakaoTemplateButton1(templateCode, validatedQuery);

  return res.status(200).json({
    success: true,
    data,
    error: null,
  });
};
