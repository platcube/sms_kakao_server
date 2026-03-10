import { Request, Response } from "express";

import { SendKakaoBodyDto } from "@/api/v1/client/kakao/send/dto/send-kakao.dto";
import { sendKakaoMessage } from "@/api/v1/client/kakao/send/send.service";

export const kakaoSendController = async (_req: Request, res: Response) => {
  const validatedBody = res.locals.validatedBody as SendKakaoBodyDto;
  const data = await sendKakaoMessage(validatedBody);

  return res.status(200).json({
    success: true,
    data,
    error: null,
  });
};
