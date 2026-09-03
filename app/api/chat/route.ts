import { Prisma } from "@prisma/client";
import type { ChatSession } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { CLINIC } from "@/lib/clinic";
import { publicRuntimeInfo } from "@/lib/config";
import { chatMessageSchema, chatAppointmentSchema } from "@/lib/validations";
import { rateLimitMany } from "@/lib/rate-limit";
import { getClientIp, hashIp, isSameOrigin, jsonError, jsonOk, readJson, handleRoute } from "@/lib/http";
import { getOrCreateChatSession, setChatCookie } from "@/lib/chat-session";
import { buildKnowledge } from "@/lib/ai/knowledge";
import { runReceptionist } from "@/lib/ai/receptionist";
import { missingForSubmit, type CollectedState } from "@/lib/ai/types";
import { makeReference } from "@/lib/reference";
import { notifyAdminNewAppointment } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const GREETING =
  `Hello! I'm the ${CLINIC.name} virtual receptionist. I can answer questions about the hospital, ` +
  `help you find the right specialist, or book an appointment. How can I help?`;

export function GET() {
  return handleRoute("chat.hello", async () => {
    const info = publicRuntimeInfo();
    return jsonOk({
      mode: info.aiMode,
      whatsappMode: info.whatsappMode,
      clinic: CLINIC.name,
      greeting: GREETING,
      suggestions: ["Opening hours", "Find a specialist", "Book an appointment", "Where are you located?"],
      disclaimer:
        "I can't provide medical advice or diagnoses. In an emergency, call your local emergency number or Anaverse Emergency on " +
        CLINIC.emergency +
        ".",
    });
  });
}

export async function POST(req: Request) {
  return handleRoute("chat", async () => {
    if (!isSameOrigin(req)) return jsonError(403, "Request origin not allowed.");

    const ip = getClientIp(req);
    const limited = rateLimitMany([
      { key: `chat:min:${ip}`, limit: 15, windowMs: 60_000 },
      { key: `chat:hr:${ip}`, limit: 220, windowMs: 60 * 60_000 },
    ]);
    if (!limited.ok) {
      return jsonError(429, "You're sending messages very quickly — give it a moment and try again.", {
        retryAfter: limited.retryAfter,
      });
    }

    const parsed = chatMessageSchema.safeParse(await readJson(req, 12_000));
    if (!parsed.success) {
      return jsonError(422, "Please type a message.", { fields: parsed.error.flatten().fieldErrors });
    }
    const { message, reset, company } = parsed.data;

    const info = publicRuntimeInfo();

    // Honeypot: bot filled a hidden field. Bland reply, store nothing.
    if (company && company.trim() !== "") {
      return jsonOk({ reply: "Thanks for your message.", sessionId: null, mode: info.aiMode });
    }

    const ipHash = hashIp(ip);
    const { session } = await getOrCreateChatSession({ reset: Boolean(reset), ipHash });

    const userCount = await prisma.chatMessage.count({
      where: { sessionId: session.id, role: "user" },
    });
    if (userCount >= 60) {
      const capReply = `We've covered a lot here — to carry on, please call reception on ${CLINIC.reception} and they'll help you directly.`;
      await prisma.chatMessage.create({
        data: { sessionId: session.id, role: "user", content: message },
      });
      await prisma.chatMessage.create({
        data: { sessionId: session.id, role: "assistant", content: capReply },
      });
      await setChatCookie(session.publicId);
      return jsonOk({ reply: capReply, sessionId: session.publicId, mode: info.aiMode });
    }

    await prisma.chatMessage.create({
      data: { sessionId: session.id, role: "user", content: message },
    });

    const historyRows = await prisma.chatMessage.findMany({
      where: { sessionId: session.id, role: { in: ["user", "assistant"] } },
      orderBy: { createdAt: "asc" },
      take: 40,
      select: { role: true, content: true },
    });
    const history = historyRows
      .slice(0, -1) // drop the just-stored user message; it's passed separately
      .map((r) => ({ role: r.role as "user" | "assistant", content: r.content }));

    const collected = sessionToCollected(session);
    const kb = await buildKnowledge();

    const { turn, mode, usedFallback } = await runReceptionist({
      history,
      userMessage: message,
      collected,
      knowledgeText: kb.text,
      specialties: kb.specialties,
      doctors: kb.doctors,
    });

    const merged: CollectedState = { ...collected };
    for (const [k, v] of Object.entries(turn.collected)) {
      const key = k as keyof CollectedState;
      if (v && !merged[key]) merged[key] = String(v).slice(0, 160);
    }

    let leadStatus = session.leadStatus;
    if (turn.intent !== "emergency") {
      if (turn.readyToSubmit || turn.intent === "confirm" || turn.intent === "booking") {
        leadStatus = "booking";
      } else if (
        (turn.intent === "triage" || turn.intent === "faq" || knownCount(merged) >= 1) &&
        leadStatus === "browsing"
      ) {
        leadStatus = "interested";
      }
    }

    let replyText = turn.reply;
    let appointmentRef: string | undefined;

    if (
      turn.readyToSubmit &&
      missingForSubmit(merged).length === 0 &&
      session.status !== "converted"
    ) {
      const created = await createChatAppointment(merged, session, ipHash);
      if (created) {
        appointmentRef = created.reference;
        replyText = `${turn.reply}\n\nYour reference is ${created.reference}. Please keep it for your records.`;
        leadStatus = "converted";
        await notifyAdminNewAppointment(created, session);
      }
    }

    await prisma.chatMessage.create({
      data: { sessionId: session.id, role: "assistant", content: replyText },
    });

    await prisma.chatSession.update({
      where: { id: session.id },
      data: {
        patientName: merged.patientName ?? null,
        preferredDoctor: merged.preferredDoctor ?? null,
        specialty: merged.specialty ?? null,
        preferredDate: merged.preferredDate ?? null,
        preferredTime: merged.preferredTime ?? null,
        contactPhone: merged.contactPhone ?? null,
        contactEmail: merged.contactEmail ?? null,
        reasonForVisit: merged.reasonForVisit ?? null,
        summary: turn.summary ? turn.summary.slice(0, 500) : session.summary,
        leadStatus,
        status: appointmentRef ? "converted" : session.status,
        emergencyFlag: session.emergencyFlag || turn.intent === "emergency",
        lastActivityAt: new Date(),
      },
    });

    await setChatCookie(session.publicId);

    return jsonOk({
      reply: replyText,
      sessionId: session.publicId,
      mode,
      demoFallback: usedFallback,
      emergency: turn.intent === "emergency",
      appointment: appointmentRef ? { reference: appointmentRef } : undefined,
      collected: publicCollected(merged),
    });
  });
}

