import { Router } from "express";

import { registerKakaoTemplatesController } from "@/api/system/kakao/templates/templates.controller";
import { parseRegisterKakaoTemplatesBody } from "@/api/system/kakao/templates/templates.schema";
import { validateBody } from "@/libs/validation/validate";

export const kakaoTemplatesRouter = Router();

kakaoTemplatesRouter.post("/register", validateBody(parseRegisterKakaoTemplatesBody), registerKakaoTemplatesController);
