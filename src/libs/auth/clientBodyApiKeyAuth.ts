import crypto from "crypto";
import { NextFunction, Request, Response } from "express";

import { prisma } from "@/libs/prisma/client";

const sha256Hex = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

// 발송 API 전용 body apiKey 인증 미들웨어
// - body.clientCode / body.apiKey를 이용해 실제 클라이언트 API Key를 검증합니다.
// - server-to-server 발송 API에서 accessToken 없이 사용합니다.
export const clientBodyApiKeyAuth = async (req: Request, res: Response, next: NextFunction) => {
  const body = (req.body ?? {}) as Record<string, unknown>;

  const clientCode = typeof body.clientCode === "string" ? body.clientCode.trim() : "";
  const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";

  if (!clientCode || !apiKey) {
    return res.status(401).json({
      success: false,
      data: null,
      error: {
        code: "AUTH_401_UNAUTHORIZED",
        message: "clientCode and apiKey are required",
      },
    });
  }

  const client = await prisma.client.findFirst({
    where: {
      clientCode,
      status: "ACTIVE",
    },
  });

  if (!client) {
    return res.status(401).json({
      success: false,
      data: null,
      error: {
        code: "AUTH_401_UNAUTHORIZED",
        message: "Invalid client credentials",
      },
    });
  }

  const incomingHash = sha256Hex(apiKey).toLowerCase();
  const storedHash = client.apiKeyHash.toLowerCase();

  const isValid =
    incomingHash.length === storedHash.length &&
    crypto.timingSafeEqual(Buffer.from(incomingHash), Buffer.from(storedHash));

  if (!isValid) {
    return res.status(401).json({
      success: false,
      data: null,
      error: {
        code: "AUTH_401_UNAUTHORIZED",
        message: "Invalid client credentials",
      },
    });
  }

  res.locals.authClient = client;
  return next();
};
