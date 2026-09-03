"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { KNOWLEDGE_CATEGORIES } from "@/lib/validations";
import { adminFetch } from "@/app/admin/_components/admin-client";

interface Item {
  id: string;
  category: string;
  title: string;
  content: string;
  active: boolean;
  sortOrder: number;
}

export function KnowledgePanel({ rows, onChange }: { rows: Item[]; onChange: () => void }) {
  const grouped = KNOWLEDGE_CATEGORIES.map((c) => ({
    category: c,
    items: rows.filter((r) => r.category === c),
  })).filter((g) => g.items.length);

  return (
    <div className="space-y-8">
      <p className="text-[13px] text-muted-foreground">
        The receptionist answers clinic questions from these entries. Edits take effect within about
        20 seconds.
      </p>

      <AddItem onChange={onChange} />

      {grouped.map((g) => (
        <section key={g.category}>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {g.category}
          </h3>
          <div className="space-y-3">
            {g.items.map((it) => (
              <ItemRow key={it.id} item={it} onChange={onChange} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ItemRow({ item, onChange }: { item: Item; onChange: () => void }) {
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content);
  const [active, setActive] = useState(item.active);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const dirty = title !== item.title || content !== item.content || active !== item.active;

  async function save() {
    setBusy(true);
    setMsg(null);
    const r = await adminFetch(`/api/admin/knowledge/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify({ title, content, active }),
    });
    setBusy(false);
    if (r.ok) {
      setMsg("Saved");
      onChange();
    } else setMsg(r.error ?? "Save failed");
  }

  async function remove() {
    if (!confirm(`Delete "${item.title}"?`)) return;
    setBusy(true);
    const r = await adminFetch(`/api/admin/knowledge/${item.id}`, { method: "DELETE" });
    setBusy(false);
    if (r.ok) onChange();
    else setMsg(r.error ?? "Delete failed");
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mb-2 font-medium" />
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[70px] text-[13px]"
      />
      <div className="mt-2 flex items-center gap-3 text-[12px]">
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Active
        </label>
        <Button size="sm" onClick={save} disabled={busy || !dirty}>
          Save
        </Button>
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className="text-red-600 hover:underline disabled:opacity-50"
        >
          Delete
        </button>
        {msg && <span className="text-muted-foreground">{msg}</span>}
      </div>
    </div>
  );
}

function AddItem({ onChange }: { onChange: () => void }) {
  const [category, setCategory] = useState<string>(KNOWLEDGE_CATEGORIES[3]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    setMsg(null);
    const r = await adminFetch("/api/admin/knowledge", {
      method: "POST",
      body: JSON.stringify({ category, title, content }),
    });
    setBusy(false);
    if (r.ok) {
      setTitle("");
      setContent("");
      setMsg("Added");
      onChange();
    } else setMsg(r.error ?? "Could not add");
  }

  return (
    <div className="rounded-xl border border-dashed border-border p-4">
      <h3 className="mb-2 text-[13px] font-semibold">Add an entry</h3>
      <div className="grid gap-2 sm:grid-cols-[160px_1fr]">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 rounded-lg border border-input bg-background px-2 text-[13px] capitalize"
        >
          {KNOWLEDGE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title / question" />
      </div>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Answer / content"
        className="mt-2 min-h-[70px] text-[13px]"
      />
      <div className="mt-2 flex items-center gap-3">
        <Button size="sm" onClick={add} disabled={busy || !title.trim() || !content.trim()}>
          Add entry
        </Button>
        {msg && <span className="text-[12px] text-muted-foreground">{msg}</span>}
      </div>
    </div>
  );
}
