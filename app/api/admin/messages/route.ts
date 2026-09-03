import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, handleRoute } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PUBLIC_FIELDS = {
  id: true,
  name: true,
  email: true,
  subject: true,
  body: true,
  createdAt: true,
} as const;

export async function GET(req: Request) {
  return handleRoute("admin.messages.list", async () => {
    await requireAdmin();

    const url = new URL(req.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 20, 1), 50);
    const cursor = url.searchParams.get("cursor") || undefined;

    const rows = await prisma.contactMessage.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: PUBLIC_FIELDS,
    });

    const items = rows.slice(0, limit);
    const nextCursor = rows.length > limit ? items[items.length - 1]!.id : null;

    return jsonOk({ items, nextCursor });
  });
}

export function POST() {
  return jsonError(405, "Method not allowed.");
}
