import { ClientUserMeAuthDto } from "@/api/v1/client/auth/user-me/dto/user-me.dto";
import {
  ListKakaoTemplateItemDto,
  ListKakaoTemplatesQueryDto,
  ListKakaoTemplatesResponseDto,
} from "@/api/v1/client/kakao/templates/dto/list-kakao-templates.dto";
import { prisma } from "@/libs/prisma/client";

export const listKakaoTemplates = async (
  authUser: ClientUserMeAuthDto,
  query: ListKakaoTemplatesQueryDto,
): Promise<ListKakaoTemplatesResponseDto> => {
  const rows = await prisma.clientKakaoTemplate.findMany({
    where: {
      clientId: authUser.clientId,
      kakaoTemplate: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.templateCode ? { templateCode: { contains: query.templateCode } } : {}),
        ...(query.name ? { name: { contains: query.name } } : {}),
      },
    },
    orderBy: {
      kakaoTemplate: { updatedAt: "desc" },
    },
    select: {
      kakaoTemplate: {
        select: {
          templateCode: true,
          name: true,
          status: true,
          category: true,
          button1Json: true,
          button2Json: true,
          updatedAt: true,
          profile: {
            select: {
              profileKey: true,
              name: true,
              channelName: true,
            },
          },
        },
      },
    },
  });

  return {
    items: rows.map<ListKakaoTemplateItemDto>((row) => ({
      templateCode: row.kakaoTemplate.templateCode,
      name: row.kakaoTemplate.name,
      status: row.kakaoTemplate.status,
      category: row.kakaoTemplate.category,
      profile: {
        profileKey: row.kakaoTemplate.profile.profileKey,
        name: row.kakaoTemplate.profile.name,
        channelName: row.kakaoTemplate.profile.channelName,
      },
      hasButton1: row.kakaoTemplate.button1Json !== null,
      hasButton2: row.kakaoTemplate.button2Json !== null,
      updatedAt: row.kakaoTemplate.updatedAt.toISOString(),
    })),
  };
};
