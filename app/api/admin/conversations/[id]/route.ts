import { Prisma } from "@prisma/client";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CHAT_SESSION_ADMIN_FIELDS } from "@/lib/admin-select";
import { isSameOrigin, jsonError, jsonOk, handleRoute } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ID = /^[a-z0-9]{20,40}$/i;
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  return handleRoute("admin.conversations.get", async () => {
    await requireAdmin();
    const { id } = await params;
    if (!ID.test(id)) return jsonError(404, "Not found.");

    const session = await prisma.chatSession.findUnique({
      where: { id },
      select: {
        ...CHAT_SESSION_ADMIN_FIELDS,
        messages: {
          orderBy: { createdAt: "asc" },
          select: { role: true, content: true, createdAt: true },
        },
        appointments: { select: { reference: true, status: true } },
      },
    });
    if (!session) return jsonError(404, "Not found.");
    return jsonOk({ session });
  });
}

export async function DELETE(req: Request, { params }: Ctx) {
  return handleRoute("admin.conversations.delete", async () => {
    await requireAdmin();
    if (!isSameOrigin(req)) return jsonError(403, "Request origin not allowed.");
    const { id } = await params;
    if (!ID.test(id)) return jsonError(404, "Not found.");
    try {
      await prisma.chatSession.delete({ where: { id } });
      return jsonOk({ ok: true });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        return jsonError(404, "Not found.");
      }
      throw err;
    }
  });
}
