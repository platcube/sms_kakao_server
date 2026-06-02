import schedule from "node-schedule";

import { pollDueSendResults } from "@/jobs/send-result-polling/send-result-polling.service";

const SEND_RESULT_POLLING_CRON = "*/5 * * * *";

let isRunning = false;

// 5분마다 조회 예정 시간이 지난 전송결과를 prcompany에서 조회
export const registerSendResultPollingJob = () => {
  schedule.scheduleJob(SEND_RESULT_POLLING_CRON, async () => {
    const timeStamp = new Date().toISOString();
    if (isRunning) {
      console.warn(`[${timeStamp}][send-result-polling] skipped because previous job is still running`);
      return;
    }

    const startedAt = Date.now();
    isRunning = true;

    try {
      console.log(`[${timeStamp}][send-result-polling] started`);

      const result = await pollDueSendResults();

      console.log(`[${timeStamp}][send-result-polling] completed`, {
        ...result,
        passedMs: Date.now() - startedAt,
      });
    } catch (error) {
      console.error(`[${timeStamp}][send-result-polling] failed`, { error });
    } finally {
      isRunning = false;
    }
  });

  console.log(`[send-result-polling] registered`, {
    cron: SEND_RESULT_POLLING_CRON,
  });
};
