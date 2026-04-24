import { Request, Response } from "express";

import { ClientUserSignupBodyDto } from "@/api/v1/client/auth/user-signup/dto/user-signup.dto";
import { signupClientUser } from "@/api/v1/client/auth/user-signup/user-signup.service";

// 외주업체 회원가입 컨트롤러
export const clientUserSignupController = async (_req: Request, res: Response) => {
  const validatedBody = res.locals.validatedBody as ClientUserSignupBodyDto;
  const data = await signupClientUser(validatedBody);

  return res.status(201).json({
    success: true,
    data,
    error: null,
  });
};
