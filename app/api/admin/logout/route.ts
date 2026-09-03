import { destroyAdminSession } from "@/lib/auth";
import { isSameOrigin, jsonError, jsonOk, handleRoute } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  return handleRoute("admin.logout", async () => {
    if (!isSameOrigin(req)) {
      return jsonError(403, "Request origin not allowed.");
    }
    // Idempotent: revokes the session row and clears the cookie. Always 200.
    await destroyAdminSession();
    return jsonOk({ ok: true });
  });
}

export function GET() {
  return jsonError(405, "Method not allowed.");
}
