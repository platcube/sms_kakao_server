import { Router } from "express";

import { clientUserSignupController } from "@/api/v1/client/auth/user-signup/user-signup.controller";
import { parseClientUserSignupBody } from "@/api/v1/client/auth/user-signup/user-signup.schema";
import { validateBody } from "@/libs/validation/validate";

export const clientUserSignupRouter = Router();

clientUserSignupRouter.post("/", validateBody(parseClientUserSignupBody), clientUserSignupController);
