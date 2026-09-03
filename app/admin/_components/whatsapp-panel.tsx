"use client";

import { useState } from "react";

import { adminFetch, fmtDate } from "@/app/admin/_components/admin-client";
import { Empty, Pill, Td, Th } from "@/app/admin/_components/panel-ui";

interface WA {
  id: string;
  template: string;
  toPhone: string;
  body: string;
  status: string;
  mode: string;
  error: string | null;
  createdAt: string;
}

const LABEL: Record<string, string> = {
  admin_notification: "Admin notification",
  confirmation: "Confirmation",
  reminder: "Reminder",
  followup: "Follow-up",
};

export function WhatsappPanel({
  rows,
  mode,
  onChange,
}: {
  rows: WA[];
  mode: "demo" | "production";
  onChange: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function resend(id: string) {
    setBusyId(id);
    await adminFetch(`/api/admin/whatsapp/${id}/resend`, { method: "POST" });
    setBusyId(null);
    onChange();
  }

  return (
    <>
      <p className="mb-3 text-[13px] text-muted-foreground">
        {mode === "demo"
          ? "Demo mode — messages are simulated and shown here only. Add WhatsApp credentials to send for real."
          : "Production mode — messages are delivered through the WhatsApp Business API."}
      </p>
      {!rows.length ? (
        <Empty>No WhatsApp messages yet. They appear when an appointment is submitted or confirmed.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="bg-secondary/60 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <Th>When</Th>
                <Th>Template</Th>
                <Th>To</Th>
                <Th>Status</Th>
                <Th>Message</Th>
                <Th> </Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((w) => (
                <tr key={w.id}>
                  <Td className="whitespace-nowrap text-[11px] text-muted-foreground">
                    {fmtDate(w.createdAt)}
                  </Td>
                  <Td>{LABEL[w.template] ?? w.template}</Td>
                  <Td className="text-[12px]">{w.toPhone}</Td>
                  <Td>
                    <Pill
                      tone={
                        w.status === "sent"
                          ? "green"
                          : w.status === "failed"
                            ? "red"
                            : w.status === "simulated"
                              ? "amber"
                              : "muted"
                      }
                    >
                      {w.status}
                    </Pill>
                    {w.error && <div className="mt-1 text-[10px] text-red-600">{w.error}</div>}
                  </Td>
                  <Td className="max-w-[20rem]">
                    <button
                      type="button"
                      onClick={() => setOpenId((v) => (v === w.id ? null : w.id))}
                      className="text-[12px] text-primary hover:underline"
                    >
                      {openId === w.id ? "Hide" : "View"}
                    </button>
                    {openId === w.id && (
                      <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-secondary/60 p-2 text-[11px] text-foreground/80">
                        {w.body}
                      </pre>
                    )}
                  </Td>
                  <Td className="text-right">
                    <button
                      type="button"
                      disabled={busyId === w.id}
                      onClick={() => resend(w.id)}
                      className="text-[12px] font-medium text-primary hover:underline disabled:opacity-50"
                    >
                      {mode === "demo" ? "Re-simulate" : "Resend"}
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
