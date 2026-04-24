import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import { appConfig } from "@/config/app.config";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const adapter = new PrismaMariaDb(connectionString);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

// 개발 환경에서는 핫 리로드로 인해 PrismaClient 인스턴스가 여러 개 생성되는 것을 방지하기 위해 글로벌 변수에 저장
if (!appConfig.isProd) {
  globalForPrisma.prisma = prisma;
}
