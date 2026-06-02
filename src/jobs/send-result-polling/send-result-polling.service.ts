import { syncSendResultForMessage } from "@/libs/send-results";
import { prisma } from "@/libs/prisma/client";

const MAX_SEND_RESULT_POLL_ATTEMPT = 4;
const NEXT_SEND_RESULT_POLL_DELAY_MS = 10 * 60 * 1000;
const DEFAULT_SEND_RESULT_POLL_BATCH_SIZE = 100;
const SEND_RESULT_POLLING_SCOPE = "send-result-polling";

export type PollDueSendResultsResult = {
  due: number; // 조회 대상 메시지 수
  saved: number; // prcompany 결과 후 DeliveryResult 저장까지 완료한 메시지 수
  notFound: number; // prcompany 결과가 아직 없어 다음 조회로 예약한 메시지 수
  exhausted: number; // 최대 조회 횟수까지 결과가 없어 자동 조회를 종료한 메시지 수
  failed: number; // 조회/저장 처리 중 예외가 발생한 메시지 수
};

const getNextPollAt = (now: Date) => new Date(now.getTime() + NEXT_SEND_RESULT_POLL_DELAY_MS);

// 전송결과가 아직 없을 때 다음 조회 예약 또는 최대 횟수 종료 처리
const markSendResultNotFound = async (args: { messageId: number; currentAttempt: number; now: Date }) => {
  const nextAttempt = args.currentAttempt + 1;
  const isExhausted = nextAttempt >= MAX_SEND_RESULT_POLL_ATTEMPT;

  await prisma.message.updateMany({
    where: {
      id: args.messageId,
      status: "ACCEPTED",
      deliveryPollStatus: "WAITING",
    },
    data: {
      deliveryPollAttempt: nextAttempt,
      lastPolledAt: args.now,
      nextPollAt: isExhausted ? null : getNextPollAt(args.now),
      ...(isExhausted
        ? {
            deliveryPollStatus: "COMPLETE",
            statusReasonCode: "RESULT_NOT_FOUND_AFTER_POLLING",
            statusReasonMessage: "최대 전송결과 조회 횟수까지 결과를 확인하지 못했습니다.",
          }
        : {}),
    },
  });

  return isExhausted;
};

// 조회 예정 시간이 지난 카카오/브랜드톡 메시지를 prcompany 전송결과를 동기화
export const pollDueSendResults = async (): Promise<PollDueSendResultsResult> => {
  const now = new Date();

  const dueMessages = await prisma.message.findMany({
    where: {
      messageType: { in: ["ALIMTALK", "BRANDTALK"] },
      status: "ACCEPTED",
      deliveryPollStatus: "WAITING",
      nextPollAt: { lte: now },
    },
    select: { id: true, deliveryPollAttempt: true },
    orderBy: { nextPollAt: "asc" },
    take: DEFAULT_SEND_RESULT_POLL_BATCH_SIZE,
  });

  const result: PollDueSendResultsResult = {
    due: dueMessages.length,
    saved: 0,
    notFound: 0,
    exhausted: 0,
    failed: 0,
  };

  for (const message of dueMessages) {
    const timeStamp = new Date().toISOString();
    try {
      const syncResult = await syncSendResultForMessage(message.id);

      if (syncResult.status === "SAVED") {
        result.saved += 1;
        continue;
      }

      const exhausted = await markSendResultNotFound({
        messageId: message.id,
        currentAttempt: message.deliveryPollAttempt,
        now: new Date(),
      });

      if (exhausted) {
        result.exhausted += 1;
      } else {
        result.notFound += 1;
      }
    } catch (error) {
      result.failed += 1;
      console.error(`[${timeStamp}][${SEND_RESULT_POLLING_SCOPE}] message failed`, {
        messageId: message.id,
        error,
      });
    }
  }

  return result;
};
