import { Router } from "express";

import { clientUserMeController } from "@/api/v1/client/auth/user-me/user-me.controller";

export const clientUserMeRouter = Router();

clientUserMeRouter.get("/", clientUserMeController);
