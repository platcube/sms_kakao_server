import { Request, Response } from "express";

import { getKakaoTemplateButton2 } from "@/api/v1/client/kakao/template-button2/template-button2.service";
import { GetKakaoTemplateButton2QueryDto } from "@/api/v1/client/kakao/template-button2/dto/get-kakao-template-button2.dto";

export const kakaoTemplateButton2Controller = async (req: Request, res: Response) => {
  const validatedQuery = res.locals.validatedQuery as GetKakaoTemplateButton2QueryDto;
  const templateCodeRaw = req.params.templateCode;
  const templateCode = Array.isArray(templateCodeRaw) ? templateCodeRaw[0] ?? "" : templateCodeRaw ?? "";
  const data = await getKakaoTemplateButton2(templateCode, validatedQuery);

  return res.status(200).json({
    success: true,
    data,
    error: null,
  });
};
