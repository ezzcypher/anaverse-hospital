import { PrismaClient } from "@prisma/client";

import { serverEnv } from "@/lib/env";

/**
 * Lazy singleton. Deliberately does NOT validate env or construct the client
 * at module-import time: Next.js imports every route module during
 * "Collecting page data" at build time (even for fully `force-dynamic`
 * routes), so a top-level throw here would fail the production build itself
 * whenever env vars aren't visible in that build phase — turning a runtime
 * config problem into a deploy blocker. Instead, validation + construction
 * happen on first real use (the first query a request makes), which surfaces
 * the same aggregated "Invalid server configuration" error, just at request
 * time instead of at build time.
 */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  serverEnv(); // throws a clear, aggregated error if misconfigured

  const client = new PrismaClient({
    // No "query" logging — Prisma's query log echoes parameter values, which
    // for these models means names, phone numbers and emails in the console.
    log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
  });

  // Cache across hot-reloads in dev, and across warm serverless invocations
  // in production (both share the same globalThis within one process).
  globalForPrisma.prisma = client;
  return client;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});
