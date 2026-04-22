import crypto from "crypto";

import { Prisma } from "@prisma/client";

import {
  ClientUserSignupBodyDto,
  ClientUserSignupResponseDto,
} from "@/api/v1/client/auth/user-signup/dto/user-signup.dto";
import { AppError } from "@/libs/error/app-error";
import { ERROR_CODES } from "@/libs/error/error-codes";
import { encryptApiKey } from "@/libs/auth/apiKeyCrypto";
import { makePasswordHash } from "@/libs/auth/password";
import { prisma } from "@/libs/prisma/client";

// 회원가입 시 외주업체 시스템 연동용 API 키 같이 발급
const generateApiKey = () => `pc_${crypto.randomBytes(32).toString("hex")}`;

const sha256Hex = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

// 외주업체 회원가입 서비스
export const signupClientUser = async (_input: ClientUserSignupBodyDto): Promise<ClientUserSignupResponseDto> => {
  const existingClient = await prisma.client.findUnique({
    where: { clientCode: _input.clientCode },
    select: { id: true },
  });

  if (existingClient) {
    throw new AppError(400, ERROR_CODES.COMMON_400_VALIDATION, "이미 존재하는 clientCode입니다.");
  }

  const existingClientUser = await prisma.clientUser.findUnique({
    where: { account: _input.account },
    select: { id: true },
  });

  if (existingClientUser) {
    throw new AppError(400, ERROR_CODES.COMMON_400_VALIDATION, "이미 존재하는 계정입니다.");
  }

  const apiKey = generateApiKey();
  const apiKeyHash = sha256Hex(apiKey);
  const apiKeyEncrypted = encryptApiKey(apiKey);
  const { salt, password } = makePasswordHash(_input.password);

  try {
    const created = await prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          clientCode: _input.clientCode,
          name: _input.clientName,
          senderPhone: _input.senderPhone,
          apiKeyHash,
          apiKeyEncrypted,
        },
      });

      const clientUser = await tx.clientUser.create({
        data: {
          account: _input.account,
          password,
          salt,
          name: _input.userName,
          clientId: client.id,
        },
      });

      return {
        client,
        clientUser,
      };
    });

    return {
      clientId: created.client.id,
      clientUserId: created.clientUser.id,
      clientCode: created.client.clientCode,
      account: created.clientUser.account,
      apiKey,
      createdAt: created.client.createdAt.toISOString(),
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(400, ERROR_CODES.COMMON_400_VALIDATION, "이미 존재하는 clientCode 또는 계정입니다.");
    }

    throw error;
  }
};
