import { serverEnv } from "@/lib/env";
import { verifyPassword } from "@/lib/password";
import { createAdminSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { rateLimitMany } from "@/lib/rate-limit";
import {
  getClientIp,
  isSameOrigin,
  jsonError,
  jsonOk,
  readJson,
  handleRoute,
} from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  return handleRoute("admin.login", async () => {
    if (!isSameOrigin(req)) {
      return jsonError(403, "Request origin not allowed.");
    }

    const ip = getClientIp(req);
    // PDF baseline: 5/min on login. Plus a slower 20/hour lockout per IP.
    const limited = rateLimitMany([
      { key: `login:min:${ip}`, limit: 5, windowMs: 60_000 },
      { key: `login:hr:${ip}`, limit: 20, windowMs: 60 * 60_000 },
    ]);
    if (!limited.ok) {
      return jsonError(429, "Too many attempts. Try again later.", {
        retryAfter: limited.retryAfter,
      });
    }

    const parsed = loginSchema.safeParse(await readJson(req, 2_000));
    if (!parsed.success) {
      return jsonError(400, "Enter the admin password.");
    }

    const ok = await verifyPassword(parsed.data.password, serverEnv().ADMIN_PASSWORD_HASH);
    if (!ok) {
      // Generic — never reveal whether a field was the problem.
      return jsonError(401, "Incorrect password.");
    }

    await createAdminSession(req.headers.get("user-agent"));
    return jsonOk({ ok: true });
  });
}

export function GET() {
  return jsonError(405, "Method not allowed.");
}