/* --------------------------- helpers --------------------------- */

function sessionToCollected(s: ChatSession): CollectedState {
  return {
    patientName: s.patientName ?? undefined,
    preferredDoctor: s.preferredDoctor ?? undefined,
    specialty: s.specialty ?? undefined,
    preferredDate: s.preferredDate ?? undefined,
    preferredTime: s.preferredTime ?? undefined,
    contactPhone: s.contactPhone ?? undefined,
    contactEmail: s.contactEmail ?? undefined,
    reasonForVisit: s.reasonForVisit ?? undefined,
  };
}

function knownCount(c: CollectedState): number {
  return Object.values(c).filter(Boolean).length;
}

/** What the widget may display back to the visitor (their own details). */
function publicCollected(c: CollectedState) {
  return {
    name: c.patientName ?? null,
    doctorOrSpecialty: c.preferredDoctor ?? c.specialty ?? null,
    date: c.preferredDate ?? null,
    time: c.preferredTime ?? null,
    phone: c.contactPhone ?? null,
  };
}

async function createChatAppointment(
  c: CollectedState,
  session: ChatSession,
  ipHash: string,
) {
  const parsed = chatAppointmentSchema.safeParse({
    name: c.patientName,
    phone: c.contactPhone,
    email: c.contactEmail ?? "",
    department: c.preferredDoctor ?? c.specialty ?? "General enquiry",
    preferredDate: c.preferredDate,
    preferredTime: c.preferredTime,
    reasonForVisit: c.reasonForVisit,
    conversationSummary: session.summary ?? undefined,
  });
  if (!parsed.success) return null;
  const d = parsed.data;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.appointment.create({
        data: {
          reference: makeReference(),
          name: d.name,
          phone: d.phone,
          email: d.email ?? null,
          department: d.department,
          reasonForVisit: d.reasonForVisit ?? null,
          preferredDate: d.preferredDate ?? null,
          preferredTime: d.preferredTime ?? null,
          conversationSummary: d.conversationSummary ?? null,
          source: "chatbot",
          status: "pending",
          sourceIpHash: ipHash,
          chatSessionId: session.id,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        attempt < 2
      ) {
        continue;
      }
      throw err;
    }
  }
  return null;
}
