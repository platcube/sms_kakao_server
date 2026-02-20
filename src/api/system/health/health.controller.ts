import { Request, Response } from "express";

import { getHealth } from "@/api/system/health/health.service";
import { HealthQueryDto } from "@/api/system/health/dto/health.dto";

export const healthController = (_req: Request, res: Response) => {
  const validatedQuery = (res.locals.validatedQuery ?? { verbose: false }) as HealthQueryDto;
  const data = getHealth(validatedQuery);

  return res.status(200).json({
    success: true,
    data,
    error: null,
  });
};
