"use client";

import { useState } from "react";

import { fmtDate } from "@/app/admin/_components/admin-client";
import { Empty, Pill, Td, Th } from "@/app/admin/_components/panel-ui";
import { ConversationModal } from "@/app/admin/_components/conversation-modal";

interface Lead {
  id: string;
  publicId: string;
  leadStatus: string;
  patientName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  specialty: string | null;
  preferredDoctor: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  reasonForVisit: string | null;
  summary: string | null;
  messageCount: number;
  lastActivityAt: string;
}

export function LeadsPanel({ rows }: { rows: Lead[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (!rows.length)
    return <Empty>No open leads. Chats that show booking intent but don&rsquo;t convert appear here.</Empty>;

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[820px] text-left text-[13px]">
          <thead className="bg-secondary/60 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <Th>Last active</Th>
              <Th>Name</Th>
              <Th>Contact</Th>
              <Th>Interested in</Th>
              <Th>Preferred</Th>
              <Th>Stage</Th>
              <Th> </Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((l) => (
              <tr key={l.id}>
                <Td>
                  <div>{fmtDate(l.lastActivityAt)}</div>
                  <div className="text-[11px] text-muted-foreground">{l.messageCount} messages</div>
                </Td>
                <Td>{l.patientName ?? <span className="text-muted-foreground">—</span>}</Td>
                <Td>
                  <div>{l.contactPhone ?? "—"}</div>
                  {l.contactEmail && (
                    <div className="text-[11px] text-muted-foreground">{l.contactEmail}</div>
                  )}
                </Td>
                <Td>
                  {l.preferredDoctor ?? l.specialty ?? (
                    <span className="text-muted-foreground">—</span>
                  )}
                  {l.reasonForVisit && (
                    <div className="max-w-[16rem] text-[11px] text-muted-foreground">
                      {l.reasonForVisit}
                    </div>
                  )}
                </Td>
                <Td>
                  <div>{l.preferredDate ?? "—"}</div>
                  <div className="text-[11px] text-muted-foreground">{l.preferredTime ?? ""}</div>
                </Td>
                <Td>
                  <Pill tone={l.leadStatus === "booking" ? "primary" : "amber"}>{l.leadStatus}</Pill>
                </Td>
                <Td className="text-right">
                  <button
                    type="button"
                    onClick={() => setOpenId(l.id)}
                    className="text-[12px] font-medium text-primary hover:underline"
                  >
                    View chat
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
