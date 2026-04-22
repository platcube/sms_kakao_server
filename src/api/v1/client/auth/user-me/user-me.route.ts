import { Router } from "express";

import { clientUserMeController } from "@/api/v1/client/auth/user-me/user-me.controller";
import { clientUserAuth } from "@/libs/auth/clientUserAuth";

export const clientUserMeRouter = Router();

clientUserMeRouter.get("/", clientUserAuth, clientUserMeController);
