import express from "express";
import cors from "cors";
import helmet from "helmet";

import { apiV1Router } from "@/api";
import { setupSwagger } from "@/docs/swagger";
import { corsOptions } from "./libs/corsOptions";

export const createApp = () => {
  const app = express();

  app.use(cors(corsOptions));
  app.use(helmet({ contentSecurityPolicy: process.env.NODE_ENV === "production" }));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  setupSwagger(app);
  app.use("/api/v1", apiV1Router);

  return app;
};
