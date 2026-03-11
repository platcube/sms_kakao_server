import { Router } from "express";
import { scheduleMessageController } from "@/api/v1/client/messages/schedule/schedule.controller";
import { parseScheduleMessageBody } from "@/api/v1/client/messages/schedule/schedule.schema";
import { clientApiKeyAuth } from "@/libs/auth/clientApiKeyAuth";
import { validateBody } from "@/libs/validation/validate";

export const scheduleRouter = Router();

// SMS/LMS 예약 발송 요청 엔드포인트
scheduleRouter.post("/", validateBody(parseScheduleMessageBody), clientApiKeyAuth, scheduleMessageController);
