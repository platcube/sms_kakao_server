import { Request, Response } from "express";

import {
  TestPrcompanySendResultBodyDto,
  TestSendResultWebhookBodyDto,
  TestSyncSendResultBodyDto,
} from "@/api/v1/test/send-result/dto/test-send-result.dto";
import { getPrcompanyResultCount } from "@/libs/integrations/prcompany/prcompany.report";
import { syncSendResultForMessage } from "@/libs/send-results";
import { sendKakaoSendStatusWebhook } from "@/libs/send-result-webhook";

// prcompany 전송결과 API 호출과 응답 정규화 테스트
export const testPrcompanySendResultController = async (_req: Request, res: Response) => {
  const body = res.locals.validatedBody as TestPrcompanySendResultBodyDto;

  const data = await getPrcompanyResultCount({
    messageType: body.messageType,
    idempotencyKey: body.idempotencyKey,
    sDate: body.sDate,
  });

  return res.status(200).json({
    success: true,
    data,
    error: null,
  });
};

// Message 기준 prcompany 전송결과 조회 후 DeliveryResult 저장테스트
export const testSyncSendResultController = async (_req: Request, res: Response) => {
  const body = res.locals.validatedBody as TestSyncSendResultBodyDto;
  const data = await syncSendResultForMessage(body.messageId);

  return res.status(200).json({
    success: true,
    data,
    error: null,
  });
};

// 저장된 DeliveryResult를 외주사 webhook으로 전달하는 테스트
export const testSendResultWebhookController = async (_req: Request, res: Response) => {
  const body = res.locals.validatedBody as TestSendResultWebhookBodyDto;
  const data = await sendKakaoSendStatusWebhook(body.messageId);

  return res.status(200).json({
    success: true,
    data,
    error: null,
  });
};
