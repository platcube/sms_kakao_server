import { Router } from "express";

import { appConfig } from "@/config/app.config";
import { testSendResultRouter } from "@/api/v1/test/send-result/send-result.route";

export const testRouter = Router();

testRouter.use((_, res, next) => {
  if (appConfig.isProd) {
    return res.status(404).json({
      success: false,
      data: null,
      error: {
        code: "TEST_API_NOT_FOUND",
        message: "테스트 API는 운영 환경에서 사용할 수 없습니다.",
      },
    });
  }

  return next();
});

testRouter.use("/send-result", testSendResultRouter);
