import { Router } from "express";

import { sendMessageController } from "@/api/v1/client/messages/send/send.controller";
import { parseSendMessageBody } from "@/api/v1/client/messages/send/send.schema";
import { clientApiKeyAuth } from "@/libs/auth/clientApiKeyAuth";
import { validateBody } from "@/libs/validation/validate";

export const sendRouter = Router();

// SMS 즉시 발송 요청 엔드포인트
sendRouter.post("/", validateBody(parseSendMessageBody), clientApiKeyAuth, sendMessageController);
