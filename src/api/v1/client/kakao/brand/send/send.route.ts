import { Router } from "express";

import { brandTalkSendController } from "@/api/v1/client/kakao/brand/send/send.controller";
import { parseBrandTalkSendBody } from "@/api/v1/client/kakao/brand/send/send.schema";
import { clientBodyApiKeyAuth } from "@/libs/auth/clientBodyApiKeyAuth";
import { validateBody } from "@/libs/validation/validate";

export const brandTalkSendRouter = Router();

brandTalkSendRouter.post("/", validateBody(parseBrandTalkSendBody), clientBodyApiKeyAuth, brandTalkSendController);
