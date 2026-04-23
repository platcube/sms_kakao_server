import { Prisma } from "@prisma/client";

import {
  RegisterKakaoTemplateItemDto,
  RegisterKakaoTemplatesBodyDto,
  RegisterKakaoTemplatesResponseDto,
} from "@/api/system/kakao/templates/dto/register-kakao-templates.dto";
import { AppError } from "@/libs/error/app-error";
import { ERROR_CODES } from "@/libs/error/error-codes";
import { prisma } from "@/libs/prisma/client";

const nullableJson = (
  value: RegisterKakaoTemplateItemDto["button1Json"],
): Prisma.InputJsonValue | typeof Prisma.DbNull | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.DbNull;
  return value as Prisma.InputJsonValue;
};

// 시스템용 카카오 템플릿 등록/갱신 서비스
export const registerKakaoTemplates = async (
  input: RegisterKakaoTemplatesBodyDto,
): Promise<RegisterKakaoTemplatesResponseDto> => {
  const client = await prisma.client.findUnique({
    where: { clientCode: input.clientCode },
    select: { id: true, clientCode: true },
  });

  if (!client) {
    throw new AppError(404, ERROR_CODES.COMMON_404_NOT_FOUND, "클라이언트를 찾을 수 없습니다.");
  }

  return prisma.$transaction(async (tx) => {
    const existingProfile = await tx.kakaoProfile.findUnique({
      where: { profileKey: input.profile.profileKey },
      select: { id: true, clientId: true },
    });

    if (existingProfile && existingProfile.clientId !== client.id) {
      throw new AppError(400, ERROR_CODES.COMMON_400_VALIDATION, "이미 다른 클라이언트에 등록된 발신프로필입니다.");
    }

    const profileUpdateData: Prisma.KakaoProfileUpdateInput = {
      name: input.profile.name,
      ...(input.profile.channelName !== undefined ? { channelName: input.profile.channelName } : {}),
      ...(input.profile.status !== undefined ? { status: input.profile.status } : {}),
    };

    const profile = await tx.kakaoProfile.upsert({
      where: { profileKey: input.profile.profileKey },
      create: {
        profileKey: input.profile.profileKey,
        name: input.profile.name,
        channelName: input.profile.channelName,
        status: input.profile.status ?? "ACTIVE",
        clientId: client.id,
      },
      update: profileUpdateData,
    });

    const registeredTemplates: RegisterKakaoTemplatesResponseDto["templates"] = [];

    for (const templateInput of input.templates) {
      const existingTemplate = await tx.kakaoTemplate.findUnique({
        where: { templateCode: templateInput.templateCode },
        select: { id: true, profileId: true },
      });

      if (existingTemplate && existingTemplate.profileId !== profile.id) {
        throw new AppError(400, ERROR_CODES.COMMON_400_VALIDATION, "이미 다른 발신프로필에 등록된 템플릿 코드입니다.");
      }

      const templateUpdateData: Prisma.KakaoTemplateUpdateInput = {
        name: templateInput.name,
        content: templateInput.content,
        ...(templateInput.button1Json !== undefined ? { button1Json: nullableJson(templateInput.button1Json) } : {}),
        ...(templateInput.button2Json !== undefined ? { button2Json: nullableJson(templateInput.button2Json) } : {}),
        ...(templateInput.category !== undefined ? { category: templateInput.category } : {}),
        ...(templateInput.status !== undefined ? { status: templateInput.status } : {}),
        ...(templateInput.rejectionReason !== undefined ? { rejectionReason: templateInput.rejectionReason } : {}),
      };

      const template = await tx.kakaoTemplate.upsert({
        where: { templateCode: templateInput.templateCode },
        create: {
          templateCode: templateInput.templateCode,
          name: templateInput.name,
          content: templateInput.content,
          button1Json: nullableJson(templateInput.button1Json),
          button2Json: nullableJson(templateInput.button2Json),
          category: templateInput.category,
          status: templateInput.status ?? "APPROVED",
          rejectionReason: templateInput.rejectionReason,
          profileId: profile.id,
        },
        update: templateUpdateData,
      });

      await tx.clientKakaoTemplate.upsert({
        where: {
          clientId_templateId: {
            clientId: client.id,
            templateId: template.id,
          },
        },
        create: {
          clientId: client.id,
          templateId: template.id,
        },
        update: {},
      });

      registeredTemplates.push({
        id: template.id,
        templateCode: template.templateCode,
        name: template.name,
        status: template.status,
        mapped: true,
      });
    }

    return {
      clientId: client.id,
      clientCode: client.clientCode,
      profile: {
        id: profile.id,
        profileKey: profile.profileKey,
        name: profile.name,
        channelName: profile.channelName,
        status: profile.status,
      },
      templates: registeredTemplates,
    };
  });
};
