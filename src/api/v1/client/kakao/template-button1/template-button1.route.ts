import { Router } from "express";

import { kakaoTemplateButton1Controller } from "@/api/v1/client/kakao/template-button1/template-button1.controller";
import { parseKakaoTemplateButton1Query } from "@/api/v1/client/kakao/template-button1/template-button1.schema";
import { clientApiKeyAuth } from "@/libs/auth/clientApiKeyAuth";
import { validateQuery } from "@/libs/validation/validate";

export const templateButton1Router = Router({ mergeParams: true });

templateButton1Router.get(
  "/",
  validateQuery(parseKakaoTemplateButton1Query),
  clientApiKeyAuth,
  kakaoTemplateButton1Controller,
);
