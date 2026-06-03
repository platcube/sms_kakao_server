import dotenv from "dotenv";
import { registerJobs } from "@/jobs";

dotenv.config();

// 스케쥴러 진입
registerJobs();

const timeStamp = new Date().toISOString();
console.info(`[${timeStamp}][scheduler] started`);
