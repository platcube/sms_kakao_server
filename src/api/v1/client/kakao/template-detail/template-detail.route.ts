import { Router } from "express";

import { kakaoTemplateDetailController } from "@/api/v1/client/kakao/template-detail/template-detail.controller";
import { parseKakaoTemplateDetailQuery } from "@/api/v1/client/kakao/template-detail/template-detail.schema";
import { clientApiKeyAuth } from "@/libs/auth/clientApiKeyAuth";
import { validateQuery } from "@/libs/validation/validate";

export const templateDetailRouter = Router({ mergeParams: true });

templateDetailRouter.get(
  "/",
  validateQuery(parseKakaoTemplateDetailQuery),
  clientApiKeyAuth,
  kakaoTemplateDetailController,
);
