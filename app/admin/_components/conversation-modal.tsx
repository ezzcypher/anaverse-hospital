"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { adminFetch, fmtDate } from "@/app/admin/_components/admin-client";
import { Pill } from "@/app/admin/_components/panel-ui";

interface Detail {
  publicId: string;
  status: string;
  leadStatus: string;
  patientName: string | null;
  preferredDoctor: string | null;
  specialty: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  reasonForVisit: string | null;
  summary: string | null;
  emergencyFlag: boolean;
  createdAt: string;
  messages: { role: string; content: string; createdAt: string }[];
  appointments: { reference: string; status: string }[];
}

export function ConversationModal({ id, onClose }: { id: string; onClose: () => void }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    adminFetch(`/api/admin/conversations/${id}`).then((r) => {
      if (!alive) return;
      if (r.ok) setDetail(r.data.session as Detail);
      else setError(r.error ?? "Could not load the conversation.");
    });
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const collected = detail
    ? [
        ["Name", detail.patientName],
        ["Phone", detail.contactPhone],
        ["Email", detail.contactEmail],
        ["Doctor", detail.preferredDoctor],
        ["Specialty", detail.specialty],
        ["Preferred date", detail.preferredDate],
        ["Preferred time", detail.preferredTime],
        ["Reason", detail.reasonForVisit],
      ].filter(([, v]) => v)
    : [];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Conversation transcript"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-medium tracking-tightest">Conversation</h3>
            {detail && <Pill tone={detail.leadStatus === "converted" ? "green" : "primary"}>{detail.leadStatus}</Pill>}
            {detail?.emergencyFlag && <Pill tone="red">emergency flagged</Pill>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1.5 hover:bg-foreground/5">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && <p className="px-5 py-6 text-sm text-red-600">{error}</p>}

        {detail && (
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {detail.summary && (
              <p className="rounded-lg bg-secondary/60 p-3 text-[13px] text-foreground/80">
                <span className="font-semibold">Summary: </span>
                {detail.summary}
              </p>
            )}

            {collected.length > 0 && (
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
                {collected.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="text-foreground">{v}</dd>
                  </div>
                ))}
              </dl>
            )}

            {detail.appointments.length > 0 && (
              <p className="mt-3 text-[12px]">
                Booked:{" "}
                {detail.appointments.map((ap) => (
                  <span key={ap.reference} className="font-medium">
                    {ap.reference} ({ap.status}){" "}
                  </span>
                ))}
              </p>
            )}

            <div className="mt-4 space-y-2 border-t border-border pt-4">
              {detail.messages.map((m, i) => (
                <div key={i} className={"flex " + (m.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={
                      "max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-[12px] " +
                      (m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : m.role === "assistant"
                          ? "bg-secondary text-foreground"
                          : "bg-transparent text-muted-foreground italic")
                    }
                  >
                    {m.content}
                    <span className="mt-1 block text-[9px] opacity-60">{fmtDate(m.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!detail && !error && (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">Loading…</p>
        )}
      </div>
    </div>
  );
}
