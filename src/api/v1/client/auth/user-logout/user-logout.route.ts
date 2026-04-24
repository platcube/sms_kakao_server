import { Router } from "express";

import { clientUserLogoutController } from "@/api/v1/client/auth/user-logout/user-logout.controller";

export const clientUserLogoutRouter = Router();

clientUserLogoutRouter.post("/", clientUserLogoutController);
