import { validateBody } from "@/libs/validation/validate";
import { Router } from "express";
import { createClientController } from "@/api/system/client/client.controller";
import { parseClientCreateBody } from "@/api/system/client/client.schema";

export const clientRouter = Router();

// 시스템용 Client 생성 엔드포인트
clientRouter.post("/", validateBody(parseClientCreateBody), createClientController);
