import { HealthDataDto, HealthQueryDto } from "@/api/system/health/dto/health.dto";

export const getHealth = (query: HealthQueryDto): HealthDataDto => {
  const base: HealthDataDto = {
    status: "ok",
    uptimeSec: Number(process.uptime().toFixed(0)),
    timestamp: new Date().toISOString(),
  };

  if (query.verbose) {
    base.env = process.env.NODE_ENV ?? "development";
  }

  return base;
};
