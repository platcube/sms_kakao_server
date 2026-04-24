import { ClientUserMeAuthDto } from "@/api/v1/client/auth/user-me/dto/user-me.dto";
import {
  GetKakaoTemplateDetailQueryDto,
  GetKakaoTemplateDetailResponseDto,
} from "@/api/v1/client/kakao/template-detail/dto/get-kakao-template-detail.dto";
import { AppError } from "@/libs/error/app-error";
import { ERROR_CODES } from "@/libs/error/error-codes";
import { prisma } from "@/libs/prisma/client";

export const getKakaoTemplateDetail = async (
  authUser: ClientUserMeAuthDto,
  templateCode: string,
  _query: GetKakaoTemplateDetailQueryDto,
): Promise<GetKakaoTemplateDetailResponseDto> => {
  const normalizedCode = templateCode.trim();

  if (!normalizedCode) {
    throw new AppError(400, ERROR_CODES.COMMON_400_VALIDATION, "templateCode is required");
  }

  const row = await prisma.clientKakaoTemplate.findFirst({
    where: {
      clientId: authUser.clientId,
      kakaoTemplate: {
        templateCode: normalizedCode,
      },
    },
    select: {
      kakaoTemplate: {
        select: {
          templateCode: true,
          name: true,
          content: true,
          status: true,
          category: true,
          rejectionReason: true,
          button1Json: true,
          button2Json: true,
          updatedAt: true,
          profile: {
            select: {
              profileKey: true,
              name: true,
              channelName: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!row) {
    throw new AppError(404, ERROR_CODES.COMMON_404_NOT_FOUND, "템플릿을 찾을 수 없습니다.");
  }

  return {
    templateCode: row.kakaoTemplate.templateCode,
    name: row.kakaoTemplate.name,
    content: row.kakaoTemplate.content,
    status: row.kakaoTemplate.status,
    category: row.kakaoTemplate.category,
    rejectionReason: row.kakaoTemplate.rejectionReason,
    profile: {
      profileKey: row.kakaoTemplate.profile.profileKey,
      name: row.kakaoTemplate.profile.name,
      channelName: row.kakaoTemplate.profile.channelName,
      status: row.kakaoTemplate.profile.status,
    },
    button1Json: row.kakaoTemplate.button1Json ?? null,
    button2Json: row.kakaoTemplate.button2Json ?? null,
    updatedAt: row.kakaoTemplate.updatedAt.toISOString(),
  };
};
