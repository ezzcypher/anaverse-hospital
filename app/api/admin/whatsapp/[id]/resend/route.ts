import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWhatsapp } from "@/lib/whatsapp/provider";
import { isSameOrigin, jsonError, jsonOk, handleRoute } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ID = /^[a-z0-9]{20,40}$/i;
type Ctx = { params: Promise<{ id: string }> };

/** Re-issue a stored WhatsApp message as a fresh send attempt (a new outbox
 *  row). In demo mode it is simulated again; in production it is re-sent. */
export async function POST(req: Request, { params }: Ctx) {
  return handleRoute("admin.whatsapp.resend", async () => {
    await requireAdmin();
    if (!isSameOrigin(req)) return jsonError(403, "Request origin not allowed.");

    const { id } = await params;
    if (!ID.test(id)) return jsonError(404, "Not found.");

    const original = await prisma.whatsappMessage.findUnique({ where: { id } });
    if (!original) return jsonError(404, "Not found.");

    const row = await prisma.whatsappMessage.create({
      data: {
        template: original.template,
        toPhone: original.toPhone,
        body: original.body,
        mode: original.mode,
        status: original.mode === "production" ? "queued" : "simulated",
        appointmentId: original.appointmentId,
        chatSessionId: original.chatSessionId,
      },
    });

    if (original.mode === "production") {
      try {
        await sendWhatsapp(original.toPhone, original.body);
        await prisma.whatsappMessage.update({
          where: { id: row.id },
          data: { status: "sent", sentAt: new Date() },
        });
      } catch (err) {
        await prisma.whatsappMessage.update({
          where: { id: row.id },
          data: { status: "failed", error: err instanceof Error ? err.message.slice(0, 200) : "send failed" },
        });
      }
    }

    const fresh = await prisma.whatsappMessage.findUnique({ where: { id: row.id } });
    return jsonOk({ item: fresh });
  });
}
