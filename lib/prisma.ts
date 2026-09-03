import { PrismaClient } from "@prisma/client";

import { serverEnv } from "@/lib/env";

// Validate configuration before the client is constructed so a missing
// DATABASE_URL surfaces as the aggregated env error, not a Prisma stack trace.
serverEnv();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // No "query" logging — Prisma's query log echoes parameter values, which
    // for these models means names, phone numbers and emails in the console.
    log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
