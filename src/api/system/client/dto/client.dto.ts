export type ClientCreateBodyDto = {
  clientCode: string;
  name: string;
  senderPhone: string;
  status?: "ACTIVE" | "INACTIVE";
};

export type ClientCreateResponseDto = {
  id: number;
  clientCode: string;
  name: string;
  senderPhone: string; // 발신 번호 - 카카오 알림톡 실패시 대체발송 번호
  status: "ACTIVE" | "INACTIVE";
  apiKey: string;
  createdAt: string;
};
