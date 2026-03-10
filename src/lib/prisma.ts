import { PrismaClient } from "@prisma/client"; // 표준 경로로 변경

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 불필요한 SQLite 어댑터 코드를 모두 제거한 깨끗한 상태입니다.
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
