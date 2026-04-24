import { Router } from "express";

import { kakaoTemplateDetailController } from "@/api/v1/client/kakao/template-detail/template-detail.controller";
import { parseKakaoTemplateDetailQuery } from "@/api/v1/client/kakao/template-detail/template-detail.schema";
import { clientUserAuth } from "@/libs/auth/clientUserAuth";
import { validateQuery } from "@/libs/validation/validate";

export const templateDetailRouter = Router({ mergeParams: true });

templateDetailRouter.get(
  "/",
  validateQuery(parseKakaoTemplateDetailQuery),
  clientUserAuth,
  kakaoTemplateDetailController,
);
