import { Router } from "express";

import { cancelRouter } from "@/api/v1/client/messages/cancel/cancel.route";
import { detailRouter } from "@/api/v1/client/messages/detail/detail.route";
import { eventsRouter } from "@/api/v1/client/messages/events/events.route";
import { listRouter } from "@/api/v1/client/messages/list/list.route";
import { scheduleRouter } from "@/api/v1/client/messages/schedule/schedule.route";
import { sendRouter } from "@/api/v1/client/messages/send/send.route";

export const clientMessagesRouter = Router();

clientMessagesRouter.use("/send", sendRouter);
clientMessagesRouter.use("/schedule", scheduleRouter);
clientMessagesRouter.use("/:messageId/events", eventsRouter);
clientMessagesRouter.use("/:messageId/cancel", cancelRouter);
clientMessagesRouter.use("/:messageId", detailRouter);
clientMessagesRouter.use("/", listRouter);
