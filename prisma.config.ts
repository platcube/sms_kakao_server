import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// const databaseUrl = process.env.DATABASE_URL;
// const shadowDatabaseUrl = process.env.SHADOW_DATABASE_URL;

console.error("[prisma.config]", {
  db: process.env.DATABASE_URL,
  shadow: process.env.SHADOW_DATABASE_URL,
});

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
    shadowDatabaseUrl: env("SHADOW_DATABASE_URL"),
  },
});
