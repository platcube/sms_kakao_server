import { ClientUserMeAuthDto, ClientUserMeResponseDto } from "@/api/v1/client/auth/user-me/dto/user-me.dto";
import { decryptApiKey } from "@/libs/auth/apiKeyCrypto";
import { AppError } from "@/libs/error/app-error";
import { ERROR_CODES } from "@/libs/error/error-codes";
import { prisma } from "@/libs/prisma/client";

// 외주업체 사용자 본인 정보 조회 서비스
// - accessToken 인증을 통과한 사용자 ID를 기준으로 사용자/클라이언트 정보 조회
export const getClientUserMe = async (authUser: ClientUserMeAuthDto): Promise<ClientUserMeResponseDto> => {
  const clientUser = await prisma.clientUser.findUnique({
    where: { id: authUser.userId },
    include: {
      client: true,
    },
  });

  if (!clientUser || clientUser.clientId !== authUser.clientId || clientUser.account !== authUser.account) {
    throw new AppError(404, ERROR_CODES.COMMON_404_NOT_FOUND, "사용자 정보를 찾을 수 없습니다.");
  }

  const apiKey = clientUser.client.apiKeyEncrypted ? decryptApiKey(clientUser.client.apiKeyEncrypted) : null;

  return {
    user: {
      id: clientUser.id,
      account: clientUser.account,
      name: clientUser.name,
      status: clientUser.status,
      lastLoginAt: clientUser.lastLoginAt?.toISOString() ?? null,
    },
    client: {
      id: clientUser.client.id,
      clientCode: clientUser.client.clientCode,
      name: clientUser.client.name,
      status: clientUser.client.status,
      senderPhone: clientUser.client.senderPhone,
      apiKey,
    },
  };
};
