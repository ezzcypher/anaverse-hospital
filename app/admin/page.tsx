import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aiRuntime, whatsappRuntime } from "@/lib/config";
import {
  APPOINTMENT_ADMIN_FIELDS,
  CHAT_SESSION_ADMIN_FIELDS,
  WHATSAPP_ADMIN_FIELDS,
} from "@/lib/admin-select";
import { AdminDashboard } from "@/app/admin/_components/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await getAdminSession())) redirect("/admin/login");

  const [
    appointments,
    leads,
    conversations,
    messages,
    whatsapp,
    knowledge,
    specialties,
    doctors,
    openCount,
  ] = await Promise.all([
    prisma.appointment.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 60,
      select: APPOINTMENT_ADMIN_FIELDS,
    }),
    prisma.chatSession.findMany({
      where: {
        status: { not: "converted" },
        OR: [
          { leadStatus: { in: ["interested", "booking"] } },
          { contactPhone: { not: null } },
          { patientName: { not: null } },
        ],
      },
      orderBy: [{ lastActivityAt: "desc" }],
      take: 50,
      select: { ...CHAT_SESSION_ADMIN_FIELDS, _count: { select: { messages: true } } },
    }),
    prisma.chatSession.findMany({
      orderBy: [{ lastActivityAt: "desc" }],
      take: 50,
      select: { ...CHAT_SESSION_ADMIN_FIELDS, _count: { select: { messages: true } } },
    }),
    prisma.contactMessage.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 50,
      select: { id: true, name: true, email: true, subject: true, body: true, createdAt: true },
    }),
    prisma.whatsappMessage.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 60,
      select: WHATSAPP_ADMIN_FIELDS,
    }),
    prisma.knowledgeItem.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.specialty.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.doctor.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.appointment.count({ where: { status: { in: ["pending", "confirmed"] } } }),
  ]);

  return (
    <AdminDashboard
      modes={{ ai: aiRuntime().mode, whatsapp: whatsappRuntime().mode }}
      openCount={openCount}
      data={{
        appointments: serialize(appointments),
        leads: serialize(leads.map(flattenCount)),
        conversations: serialize(conversations.map(flattenCount)),
        messages: serialize(messages),
        whatsapp: serialize(whatsapp),
        knowledge: serialize(knowledge),
        specialties: serialize(specialties),
        doctors: serialize(doctors),
      }}
    />
  );
}

function flattenCount<T extends { _count: { messages: number } }>(row: T) {
  const { _count, ...rest } = row;
  return { ...rest, messageCount: _count.messages };
}

/** Dates -> ISO strings so the payload is a plain serialisable object. */
function serialize<T>(rows: T[]): T[] {
  return JSON.parse(
    JSON.stringify(rows, (_k, v) => (v instanceof Date ? v.toISOString() : v)),
  );
}
