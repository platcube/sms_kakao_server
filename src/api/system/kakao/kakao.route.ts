import { Router } from "express";

import { kakaoTemplatesRouter } from "@/api/system/kakao/templates/templates.route";

export const systemKakaoRouter = Router();

systemKakaoRouter.use("/templates", kakaoTemplatesRouter);
