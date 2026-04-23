export type RegisterKakaoTemplateProfileDto = {
  profileKey: string;
  name: string;
  channelName?: string;
  status?: "ACTIVE" | "INACTIVE";
};

export type KakaoTemplateButtonJsonDto = Record<string, unknown> | null;

export type RegisterKakaoTemplateItemDto = {
  templateCode: string;
  name: string;
  content: string;
  button1Json?: KakaoTemplateButtonJsonDto;
  button2Json?: KakaoTemplateButtonJsonDto;
  category?: string;
  status?: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED";
  rejectionReason?: string | null;
};

export type RegisterKakaoTemplatesBodyDto = {
  clientCode: string;
  profile: RegisterKakaoTemplateProfileDto;
  templates: RegisterKakaoTemplateItemDto[];
};

export type RegisterKakaoTemplatesResponseDto = {
  clientId: number;
  clientCode: string;
  profile: {
    id: number;
    profileKey: string;
    name: string;
    channelName: string | null;
    status: "ACTIVE" | "INACTIVE";
  };
  templates: {
    id: number;
    templateCode: string;
    name: string;
    status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED";
    mapped: boolean;
  }[];
};
