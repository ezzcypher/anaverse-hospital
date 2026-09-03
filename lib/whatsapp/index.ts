import type { Appointment, ChatSession, WhatsappMessage } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { whatsappRuntime } from "@/lib/config";
import { sendWhatsapp } from "@/lib/whatsapp/provider";
import { renderTemplate, type TemplateVars, type WhatsappTemplate } from "@/lib/whatsapp/templates";

/** Loose E.164 normalisation. Returns null if it can't be made into one. */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return hasPlus ? `+${digits}` : `+${digits}`;
}

interface QueueArgs {
  template: WhatsappTemplate;
  to: string | null | undefined;
  vars: TemplateVars;
  appointmentId?: string | null;
  chatSessionId?: string | null;
}

/**
 * Render + persist an outbound message. In DEMO mode it is stored with status
 * `simulated` and only shown in the admin dashboard. In PRODUCTION mode it is
 * actually sent and the status becomes `sent` / `failed`. Never throws — a
 * WhatsApp problem must not break booking or an admin action.
 */
export async function queueWhatsapp(args: QueueArgs): Promise<WhatsappMessage | null> {
  const rt = whatsappRuntime();
  const to = normalizePhone(args.to) ?? (args.to?.trim() || "unknown");
  const body = renderTemplate(args.template, args.vars);

  let row: WhatsappMessage;
  try {
    row = await prisma.whatsappMessage.create({
      data: {
        template: args.template,
        toPhone: to,
        body,
        mode: rt.mode,
        status: rt.mode === "production" ? "queued" : "simulated",
        appointmentId: args.appointmentId ?? null,
        chatSessionId: args.chatSessionId ?? null,
      },
    });
  } catch (err) {
    console.error(`[whatsapp] could not record message: ${err instanceof Error ? err.name : "error"}`);
    return null;
  }

  if (rt.mode === "production") {
    const normalized = normalizePhone(args.to);
    if (!normalized) {
      await prisma.whatsappMessage
        .update({ where: { id: row.id }, data: { status: "failed", error: "invalid recipient number" } })
        .catch(() => {});
      return row;
    }
    try {
      await sendWhatsapp(normalized, body);
      row = await prisma.whatsappMessage.update({
        where: { id: row.id },
        data: { status: "sent", sentAt: new Date() },
      });
    } catch (err) {
      row = await prisma.whatsappMessage.update({
        where: { id: row.id },
        data: { status: "failed", error: err instanceof Error ? err.message.slice(0, 200) : "send failed" },
      });
    }
  }

  return row;
}

function varsFromAppointment(a: Appointment, session?: ChatSession | null): TemplateVars {
  return {
    name: a.name,
    phone: a.phone,
    doctor: a.department,
    date: a.preferredDate ?? null,
    time: a.preferredTime ?? null,
    reason: a.reasonForVisit ?? a.note ?? null,
    summary: a.conversationSummary ?? session?.summary ?? null,
    reference: a.reference,
  };
}

/** Called when a chatbot request is submitted — alerts the administrator. */
export async function notifyAdminNewAppointment(
  appointment: Appointment,
  session?: ChatSession | null,
): Promise<WhatsappMessage | null> {
  const rt = whatsappRuntime();
  return queueWhatsapp({
    template: "admin_notification",
    to: rt.adminNumber ?? "clinic-administrator",
    vars: varsFromAppointment(appointment, session),
    appointmentId: appointment.id,
    chatSessionId: appointment.chatSessionId,
  });
}

/** Called when an admin sets an appointment to "confirmed". */
export async function prepareConfirmation(appointment: Appointment): Promise<WhatsappMessage | null> {
  return queueWhatsapp({
    template: "confirmation",
    to: appointment.phone,
    vars: varsFromAppointment(appointment),
    appointmentId: appointment.id,
    chatSessionId: appointment.chatSessionId,
  });
}

export async function prepareReminder(appointment: Appointment): Promise<WhatsappMessage | null> {
  return queueWhatsapp({
    template: "reminder",
    to: appointment.phone,
    vars: varsFromAppointment(appointment),
    appointmentId: appointment.id,
  });
}

export async function prepareFollowUp(appointment: Appointment): Promise<WhatsappMessage | null> {
  return queueWhatsapp({
    template: "followup",
    to: appointment.phone,
    vars: varsFromAppointment(appointment),
    appointmentId: appointment.id,
  });
}
