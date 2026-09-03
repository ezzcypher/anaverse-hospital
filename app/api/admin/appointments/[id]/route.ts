import { Prisma } from "@prisma/client";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { statusUpdateSchema } from "@/lib/validations";
import { APPOINTMENT_ADMIN_FIELDS } from "@/lib/admin-select";
import { isSameOrigin, jsonError, jsonOk, readJson, handleRoute } from "@/lib/http";
import { prepareConfirmation } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ID = /^[a-z0-9]{20,40}$/i;

type Ctx = { params: Promise<{ id: string }> };

function toPublic<T extends { [k: string]: unknown }>(row: T) {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(APPOINTMENT_ADMIN_FIELDS)) out[k] = row[k];
  return out;
}

export async function PATCH(req: Request, { params }: Ctx) {
  return handleRoute("admin.appointments.patch", async () => {
    await requireAdmin();
    if (!isSameOrigin(req)) return jsonError(403, "Request origin not allowed.");

    const { id } = await params;
    if (!ID.test(id)) return jsonError(404, "Not found.");

    const parsed = statusUpdateSchema.safeParse(await readJson(req, 2_000));
    if (!parsed.success) return jsonError(422, "Invalid status.");

    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) return jsonError(404, "Not found.");

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: parsed.data.status },
    });

    // Moving to "confirmed" prepares the patient WhatsApp confirmation
    // (simulated in demo mode, actually sent in production mode).
    let whatsapp = null;
    if (parsed.data.status === "confirmed" && existing.status !== "confirmed") {
      whatsapp = await prepareConfirmation(updated);
    }

    return jsonOk({
      item: toPublic(updated as unknown as Record<string, unknown>),
      whatsapp: whatsapp
        ? { id: whatsapp.id, status: whatsapp.status, mode: whatsapp.mode, template: whatsapp.template }
        : null,
    });
  });
}

export async function DELETE(req: Request, { params }: Ctx) {
  return handleRoute("admin.appointments.delete", async () => {
    await requireAdmin();
    if (!isSameOrigin(req)) return jsonError(403, "Request origin not allowed.");

    const { id } = await params;
    if (!ID.test(id)) return jsonError(404, "Not found.");

    try {
      await prisma.appointment.delete({ where: { id } });
      return jsonOk({ ok: true });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        return jsonError(404, "Not found.");
      }
      throw err;
    }
  });
}
