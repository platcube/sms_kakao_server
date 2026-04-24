const nodeEnv = process.env.NODE_ENV ?? "development";

export const appConfig = {
  nodeEnv,
  isProd: nodeEnv === "production",
} as const;
