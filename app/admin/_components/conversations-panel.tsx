"use client";

import { useState } from "react";

import { adminFetch, fmtDate } from "@/app/admin/_components/admin-client";
import { Empty, Pill, Td, Th } from "@/app/admin/_components/panel-ui";
import { ConversationModal } from "@/app/admin/_components/conversation-modal";

interface Conv {
  id: string;
  status: string;
  leadStatus: string;
  patientName: string | null;
  summary: string | null;
  emergencyFlag: boolean;
  messageCount: number;
  createdAt: string;
  lastActivityAt: string;
}

export function ConversationsPanel({ rows, onChange }: { rows: Conv[]; onChange: () => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!rows.length) return <Empty>No chat conversations yet.</Empty>;

  async function remove(id: string) {
    if (!confirm("Delete this conversation and its messages? This cannot be undone.")) return;
    setBusyId(id);
    const r = await adminFetch(`/api/admin/conversations/${id}`, { method: "DELETE" });
    setBusyId(null);
    if (r.ok) onChange();
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[760px] text-left text-[13px]">
          <thead className="bg-secondary/60 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <Th>Started</Th>
              <Th>Name</Th>
              <Th>Summary</Th>
              <Th>Stage</Th>
              <Th>Msgs</Th>
              <Th> </Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((c) => (
              <tr key={c.id}>
                <Td>
                  <div>{fmtDate(c.createdAt)}</div>
                  <div className="text-[11px] text-muted-foreground">
                    last {fmtDate(c.lastActivityAt)}
                  </div>
                </Td>
                <Td>{c.patientName ?? <span className="text-muted-foreground">—</span>}</Td>
                <Td className="max-w-[22rem] text-[12px] text-foreground/80">
                  {c.summary ?? <span className="text-muted-foreground">—</span>}
                </Td>
                <Td className="space-x-1">
                  <Pill tone={c.leadStatus === "converted" ? "green" : "primary"}>{c.leadStatus}</Pill>
                  {c.emergencyFlag && <Pill tone="red">emergency</Pill>}
                </Td>
                <Td>{c.messageCount}</Td>
                <Td className="whitespace-nowrap text-right">
                  <button
                    type="button"
                    onClick={() => setOpenId(c.id)}
                    className="text-[12px] font-medium text-primary hover:underline"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    disabled={busyId === c.id}
                    onClick={() => remove(c.id)}
                    className="ml-3 text-[12px] font-medium text-red-600 hover:underline disabled:opacity-50"
                  >
                    Delete
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {openId && <ConversationModal id={openId} onClose={() => setOpenId(null)} />}
    </>
  );
}
