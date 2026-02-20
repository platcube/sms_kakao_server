import { Router } from "express";

import { healthRouter } from "@/api/system/health/health.route";

export const apiV1Router = Router();

apiV1Router.use("/health", healthRouter);
