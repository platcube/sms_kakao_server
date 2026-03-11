import { Router } from "express";

import { scheduleRouter } from "@/api/v1/client/messages/schedule/schedule.route";
import { sendRouter } from "@/api/v1/client/messages/send/send.route";

export const clientMessagesRouter = Router();

clientMessagesRouter.use("/send", sendRouter);
clientMessagesRouter.use("/schedule", scheduleRouter);
