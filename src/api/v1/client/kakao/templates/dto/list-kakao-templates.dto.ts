export type ListKakaoTemplatesQueryDto = {
  status?: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED";
  templateCode?: string;
  name?: string;
};

export type ListKakaoTemplateItemDto = {
  templateCode: string;
  name: string;
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED";
  category: string | null;
  profile: {
    profileKey: string;
    name: string;
    channelName: string | null;
  };
  hasButton1: boolean;
  hasButton2: boolean;
  updatedAt: string;
};

export type ListKakaoTemplatesResponseDto = {
  items: ListKakaoTemplateItemDto[];
};
