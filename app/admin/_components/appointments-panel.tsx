"use client";

import { useState } from "react";

import { APPOINTMENT_STATUSES } from "@/lib/validations";
import { adminFetch, fmtDate } from "@/app/admin/_components/admin-client";
import { Empty, Td, Th } from "@/app/admin/_components/panel-ui";

interface Appt {
  id: string;
  reference: string;
  name: string;
  phone: string;
  email: string | null;
  department: string;
  note: string | null;
  reasonForVisit: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  conversationSummary: string | null;
  source: string;
  status: string;
  createdAt: string;
}

export function AppointmentsPanel({
  rows,
  onChange,
}: {
  rows: Appt[];
  onChange: () => void;
}) {
  if (!rows.length) return <Empty>No appointment requests yet.</Empty>;
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[860px] text-left text-[13px]">
        <thead className="bg-secondary/60 text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <Th>Ref / When</Th>
            <Th>Patient</Th>
            <Th>Doctor / Specialty</Th>
            <Th>Preferred</Th>
            <Th>Reason & summary</Th>
            <Th>Status</Th>
            <Th> </Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((a) => (
            <Row key={a.id} a={a} onChange={onChange} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Row({ a, onChange }: { a: Appt; onChange: () => void }) {
  const [status, setStatus] = useState(a.status);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function setStatusTo(next: string) {
    const prev = status;
    setStatus(next);
    setBusy(true);
    setNote(null);
    const r = await adminFetch(`/api/admin/appointments/${a.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    if (!r.ok) {
      setStatus(prev);
      setNote(r.error ?? "Update failed.");
      return;
    }
    if (r.data?.whatsapp) {
      setNote(
        `WhatsApp confirmation ${r.data.whatsapp.mode === "production" ? "sent" : "prepared (simulated)"} — see the Outbox tab.`,
      );
    }
    onChange();
  }

  async function remove() {
    if (!confirm(`Delete request ${a.reference}? This cannot be undone.`)) return;
    setBusy(true);
    const r = await adminFetch(`/api/admin/appointments/${a.id}`, { method: "DELETE" });
    setBusy(false);
    if (r.ok) onChange();
    else setNote(r.error ?? "Delete failed.");
  }

  const summary = a.conversationSummary || a.reasonForVisit || a.note;

  return (
    <>
      <tr className="align-top">
        <Td>
          <div className="font-medium">{a.reference}</div>
          <div className="text-[11px] text-muted-foreground">{fmtDate(a.createdAt)}</div>
        </Td>
        <Td>
          <div>{a.name}</div>
          <div className="text-[11px] text-muted-foreground">{a.phone}</div>
          {a.email && <div className="text-[11px] text-muted-foreground">{a.email}</div>}
        </Td>
        <Td>
          {a.department}
          <div className="mt-1">
            <span
              className={
                "rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase " +
                (a.source === "chatbot"
                  ? "bg-primary/12 text-primary"
                  : "bg-secondary text-foreground/60")
              }
            >
              {a.source === "chatbot" ? "chatbot" : "web form"}
            </span>
          </div>
        </Td>
        <Td>
          <div>{a.preferredDate ?? "—"}</div>
          <div className="text-[11px] text-muted-foreground">{a.preferredTime ?? ""}</div>
        </Td>
        <Td className="max-w-[15rem]">
          {summary ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="text-left text-[12px] text-primary hover:underline"
            >
              {open ? "Hide" : "Show"} summary
            </button>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
          {open && summary && (
            <p className="mt-1 whitespace-pre-wrap text-[12px] text-foreground/80">{summary}</p>
          )}
        </Td>
        <Td>
          <select
            value={status}
            disabled={busy}
            onChange={(e) => setStatusTo(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1 text-[12px] capitalize"
          >
            {APPOINTMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Td>
        <Td className="text-right">
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="text-[12px] font-medium text-red-600 hover:underline disabled:opacity-50"
          >
            Delete
          </button>
        </Td>
      </tr>
      {note && (
        <tr>
          <td colSpan={7} className="bg-secondary/40 px-3 py-1.5 text-[12px] text-foreground/70">
            {note}
          </td>
        </tr>
      )}
    </>
  );
}
