import { Router } from "express";

import { kakaoProfileController } from "@/api/v1/client/kakao/profile/profile.controller";
import { parseKakaoProfileQuery } from "@/api/v1/client/kakao/profile/profile.schema";
import { clientUserAuth } from "@/libs/auth/clientUserAuth";
import { validateQuery } from "@/libs/validation/validate";

export const profileRouter = Router();

profileRouter.get("/", validateQuery(parseKakaoProfileQuery), clientUserAuth, kakaoProfileController);
