import crypto from "crypto";
import { CookieOptions } from "express";
import { appConfig } from "@/config/app.config";
import { authConfig } from "@/config/auth.config";

const ACCESS_TOKEN = "access";
const REFRESH_TOKEN = "refresh";

export type ClientTokenPayload = {
  userId: number;
  clientId: number;
  account: string;
};

type TokenType = typeof ACCESS_TOKEN | typeof REFRESH_TOKEN;

type SignedTokenPayload = ClientTokenPayload & {
  type: TokenType;
  jti: string;
  iat: number;
  exp: number;
};

type VerifyTokenOptions = {
  secret: string; // 서명 검증에 사용할 비밀키
  expectedType: TokenType; // 토큰 유형 (액세스 또는 리프레시)
};

// Base64 URL-safe 인코딩
const encodeBase64Url = (input: string | Buffer): string => {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

// Base64 URL-safe 디코딩
const decodeBase64Url = (input: string): Buffer => {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4)) % 4;

  return Buffer.from(normalized + "=".repeat(padLength), "base64");
};

// jwt 서명 생성
const signJwt = (payload: SignedTokenPayload, secret: string): string => {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const encodedHeader = encodeBase64Url(JSON.stringify(header));
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = crypto.createHmac("sha256", secret).update(`${encodedHeader}.${encodedPayload}`).digest();

  return `${encodedHeader}.${encodedPayload}.${encodeBase64Url(signature)}`;
};

// 토큰 검증 및 payload를 반환
export const verifySignedToken = (token: string, options: VerifyTokenOptions): SignedTokenPayload => {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");

  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new Error("Invalid token format");
  }

  const expectedSignature = crypto
    .createHmac("sha256", options.secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();
  const receivedSignature = decodeBase64Url(encodedSignature);

  if (expectedSignature.length !== receivedSignature.length) {
    throw new Error("Invalid token signature");
  }

  if (!crypto.timingSafeEqual(expectedSignature, receivedSignature)) {
    throw new Error("Invalid token signature");
  }

  const payload = JSON.parse(decodeBase64Url(encodedPayload).toString("utf8")) as SignedTokenPayload;
  const now = Math.floor(Date.now() / 1000);

  if (payload.type !== options.expectedType) {
    throw new Error("Invalid token type");
  }

  if (payload.exp <= now) {
    throw new Error("Token expired");
  }

  return payload;
};

// 토큰 생성(리프레시, 액세스 공통)
const buildSignedToken = (params: {
  payload: ClientTokenPayload;
  secret: string; // 서명에 사용할 비밀키
  expiresInMs: number;
  type: TokenType;
}): string => {
  // JWT 표준의 iat/exp는 초 단위 사용 - 초로 변환
  const nowMs = Date.now();
  const now = Math.floor(nowMs / 1000);
  const expiresAt = Math.floor((nowMs + params.expiresInMs) / 1000);

  return signJwt(
    {
      ...params.payload,
      type: params.type,
      // 같은 사용자/같은 초에 토큰을 재발급해도 토큰 문자열이 중복되지 않도록 고유 ID를 포함합니다.
      jti: crypto.randomUUID(),
      iat: now,
      exp: expiresAt,
    },
    params.secret,
  );
};

/**
 * 액세스 토큰 발급
 * @param params payload: 토큰에 담길 사용자 정보 (userId, clientId, account), secret: 서명에 사용할 비밀키, expiresInMs: 토큰 만료 시간 (ms단위)
 * @returns
 */
export const createClientAccessToken = (params: {
  payload: ClientTokenPayload;
  secret: string;
  expiresInMs: number;
}): string => {
  return buildSignedToken({
    ...params,
    type: ACCESS_TOKEN,
  });
};

/**
 * 리프레시 토큰 빌급
 * @param params payload: 토큰에 담길 사용자 정보 (userId, clientId, account), secret: 서명에 사용할 비밀키, expiresInMs: 토큰 만료 시간 (ms단위)
 * @returns
 */
export const createClientRefreshToken = (params: {
  payload: ClientTokenPayload;
  secret: string;
  expiresInMs: number;
}): string => {
  return buildSignedToken({
    ...params,
    type: REFRESH_TOKEN,
  });
};

// 리프레시 토큰을 해시 변환 - DB 저장
export const hashRefreshToken = (refreshToken: string): string => {
  return crypto.createHash("sha256").update(refreshToken).digest("hex");
};

// 리프레시 토큰 만료 시각 계산
export const getRefreshTokenExpiresAt = (expiresInMs: number): Date => {
  return new Date(Date.now() + expiresInMs);
};

// 로그인/재발급 쿠키 옵션
export const getRefreshTokenCookieOptions = (expiresInMs: number): CookieOptions => {
  return {
    httpOnly: true,
    secure: appConfig.isProd,
    sameSite: "lax",
    path: "/api/v1/client/auth",
    maxAge: expiresInMs,
  };
};

// 로그아웃 시 쿠키 제거
export const getRefreshTokenClearCookieOptions = (): CookieOptions => {
  return {
    httpOnly: true,
    secure: appConfig.isProd,
    sameSite: "lax",
    path: "/api/v1/client/auth",
  };
};

// Express에 쿠키를 설정할 때 사용할 표준 쿠키 이름입니다.
export const getRefreshTokenCookieName = (): string => {
  return authConfig.clientRefreshTokenCookieName;
};

// cookie-parser 없이 요청 헤더에서 필요한 쿠키 값을 직접 꺼냅니다.
export const getCookieValue = (cookieHeader: string | undefined, cookieName: string): string | null => {
  if (!cookieHeader) {
    return null;
  }

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(cookieName.length + 1));
};
