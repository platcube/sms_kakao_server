import { Router } from "express";

import { kakaoSendController } from "@/api/v1/client/kakao/send/send.controller";
import { parseKakaoSendBody } from "@/api/v1/client/kakao/send/send.schema";
import { clientApiKeyAuth } from "@/libs/auth/clientApiKeyAuth";
import { validateBody } from "@/libs/validation/validate";

export const kakaoSendRouter = Router();

kakaoSendRouter.post("/", validateBody(parseKakaoSendBody), clientApiKeyAuth, kakaoSendController);
