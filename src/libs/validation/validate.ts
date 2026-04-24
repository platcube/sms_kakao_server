import { NextFunction, Request, RequestHandler, Response } from "express";

export type ValidationIssue = {
  field: string;
  reason: string;
};

export type ValidationResult<T> = { success: true; data: T } | { success: false; issues: ValidationIssue[] };

export type ValidationParser<T> = (input: unknown) => ValidationResult<T>;

// 요청 body 검증 미들웨어 생성 함수
export const validateQuery =
  <T>(parser: ValidationParser<T>): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    const parsed = parser(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: "COMMON_400_VALIDATION",
          message: "Request validation failed",
          details: parsed.issues,
        },
      });
    }

    res.locals.validatedQuery = parsed.data;
    return next();
  };

// 요청 body 검증 미들웨어
export const validateBody =
  <T>(parser: ValidationParser<T>): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    const parsed = parser(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: "COMMON_400_VALIDATION",
          message: "Request validation failed",
          details: parsed.issues,
        },
      });
    }

    res.locals.validatedBody = parsed.data;
    return next();
  };
