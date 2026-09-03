import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { serverEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/errors";

/**
 * Admin session handling for the single hospital operator account.
 *
 * The cookie carries `<token>.<hmac>`:
 *  - `token`   32 random bytes (base64url) — the actual secret
 *  - `hmac`    HMAC-SHA256(token, AUTH_SECRET) — lets us reject tampered or
 *              foreign cookies without a database round-trip (cheap DoS guard)
 * Only `sha256(token)` is stored server-side, so the session table is useless
 * to anyone who reads it. Deleting the row instantly revokes the session.
 *
 * `__Host-` prefix => the browser only sends it over HTTPS, for this exact
 * host, with Path=/, and never for a parent domain.
 */

const COOKIE_NAME = "__Host-av_admin";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours, absolute
const TOUCH_AFTER_MS = 5 * 60 * 1000;

export interface AdminSession {
  id: string;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function hmac(token: string): string {
  return b64url(createHmac("sha256", serverEnv().AUTH_SECRET).update(token).digest());
}

function sha256(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Extract a verified token from the raw cookie value, or null. */
function tokenFromCookie(value: string | undefined): string | null {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const token = value.slice(0, dot);
  const mac = value.slice(dot + 1);
  if (!token || !mac) return null;
  return safeEqual(mac, hmac(token)) ? token : null;
}

function cleanUserAgent(ua: string | null): string | undefined {
  if (!ua) return undefined;
  // Keep printable ASCII only; drop control characters before storing.
  let out = "";
  for (const ch of ua) {
    const code = ch.charCodeAt(0);
    if (code >= 0x20 && code !== 0x7f) out += ch;
  }
  return out.trim().slice(0, 200) || undefined;
}

export async function createAdminSession(userAgent: string | null): Promise<void> {
  const token = b64url(randomBytes(32));
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  // Opportunistic housekeeping — keep the session table from growing forever.
  await prisma.adminSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });

  await prisma.adminSession.create({
    data: { tokenHash: sha256(token), expiresAt, userAgent: cleanUserAgent(userAgent) },
  });

  const store = await cookies();
  store.set(COOKIE_NAME, `${token}.${hmac(token)}`, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = tokenFromCookie(store.get(COOKIE_NAME)?.value);
  if (!token) return null;

  const row = await prisma.adminSession.findUnique({ where: { tokenHash: sha256(token) } });
  if (!row || row.expiresAt.getTime() <= Date.now()) return null;

  if (Date.now() - row.lastSeenAt.getTime() > TOUCH_AFTER_MS) {
    await prisma.adminSession
      .update({ where: { id: row.id }, data: { lastSeenAt: new Date() } })
      .catch(() => {});
  }
  return { id: row.id };
}

export async function destroyAdminSession(): Promise<void> {
  const store = await cookies();
  const token = tokenFromCookie(store.get(COOKIE_NAME)?.value);
  if (token) {
    await prisma.adminSession.deleteMany({ where: { tokenHash: sha256(token) } }).catch(() => {});
  }
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

/** For route handlers: returns the session or throws a 401. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) throw new HttpError(401, "Authentication required.");
  return session;
}
