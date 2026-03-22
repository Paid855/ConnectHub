import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrisma() {
  return new PrismaClient({
    log: ["error"],
    datasources: {
      db: { url: process.env.DATABASE_URL },
    },
  });
}

export const prisma = globalForPrisma.prisma || createPrisma();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Retry wrapper for database operations
export async function dbRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e: any) {
      console.error(`DB attempt ${i + 1} failed:`, e.code || e.message);
      if (i === retries - 1) throw e;
      // Reconnect
      try { await prisma.$disconnect(); } catch {}
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      try { await prisma.$connect(); } catch {}
    }
  }
  throw new Error("DB failed after retries");
}
