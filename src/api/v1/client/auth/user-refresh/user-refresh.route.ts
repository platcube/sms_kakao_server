import { Router } from "express";

import { clientUserRefreshController } from "@/api/v1/client/auth/user-refresh/user-refresh.controller";

export const clientUserRefreshRouter = Router();

clientUserRefreshRouter.post("/", clientUserRefreshController);
