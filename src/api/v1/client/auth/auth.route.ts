import { Router } from "express";

import { clientUserLoginRouter } from "@/api/v1/client/auth/user-login/user-login.route";
import { clientUserLogoutRouter } from "@/api/v1/client/auth/user-logout/user-logout.route";
import { clientUserMeRouter } from "@/api/v1/client/auth/user-me/user-me.route";
import { clientUserRefreshRouter } from "@/api/v1/client/auth/user-refresh/user-refresh.route";
import { clientUserSignupRouter } from "@/api/v1/client/auth/user-signup/user-signup.route";

export const clientAuthRouter = Router();

clientAuthRouter.use("/user-signup", clientUserSignupRouter);
clientAuthRouter.use("/user-login", clientUserLoginRouter);
clientAuthRouter.use("/user-refresh", clientUserRefreshRouter);
clientAuthRouter.use("/user-logout", clientUserLogoutRouter);
clientAuthRouter.use("/user-me", clientUserMeRouter);
