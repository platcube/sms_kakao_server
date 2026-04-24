import { Request, Response } from "express";

import { getKakaoProfile } from "@/api/v1/client/kakao/profile/profile.service";
import { GetKakaoProfileQueryDto } from "@/api/v1/client/kakao/profile/dto/get-kakao-profile.dto";

export const kakaoProfileController = async (_req: Request, res: Response) => {
  const validatedQuery = res.locals.validatedQuery as GetKakaoProfileQueryDto;
  const data = await getKakaoProfile(validatedQuery);

  return res.status(200).json({
    success: true,
    data,
    error: null,
  });
};
