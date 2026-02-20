export type HealthQueryDto = {
  verbose: boolean;
};

export type HealthDataDto = {
  status: "ok";
  uptimeSec: number;
  timestamp: string;
  env?: string;
};
