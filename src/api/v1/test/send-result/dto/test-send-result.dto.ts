export type TestPrcompanySendResultBodyDto = {
  idempotencyKey: string;
  sDate?: string;
};

export type TestSyncSendResultBodyDto = {
  messageId: number;
};
