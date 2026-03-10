import { Request, Response } from "express";

import { createClient } from "@/api/system/client/client.service";
import { ClientCreateBodyDto } from "@/api/system/client/dto/client.dto";

// 시스템용 Client 생성 컨트롤러
export const createClientController = async (_req: Request, res: Response) => {
  const validatedBody = res.locals.validatedBody as ClientCreateBodyDto;
  const data = await createClient(validatedBody);

  return res.status(201).json({
    success: true,
    data,
    error: null,
  });
};
