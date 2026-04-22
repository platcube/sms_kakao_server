import crypto from "crypto";

import { Prisma } from "@prisma/client";

import { ClientCreateBodyDto, ClientCreateResponseDto } from "@/api/system/client/dto/client.dto";
import { encryptApiKey } from "@/libs/auth/apiKeyCrypto";
import { AppError } from "@/libs/error/app-error";
import { ERROR_CODES } from "@/libs/error/error-codes";
import { prisma } from "@/libs/prisma/client";

// API 키 원문을 안전한 랜덤 값으로 생성합니다. (운영에서는 1회만 노출)
const generateApiKey = () => `pc_${crypto.randomBytes(32).toString("hex")}`;

// DB에는 원문 대신 SHA-256 해시만 저장합니다.
const sha256Hex = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

/**
 * 시스템용 Client 생성 서비스
 * - API 키 원문을 생성하고, 해시만 DB에 저장
 * - test apiKey: pc_f81d7154078910c3dbdc18d5db20e2ba69d4f6eb0d64907c765f62098c035197
 */
export const createClient = async (input: ClientCreateBodyDto): Promise<ClientCreateResponseDto> => {
  // 1) 외주사에 전달할 API 키 원문 생성
  const apiKey = generateApiKey();

  // 2) 인증 비교용 해시 생성 (클라이언트 요청 시 raw -> sha256 후 비교)
  const apiKeyHash = sha256Hex(apiKey);
  const apiKeyEncrypted = encryptApiKey(apiKey);

  try {
    const created = await prisma.client.create({
      data: {
        clientCode: input.clientCode,
        name: input.name,
        senderPhone: input.senderPhone,
        status: input.status ?? "ACTIVE",
        apiKeyHash,
        apiKeyEncrypted,
      },
    });

    return {
      id: created.id,
      clientCode: created.clientCode,
      name: created.name,
      senderPhone: created.senderPhone,
      status: created.status,
      apiKey,
      createdAt: created.createdAt.toISOString(),
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(400, ERROR_CODES.COMMON_400_VALIDATION, "clientCode already exists");
    }
    throw error;
  }
};
