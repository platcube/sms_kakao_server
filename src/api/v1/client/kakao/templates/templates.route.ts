import { Router } from "express";

import { kakaoTemplatesController } from "@/api/v1/client/kakao/templates/templates.controller";
import { parseKakaoTemplatesQuery } from "@/api/v1/client/kakao/templates/templates.schema";
import { clientUserAuth } from "@/libs/auth/clientUserAuth";
import { validateQuery } from "@/libs/validation/validate";

export const templatesRouter = Router();

templatesRouter.get("/", validateQuery(parseKakaoTemplatesQuery), clientUserAuth, kakaoTemplatesController);
