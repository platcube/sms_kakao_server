import { Router } from "express";

import { brandTalkScheduleRouter } from "@/api/v1/client/kakao/brand/schedule/schedule.route";
import { brandTalkSendRouter } from "@/api/v1/client/kakao/brand/send/send.route";

export const brandTalkRouter = Router();

brandTalkRouter.use("/send", brandTalkSendRouter);
brandTalkRouter.use("/schedule", brandTalkScheduleRouter);
