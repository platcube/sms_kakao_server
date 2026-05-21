import { Router } from "express";

import { brandTalkScheduleController } from "@/api/v1/client/kakao/brand/schedule/schedule.controller";
import { parseBrandTalkScheduleBody } from "@/api/v1/client/kakao/brand/schedule/schedule.schema";
import { clientBodyApiKeyAuth } from "@/libs/auth/clientBodyApiKeyAuth";
import { validateBody } from "@/libs/validation/validate";

export const brandTalkScheduleRouter = Router();

brandTalkScheduleRouter.post(
  "/",
  validateBody(parseBrandTalkScheduleBody),
  clientBodyApiKeyAuth,
  brandTalkScheduleController,
);
