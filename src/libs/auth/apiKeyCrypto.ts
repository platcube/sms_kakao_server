import crypto from "crypto";

import { authConfig } from "@/config/auth.config";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

const getEncryptionKey = () => {
  return crypto.createHash("sha256").update(authConfig.apiKeyEncryptionSecret).digest();
};

// API Key 원문을 DB 저장용 문자열로 암호화합니다.
// 저장 포맷은 `iv:authTag:cipherText`이며 각 값은 base64url 인코딩입니다.
export const encryptApiKey = (apiKey: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(apiKey, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv, authTag, encrypted].map((value) => value.toString("base64url")).join(":");
};

// DB에 저장된 암호화 문자열을 API Key 원문으로 복호화합니다.
export const decryptApiKey = (encryptedApiKey: string): string => {
  const [ivText, authTagText, encryptedText] = encryptedApiKey.split(":");

  if (!ivText || !authTagText || !encryptedText) {
    throw new Error("Invalid encrypted API key format");
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), Buffer.from(ivText, "base64url"));
  decipher.setAuthTag(Buffer.from(authTagText, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, "base64url")),
    decipher.final(),
  ]).toString("utf8");
};
