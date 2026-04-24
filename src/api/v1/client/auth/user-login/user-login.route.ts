import { Router } from "express";

import { clientUserLoginController } from "@/api/v1/client/auth/user-login/user-login.controller";
import { parseClientUserLoginBody } from "@/api/v1/client/auth/user-login/user-login.schema";
import { validateBody } from "@/libs/validation/validate";

export const clientUserLoginRouter = Router();

clientUserLoginRouter.post("/", validateBody(parseClientUserLoginBody), clientUserLoginController);
