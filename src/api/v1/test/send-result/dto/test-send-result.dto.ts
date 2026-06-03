export type TestPrcompanySendResultBodyDto = {
  messageType: "ALIMTALK" | "BRANDTALK";
  idempotencyKey: string;
  sDate?: string;
};

export type TestSyncSendResultBodyDto = {
  messageId: number;
};

export type TestSendResultWebhookBodyDto = {
  messageId: number;
};
