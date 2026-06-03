import { Router } from "express";

import {
  testPrcompanySendResultController,
  testSendResultWebhookController,
  testSyncSendResultController,
} from "@/api/v1/test/send-result/send-result.controller";
import {
  parseTestPrcompanySendResultBody,
  parseTestSendResultWebhookBody,
  parseTestSyncSendResultBody,
} from "@/api/v1/test/send-result/send-result.schema";
import { validateBody } from "@/libs/validation/validate";

export const testSendResultRouter = Router();

testSendResultRouter.post("/", validateBody(parseTestPrcompanySendResultBody), testPrcompanySendResultController);
testSendResultRouter.post("/sync", validateBody(parseTestSyncSendResultBody), testSyncSendResultController);
testSendResultRouter.post("/webhook", validateBody(parseTestSendResultWebhookBody), testSendResultWebhookController);
