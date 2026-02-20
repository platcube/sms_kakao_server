import { Router } from "express";

import { healthController } from "@/api/system/health/health.controller";
import { parseHealthQuery } from "@/api/system/health/health.schema";
import { validateQuery } from "@/libs/validation/validate";

export const healthRouter = Router();

healthRouter.get("/", validateQuery(parseHealthQuery), healthController);
