import { registerSendResultPollingJob } from "@/jobs/send-result-polling/send-result-polling.job";

// 서버 시작 시 등록할 백그라운드 작업 모음
export const registerJobs = () => {
  registerSendResultPollingJob();
};
