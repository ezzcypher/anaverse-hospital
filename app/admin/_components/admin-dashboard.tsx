"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { LogoutButton } from "@/app/admin/_components/logout-button";
import { AppointmentsPanel } from "@/app/admin/_components/appointments-panel";
import { LeadsPanel } from "@/app/admin/_components/leads-panel";
import { ConversationsPanel } from "@/app/admin/_components/conversations-panel";
import { MessagesPanel } from "@/app/admin/_components/messages-panel";
import { WhatsappPanel } from "@/app/admin/_components/whatsapp-panel";
import { KnowledgePanel } from "@/app/admin/_components/knowledge-panel";
import { DirectoryPanel } from "@/app/admin/_components/directory-panel";

type TabId =
  | "appointments"
  | "leads"
  | "conversations"
  | "messages"
  | "whatsapp"
  | "knowledge"
  | "directory";

interface Props {
  modes: { ai: "demo" | "live"; whatsapp: "demo" | "production" };
  openCount: number;
  data: Record<string, any[]>;
}

const TABS: { id: TabId; label: string; countKey?: string }[] = [
  { id: "appointments", label: "Appointments", countKey: "appointments" },
  { id: "leads", label: "Leads", countKey: "leads" },
  { id: "conversations", label: "Conversations", countKey: "conversations" },
  { id: "messages", label: "Messages", countKey: "messages" },
  { id: "whatsapp", label: "WhatsApp Outbox", countKey: "whatsapp" },
  { id: "knowledge", label: "Knowledge Base", countKey: "knowledge" },
  { id: "directory", label: "Doctors & Specialties" },
];

export function AdminDashboard({ modes, openCount, data }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("appointments");
  const refresh = () => router.refresh();

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-primary">
            Anaverse · Operator
          </p>
          <h1 className="mt-2 font-display text-2xl font-medium tracking-tightest">Front desk</h1>
        </div>
        <div className="flex items-center gap-3">
          <ModeBadge label="AI" mode={modes.ai} />
          <ModeBadge label="WhatsApp" mode={modes.whatsapp} />
          <LogoutButton />
        </div>
      </header>

      <p className="mt-4 text-sm text-muted-foreground">
        {openCount} open appointment{openCount === 1 ? "" : "s"} · the virtual receptionist is{" "}
        {modes.ai === "demo" ? "running in demo mode (mock answers)" : "connected to a live AI model"}.
      </p>

      <div className="mt-6 flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => {
          const n = t.countKey ? data[t.countKey]?.length ?? 0 : undefined;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={
                "relative -mb-px rounded-t-lg px-3 py-2 text-[13px] font-medium transition-colors " +
                (tab === t.id
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {t.label}
              {n !== undefined && n > 0 && (
                <span className="ml-1.5 rounded-full bg-secondary px-1.5 text-[11px] text-foreground/70">
                  {n}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {tab === "appointments" && (
          <AppointmentsPanel rows={data.appointments} onChange={refresh} />
        )}
        {tab === "leads" && <LeadsPanel rows={data.leads} />}
        {tab === "conversations" && (
          <ConversationsPanel rows={data.conversations} onChange={refresh} />
        )}
        {tab === "messages" && <MessagesPanel rows={data.messages} onChange={refresh} />}
        {tab === "whatsapp" && (
          <WhatsappPanel rows={data.whatsapp} mode={modes.whatsapp} onChange={refresh} />
        )}
        {tab === "knowledge" && <KnowledgePanel rows={data.knowledge} onChange={refresh} />}
        {tab === "directory" && (
          <DirectoryPanel
            specialties={data.specialties}
            doctors={data.doctors}
            onChange={refresh}
          />
        )}
      </div>
    </main>
  );
}

function ModeBadge({ label, mode }: { label: string; mode: string }) {
  const live = mode === "live" || mode === "production";
  return (
    <span
      className={
        "rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide " +
        (live ? "bg-primary/12 text-primary" : "bg-amber-100 text-amber-700")
      }
      title={`${label}: ${mode}`}
    >
      {label} {live ? mode : "demo"}
    </span>
  );
}
