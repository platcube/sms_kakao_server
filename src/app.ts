import express from "express";
import cors from "cors";
import helmet from "helmet";

import { apiV1Router } from "@/api";
import { appConfig } from "@/config/app.config";
import { setupSwagger } from "@/docs/swagger";
import { corsOptions } from "./libs/corsOptions";

export const createApp = () => {
  const app = express();

  app.use(cors(corsOptions));
  app.use(helmet({ contentSecurityPolicy: appConfig.isProd })); // 개발 환경에서는 CSP 완화(Swagger UI가 정상적으로 작동하도록 설정)
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  setupSwagger(app);
  app.use("/api/v1", apiV1Router);

  return app;
};
