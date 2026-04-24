// 환경 변수에서 인증 관련 설정 확인 및 내보내기
const requireEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name}은 필수 환경 변수입니다.`);
  }

  return value;
};

// 환경 변수가 존재하는지 확인하고, 양의 숫자로 변환하여 반환
const requireEnvNumber = (name: string): number => {
  const raw = requireEnv(name);
  const value = Number(raw);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name}는 양의 숫자여야 합니다. 현재 값: ${raw}`);
  }

  return value;
};

export const authConfig = {
  clientAccessTokenSecret: requireEnv("CLIENT_ACCESS_TOKEN_SECRET"),
  clientRefreshTokenSecret: requireEnv("CLIENT_REFRESH_TOKEN_SECRET"),
  clientAccessTokenExpiresInMs: requireEnvNumber("CLIENT_ACCESS_TOKEN_EXPIRES_IN"),
  clientRefreshTokenExpiresInMs: requireEnvNumber("CLIENT_REFRESH_TOKEN_EXPIRES_IN"),
  clientRefreshTokenCookieName: process.env.CLIENT_REFRESH_TOKEN_COOKIE_NAME ?? "client_refresh_token",
  apiKeyEncryptionSecret: requireEnv("API_KEY_ENCRYPTION_SECRET"),
} as const;
