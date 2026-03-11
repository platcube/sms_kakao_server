import { Request, Response } from "express";

import { ScheduleMessageBodyDto } from "@/api/v1/client/messages/schedule/dto/schedule-message.dto";
import { scheduleMessage } from "@/api/v1/client/messages/schedule/schedule.service";

// SMS/LMS 예약 발송 요청 컨트롤러
export const scheduleMessageController = async (_req: Request, res: Response) => {
  const validatedBody = res.locals.validatedBody as ScheduleMessageBodyDto;
  const data = await scheduleMessage(validatedBody);

  return res.status(200).json({
    success: true,
    data,
    error: null,
  });
};
