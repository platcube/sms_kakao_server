import { Router } from "express";

import { kakaoTemplateButton2Controller } from "@/api/v1/client/kakao/template-button2/template-button2.controller";
import { parseKakaoTemplateButton2Query } from "@/api/v1/client/kakao/template-button2/template-button2.schema";
import { clientUserAuth } from "@/libs/auth/clientUserAuth";
import { validateQuery } from "@/libs/validation/validate";

export const templateButton2Router = Router({ mergeParams: true });

templateButton2Router.get(
  "/",
  validateQuery(parseKakaoTemplateButton2Query),
  clientUserAuth,
  kakaoTemplateButton2Controller,
);
