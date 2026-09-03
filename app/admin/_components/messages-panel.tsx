"use client";

import { useState } from "react";

import { adminFetch, fmtDate } from "@/app/admin/_components/admin-client";
import { Empty, Td, Th } from "@/app/admin/_components/panel-ui";

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  body: string;
  createdAt: string;
}

export function MessagesPanel({ rows, onChange }: { rows: Message[]; onChange: () => void }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  if (!rows.length) return <Empty>No contact-form messages yet.</Empty>;

  async function remove(id: string) {
    if (!confirm("Delete this message? This cannot be undone.")) return;
    setBusyId(id);
    const r = await adminFetch(`/api/admin/messages/${id}`, { method: "DELETE" });
    setBusyId(null);
    if (r.ok) onChange();
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[640px] text-left text-[13px]">
        <thead className="bg-secondary/60 text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <Th>When</Th>
            <Th>From</Th>
            <Th>Message</Th>
            <Th> </Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((m) => (
            <tr key={m.id}>
              <Td className="whitespace-nowrap text-[11px] text-muted-foreground">
                {fmtDate(m.createdAt)}
              </Td>
              <Td>
                <div>{m.name}</div>
                <div className="text-[11px] text-muted-foreground">{m.email}</div>
              </Td>
              <Td className="max-w-[28rem]">
                {m.subject && <div className="font-medium">{m.subject}</div>}
                <p className="whitespace-pre-wrap text-[12px] text-foreground/80">{m.body}</p>
              </Td>
              <Td className="text-right">
                <button
                  type="button"
                  disabled={busyId === m.id}
                  onClick={() => remove(m.id)}
                  className="text-[12px] font-medium text-red-600 hover:underline disabled:opacity-50"
                >
                  Delete
                </button>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
