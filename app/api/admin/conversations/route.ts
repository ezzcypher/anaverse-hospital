import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CHAT_SESSION_ADMIN_FIELDS } from "@/lib/admin-select";
import { jsonError, jsonOk, handleRoute } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  return handleRoute("admin.conversations.list", async () => {
    await requireAdmin();

    const url = new URL(req.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 30, 1), 50);
    const cursor = url.searchParams.get("cursor") || undefined;

    const rows = await prisma.chatSession.findMany({
      orderBy: [{ lastActivityAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: { ...CHAT_SESSION_ADMIN_FIELDS, _count: { select: { messages: true } } },
    });

    const items = rows.slice(0, limit).map((r) => ({ ...r, messageCount: r._count.messages, _count: undefined }));
    const nextCursor = rows.length > limit ? rows[limit - 1]!.id : null;
    return jsonOk({ items, nextCursor });
  });
}

export function POST() {
  return jsonError(405, "Method not allowed.");
}
