import { Router } from "express";

import { healthRouter } from "@/api/system/health/health.route";
import { clientMessagesRouter } from "@/api/v1/client/messages/messages.route";

export const apiV1Router = Router();

apiV1Router.use("/health", healthRouter);
apiV1Router.use("/client/messages", clientMessagesRouter);
