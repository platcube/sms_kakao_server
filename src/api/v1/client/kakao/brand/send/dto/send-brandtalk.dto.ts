export type SendBrandTalkBodyDto = {
  clientCode: string;
  apiKey: string;
  messageType: "BRANDTALK";
  recipientPhone: string[];
  senderPhone: string;
  message: string;
  title?: string;
  profileKey: string;
  failFlag?: number;
  smsGubn: "Y" | "N";
  ketc1?: string;
  ketc2?: string;
  idempotencyKey?: string;
};

export type SendBrandTalkResponseDto = {
  messageId: number;
  messageType: "BRANDTALK";
  status: string;
  requestedAt: string;
  reason?: {
    code: string;
    message: string;
  } | null;
};
