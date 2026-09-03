"use client";

import type { ReactNode } from "react";

export function Th({ children }: { children: ReactNode }) {
  return <th className="px-3 py-2.5 font-semibold">{children}</th>;
}

export function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={"px-3 py-3 align-top " + className}>{children}</td>;
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function TableShell({
  head,
  minWidth = 720,
  children,
}: {
  head: ReactNode;
  minWidth?: number;
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-[13px]" style={{ minWidth }}>
        <thead className="bg-secondary/60 text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>{head}</tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}

export function Pill({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "primary" | "amber" | "green" | "red";
}) {
  const map: Record<string, string> = {
    muted: "bg-secondary text-foreground/60",
    primary: "bg-primary/12 text-primary",
    amber: "bg-amber-100 text-amber-700",
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={
        "inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide " +
        map[tone]
      }
    >
      {children}
    </span>
  );
}
