import { Request, Response } from "express";

import { SendBrandTalkBodyDto } from "@/api/v1/client/kakao/brand/send/dto/send-brandtalk.dto";
import { sendBrandTalkMessage } from "@/api/v1/client/kakao/brand/send/send.service";

export const brandTalkSendController = async (_req: Request, res: Response) => {
  const validatedBody = res.locals.validatedBody as SendBrandTalkBodyDto;
  const data = await sendBrandTalkMessage(validatedBody);

  return res.status(200).json({
    success: true,
    data,
    error: null,
  });
};
