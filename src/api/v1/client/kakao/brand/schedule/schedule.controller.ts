import { Request, Response } from "express";

import { ScheduleBrandTalkBodyDto } from "@/api/v1/client/kakao/brand/schedule/dto/schedule-brandtalk.dto";
import { scheduleBrandTalkMessage } from "@/api/v1/client/kakao/brand/schedule/schedule.service";

export const brandTalkScheduleController = async (_req: Request, res: Response) => {
  const validatedBody = res.locals.validatedBody as ScheduleBrandTalkBodyDto;
  const data = await scheduleBrandTalkMessage(validatedBody);

  return res.status(200).json({
    success: true,
    data,
    error: null,
  });
};
