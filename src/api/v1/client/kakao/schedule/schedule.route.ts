import { Router } from "express";

import { kakaoScheduleController } from "@/api/v1/client/kakao/schedule/schedule.controller";
import { parseKakaoScheduleBody } from "@/api/v1/client/kakao/schedule/schedule.schema";
import { clientApiKeyAuth } from "@/libs/auth/clientApiKeyAuth";
import { validateBody } from "@/libs/validation/validate";

export const kakaoScheduleRouter = Router();

kakaoScheduleRouter.post("/", validateBody(parseKakaoScheduleBody), clientApiKeyAuth, kakaoScheduleController);
