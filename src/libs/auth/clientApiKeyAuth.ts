import crypto from "crypto";
import { NextFunction, Request, Response } from "express";

import { prisma } from "@/libs/prisma/client";

const sha256Hex = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

const parseAuthorizationHeader = (authorization: string | undefined) => {
  if (!authorization) return null;

  const trimmed = authorization.trim();
  if (!trimmed) return null;

  // `Authorization: Bearer <apiKey>` 형식을 우선 사용하며, raw token도 허용합니다.
  if (trimmed.toLowerCase().startsWith("bearer ")) {
    return trimmed.slice(7).trim();
  }

  return trimmed;
};

/**
 * 외주사 API Key 인증 미들웨어
 * @param req Authorization 헤더와 clientCode(body/query)를 읽습니다.
 * @param res 인증 실패 시 401 응답을 반환합니다.
 * @param next 인증 성공 시 다음 미들웨어/컨트롤러로 이동합니다.
 */
export const clientApiKeyAuth = async (req: Request, res: Response, next: NextFunction) => {
  const apiKey = parseAuthorizationHeader(req.header("authorization"));
  const body = (req.body ?? {}) as Record<string, unknown>;
  const query = (req.query ?? {}) as Record<string, unknown>;
  const clientCodeRaw = typeof body.clientCode === "string" ? body.clientCode : query.clientCode;
  const clientCode = typeof clientCodeRaw === "string" ? clientCodeRaw.trim() : "";

  if (!apiKey || !clientCode) {
    return res.status(401).json({
      success: false,
      data: null,
      error: {
        code: "AUTH_401_UNAUTHORIZED",
        message: "Authorization header and clientCode are required",
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
