import { Router } from "express";

import { profileRouter } from "@/api/v1/client/kakao/profile/profile.route";
import { templateButton1Router } from "@/api/v1/client/kakao/template-button1/template-button1.route";
import { templateButton2Router } from "@/api/v1/client/kakao/template-button2/template-button2.route";
import { templateDetailRouter } from "@/api/v1/client/kakao/template-detail/template-detail.route";
import { templatesRouter } from "@/api/v1/client/kakao/templates/templates.route";

export const clientKakaoRouter = Router();

clientKakaoRouter.use("/profile", profileRouter);
clientKakaoRouter.use("/templates", templatesRouter);
clientKakaoRouter.use("/templates/:templateCode/button1", templateButton1Router);
clientKakaoRouter.use("/templates/:templateCode/button2", templateButton2Router);
clientKakaoRouter.use("/templates/:templateCode", templateDetailRouter);
