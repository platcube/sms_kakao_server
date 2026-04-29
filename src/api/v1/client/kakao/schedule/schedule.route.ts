import { Router } from "express";

import { kakaoScheduleController } from "@/api/v1/client/kakao/schedule/schedule.controller";
import { parseKakaoScheduleBody } from "@/api/v1/client/kakao/schedule/schedule.schema";
import { clientBodyApiKeyAuth } from "@/libs/auth/clientBodyApiKeyAuth";
import { validateBody } from "@/libs/validation/validate";

export const kakaoScheduleRouter = Router();

kakaoScheduleRouter.post("/", validateBody(parseKakaoScheduleBody), clientBodyApiKeyAuth, kakaoScheduleController);
