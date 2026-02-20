import { NextFunction, Request, Response } from "express";

import { AppError } from "@/libs/error/app-error";
import { ERROR_CODES } from "@/libs/error/error-codes";

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false,
      data: null,
      error: {
        code: err.code,
        message: err.message,
        details: err.details ?? null
      }
    });
  }

  return res.status(500).json({
    success: false,
    data: null,
    error: {
      code: ERROR_CODES.COMMON_500_INTERNAL,
      message: "Internal server error"
    }
  });
};
