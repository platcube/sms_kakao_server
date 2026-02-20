import { NextFunction, Request, RequestHandler, Response } from "express";

export type ValidationIssue = {
  field: string;
  reason: string;
};

export type ValidationResult<T> = { success: true; data: T } | { success: false; issues: ValidationIssue[] };

export type ValidationParser<T> = (input: unknown) => ValidationResult<T>;

export const validateQuery =
  <T>(parser: ValidationParser<T>): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    const parsed = parser(req.query);
    console.log("parsed:", parsed);

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
