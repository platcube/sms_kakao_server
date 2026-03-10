import { Request, Response } from "express";

import { sendSmsMessage } from "@/api/v1/client/messages/send/send.service";
import { SendMessageBodyDto } from "@/api/v1/client/messages/send/dto/send-message.dto";

// SMS 발송 요청 컨트롤러
export const sendMessageController = async (_req: Request, res: Response) => {
  const validatedBody = res.locals.validatedBody as SendMessageBodyDto;
  const data = await sendSmsMessage(validatedBody);

  return res.status(200).json({
    success: true,
    data,
    error: null,
  });
};
