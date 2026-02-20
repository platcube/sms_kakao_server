import { NextFunction, Request, Response } from "express";

import { AppError } from "@/libs/error/app-error";
import { ERROR_CODES } from "@/libs/error/error-codes";

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction) => {
  return next(new AppError(404, ERROR_CODES.COMMON_404_NOT_FOUND, "Resource not found"));
};
