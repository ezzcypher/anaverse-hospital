import { Prisma } from "@prisma/client";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSameOrigin, jsonError, jsonOk, handleRoute } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ID = /^[a-z0-9]{20,40}$/i;

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(req: Request, { params }: Ctx) {
  return handleRoute("admin.messages.delete", async () => {
    await requireAdmin();
    if (!isSameOrigin(req)) return jsonError(403, "Request origin not allowed.");

    const { id } = await params;
    if (!ID.test(id)) return jsonError(404, "Not found.");

    try {
      await prisma.contactMessage.delete({ where: { id } });
      return jsonOk({ ok: true });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        return jsonError(404, "Not found.");
      }
      throw err;
    }
  });
}
