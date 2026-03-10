import { Router } from "express";

import { clientRouter } from "@/api/system/client/client.route";
import { healthRouter } from "@/api/system/health/health.route";
import { clientKakaoRouter } from "@/api/v1/client/kakao/kakao.route";
import { clientMessagesRouter } from "@/api/v1/client/messages/messages.route";

export const apiV1Router = Router();

apiV1Router.use("/health", healthRouter);
apiV1Router.use("/system/client", clientRouter);
apiV1Router.use("/client/messages", clientMessagesRouter);
apiV1Router.use("/client/kakao", clientKakaoRouter);
