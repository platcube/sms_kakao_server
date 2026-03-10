import { Request, Response } from "express";

import { ScheduleKakaoBodyDto } from "@/api/v1/client/kakao/schedule/dto/schedule-kakao.dto";
import { scheduleKakaoMessage } from "@/api/v1/client/kakao/schedule/schedule.service";

export const kakaoScheduleController = async (_req: Request, res: Response) => {
  const validatedBody = res.locals.validatedBody as ScheduleKakaoBodyDto;
  const data = await scheduleKakaoMessage(validatedBody);

  return res.status(200).json({
    success: true,
    data,
    error: null,
  });
};
