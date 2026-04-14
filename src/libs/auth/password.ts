import crypto from "crypto";

export type PasswordHashResult = {
  salt: string;
  password: string;
};

const PASSWORD_KEY_LENGTH = 32; // 해시 비밀번호 길이 (32 bytes = 256 bits)
const PASSWORD_ITERATIONS = 100_000; // 반복횟수
const PASSWORD_DIGEST = "sha256"; // 해시 알고리즘

// salt/password 해시생성
export const makePasswordHash = (plainPassword: string): PasswordHashResult => {
  const salt = crypto.randomBytes(16).toString("base64");
  const password = crypto
    .pbkdf2Sync(plainPassword, salt, PASSWORD_ITERATIONS, PASSWORD_KEY_LENGTH, PASSWORD_DIGEST)
    .toString("base64");

  return {
    salt,
    password,
  };
};

// salt이용한 password 해시생성 (로그인 비밀번호 검증용)
export const hashPasswordWithSalt = (plainPassword: string, salt: string): string => {
  return crypto
    .pbkdf2Sync(plainPassword, salt, PASSWORD_ITERATIONS, PASSWORD_KEY_LENGTH, PASSWORD_DIGEST)
    .toString("base64");
};

// 로그인 시 입력한 비밀번호가 저장된 해시와 일치하는지 검사
export const verifyPassword = (params: { plainPassword: string; salt: string; hashedPassword: string }): boolean => {
  const candidateHash = hashPasswordWithSalt(params.plainPassword, params.salt);
  const candidateBuffer = Buffer.from(candidateHash, "utf8");
  const storedBuffer = Buffer.from(params.hashedPassword, "utf8");

  if (candidateBuffer.length !== storedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(candidateBuffer, storedBuffer);
};
