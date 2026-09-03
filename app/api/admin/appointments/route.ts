import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { APPOINTMENT_STATUSES } from "@/lib/validations";
import { APPOINTMENT_ADMIN_FIELDS } from "@/lib/admin-select";
import { jsonError, jsonOk, handleRoute } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  return handleRoute("admin.appointments.list", async () => {
    await requireAdmin();

    const url = new URL(req.url);
    const statusParam = url.searchParams.get("status");
    const status =
      statusParam && (APPOINTMENT_STATUSES as readonly string[]).includes(statusParam)
        ? statusParam
        : undefined;
    const sourceParam = url.searchParams.get("source");
    const source = sourceParam === "web" || sourceParam === "chatbot" ? sourceParam : undefined;

    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 20, 1), 50);
    const cursor = url.searchParams.get("cursor") || undefined;

    const rows = await prisma.appointment.findMany({
      where: { ...(status ? { status } : {}), ...(source ? { source } : {}) },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: APPOINTMENT_ADMIN_FIELDS,
    });

    const items = rows.slice(0, limit);
    const nextCursor = rows.length > limit ? items[items.length - 1]!.id : null;

    return jsonOk({ items, nextCursor });
  });
}

export function POST() {
  return jsonError(405, "Method not allowed.");
}
