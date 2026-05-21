export type ScheduleBrandTalkBodyDto = {
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
  reservedTime: string;
  ketc1?: string;
  ketc2?: string;
  idempotencyKey?: string;
};

export type ScheduleBrandTalkResponseDto = {
  messageId: number;
  messageType: "BRANDTALK";
  status: string;
  requestedAt: string;
  reason?: {
    code: string;
    message: string;
  } | null;
};
