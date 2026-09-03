import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { whatsappRuntime } from "@/lib/config";
import { WHATSAPP_ADMIN_FIELDS } from "@/lib/admin-select";
import { jsonError, jsonOk, handleRoute } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  return handleRoute("admin.whatsapp.list", async () => {
    await requireAdmin();

    const url = new URL(req.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 40, 1), 100);
    const cursor = url.searchParams.get("cursor") || undefined;

    const rows = await prisma.whatsappMessage.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: WHATSAPP_ADMIN_FIELDS,
    });

    const items = rows.slice(0, limit);
    const nextCursor = rows.length > limit ? items[items.length - 1]!.id : null;
    return jsonOk({ items, nextCursor, mode: whatsappRuntime().mode });
  });
}

export function POST() {
  return jsonError(405, "Method not allowed.");
}
