export type ScheduleKakaoBodyDto = {
  clientCode: string;
  messageType: "ALIMTALK";
  recipientPhone: string;
  senderKey: string;
  message: string;
  title?: string;
  profileKey: string;
  tempCode: string;
  tempBtn1?: string | Record<string, unknown>;
  failFlag?: number;
  smsGubn: "Y" | "N";
  reservedTime: string;
  ketc1?: string;
  ketc2?: string;
  idempotencyKey?: string;
};

export type ScheduleKakaoResponseDto = {
  messageId: number;
  messageType: "ALIMTALK";
  status: string;
  requestedAt: string;
  reason?: {
    code: string;
    message: string;
  } | null;
};
