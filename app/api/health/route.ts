import { jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Deliberately says nothing about versions, uptime, the database, or the host.
export function GET() {
  return jsonOk({ ok: true });
}
