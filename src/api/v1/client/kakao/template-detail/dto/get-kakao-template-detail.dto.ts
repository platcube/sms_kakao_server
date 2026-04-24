export type GetKakaoTemplateDetailQueryDto = Record<string, never>;

export type GetKakaoTemplateDetailResponseDto = {
  templateCode: string;
  name: string;
  content: string;
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED";
  category: string | null;
  rejectionReason: string | null;
  profile: {
    profileKey: string;
    name: string;
    channelName: string | null;
    status: "ACTIVE" | "INACTIVE";
  };
  button1Json: unknown | null;
  button2Json: unknown | null;
  updatedAt: string;
};
