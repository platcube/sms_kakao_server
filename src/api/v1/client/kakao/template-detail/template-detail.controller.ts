import { Request, Response } from "express";

import { getKakaoTemplateDetail } from "@/api/v1/client/kakao/template-detail/template-detail.service";
import { GetKakaoTemplateDetailQueryDto } from "@/api/v1/client/kakao/template-detail/dto/get-kakao-template-detail.dto";

export const kakaoTemplateDetailController = async (req: Request, res: Response) => {
  const validatedQuery = res.locals.validatedQuery as GetKakaoTemplateDetailQueryDto;
  const templateCodeRaw = req.params.templateCode;
  const templateCode = Array.isArray(templateCodeRaw) ? templateCodeRaw[0] ?? "" : templateCodeRaw ?? "";
  const data = await getKakaoTemplateDetail(templateCode, validatedQuery);

  return res.status(200).json({
    success: true,
    data,
    error: null,
  });
};
