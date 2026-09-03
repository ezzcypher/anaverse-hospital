import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/env";
import { HttpError } from "@/lib/errors";

export { HttpError };

export const MAX_BODY_BYTES = 16_000;

/* ------------------------------------------------------------------ *
 * Client identity (for rate-limit keys and abuse triage only)
 * ------------------------------------------------------------------ */

/**
 * Best-effort client IP from proxy headers. Only the platform's own proxy
 * headers are trusted; when none are present every caller shares one bucket.
 */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "0.0.0.0";
}

/** Non-reversible IP fingerprint. The raw IP is never stored or logged. */
export function hashIp(ip: string): string {
  return createHash("sha256")
    .update(`${ip}::${serverEnv().IP_HASH_SALT}`)
    .digest("hex")
    .slice(0, 32);
}

/* ------------------------------------------------------------------ *
 * Origin / CSRF defence for state-changing requests
 * ------------------------------------------------------------------ */

/**
 * True when the request demonstrably originates from this site. Combined with
 * a SameSite=Strict session cookie this is belt-and-braces CSRF protection for
 * the cookie-authenticated admin routes, and blocks drive-by POSTs to the
 * public form endpoints from other origins.
 */
export function isSameOrigin(req: Request): boolean {
  const host = req.headers.get("host");
  if (!host) return false;

  const allowed = new Set<string>([host, ...serverEnv().ALLOWED_ORIGINS]);

  const origin = req.headers.get("origin");
  if (origin) {
    try {
      return allowed.has(new URL(origin).host) || allowed.has(origin);
    } catch {
      return false;
    }
  }

  // No Origin header (older browsers / same-origin GET-turned-POST): fall back
  // to Referer host.
  const referer = req.headers.get("referer");
  if (referer) {
    try {
      return allowed.has(new URL(referer).host);
    } catch {
      return false;
    }
  }

  // A same-origin fetch from our own client always sends Origin, so treating a
  // missing Origin+Referer as untrusted is safe.
  return false;
}

/* ------------------------------------------------------------------ *
 * Body reading with a hard size cap
 * ------------------------------------------------------------------ */

export async function readJson(req: Request, maxBytes = MAX_BODY_BYTES): Promise<unknown> {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new HttpError(413, "Request body is too large.");
  }
  const raw = await req.text();
  if (raw.length > maxBytes) {
    throw new HttpError(413, "Request body is too large.");
  }
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, "Request body is not valid JSON.");
  }
}

/* ------------------------------------------------------------------ *
 * Responses — uniform shape, never leak internals
 * ------------------------------------------------------------------ */

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
} as const;

export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

export function jsonError(
  status: number,
  message: string,
  opts: { correlationId?: string; retryAfter?: number; fields?: Record<string, string[]> } = {},
): NextResponse {
  const headers: Record<string, string> = { ...NO_STORE };
  if (opts.retryAfter) headers["Retry-After"] = String(opts.retryAfter);
  return NextResponse.json(
    {
      error: message,
      ...(opts.correlationId ? { ref: opts.correlationId } : {}),
      ...(opts.fields ? { fields: opts.fields } : {}),
    },
    { status, headers },
  );
}

export function newCorrelationId(): string {
  return randomUUID().slice(0, 8);
}

/**
 * Log a server-side failure with a correlation id. The full error stays on the
 * server; only the id is ever sent to the client. Kept deliberately terse so a
 * request object or PII is never passed in by accident.
 */
export function logServerError(scope: string, correlationId: string, err: unknown): void {
  const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  console.error(`[${scope}] ref=${correlationId} ${detail}`);
}

/** Wrap a route body so HttpError becomes a clean response and anything else a 500. */
export async function handleRoute(
  scope: string,
  fn: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof HttpError) {
      return jsonError(err.status, err.publicMessage);
    }
    const ref = newCorrelationId();
    logServerError(scope, ref, err);
    return jsonError(500, "Something went wrong on our side. Please try again or call the hospital.", {
      correlationId: ref,
    });
  }
}
