"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminFetch } from "@/app/admin/_components/admin-client";

interface Specialty {
  id: string;
  name: string;
  description: string | null;
  keywords: string | null;
  active: boolean;
}
interface Doctor {
  id: string;
  name: string;
  title: string;
  specialty: string | null;
  yearsExperience: number | null;
  consultationFee: string | null;
  active: boolean;
}

export function DirectoryPanel({
  specialties,
  doctors,
  onChange,
}: {
  specialties: Specialty[];
  doctors: Doctor[];
  onChange: () => void;
}) {
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section>
        <h3 className="mb-3 font-display text-lg font-medium tracking-tightest">Specialties</h3>
        <p className="mb-3 text-[12px] text-muted-foreground">
          <span className="font-medium">Keywords</span> (comma-separated) drive symptom triage —
          e.g. <em>knee, back, joint, fracture</em>.
        </p>
        <div className="space-y-3">
          {specialties.map((s) => (
            <SpecialtyRow key={s.id} s={s} onChange={onChange} />
          ))}
          <AddSpecialty onChange={onChange} />
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-display text-lg font-medium tracking-tightest">Doctors</h3>
        <p className="mb-3 text-[12px] text-muted-foreground">
          The receptionist names these when steering a patient to a clinic.
        </p>
        <div className="space-y-3">
          {doctors.map((d) => (
            <DoctorRow key={d.id} d={d} onChange={onChange} />
          ))}
          <AddDoctor onChange={onChange} />
        </div>
      </section>
    </div>
  );
}

/* ---------------- specialties ---------------- */

function SpecialtyRow({ s, onChange }: { s: Specialty; onChange: () => void }) {
  const [name, setName] = useState(s.name);
  const [description, setDescription] = useState(s.description ?? "");
  const [keywords, setKeywords] = useState(s.keywords ?? "");
  const [active, setActive] = useState(s.active);
  const [busy, setBusy] = useState(false);
  const dirty =
    name !== s.name ||
    description !== (s.description ?? "") ||
    keywords !== (s.keywords ?? "") ||
    active !== s.active;

  async function save() {
    setBusy(true);
    await adminFetch(`/api/admin/specialties/${s.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name, description, keywords, active }),
    });
    setBusy(false);
    onChange();
  }
  async function remove() {
    if (!confirm(`Delete specialty "${s.name}"?`)) return;
    setBusy(true);
    await adminFetch(`/api/admin/specialties/${s.id}`, { method: "DELETE" });
    setBusy(false);
    onChange();
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <Input value={name} onChange={(e) => setName(e.target.value)} className="mb-2 font-medium" />
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What this clinic treats"
        className="mb-2 min-h-[54px] text-[12px]"
      />
      <Input
        value={keywords}
        onChange={(e) => setKeywords(e.target.value)}
        placeholder="triage keywords, comma-separated"
        className="mb-2 text-[12px]"
      />
      <div className="flex items-center gap-3 text-[12px]">
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Active
        </label>
        <Button size="sm" onClick={save} disabled={busy || !dirty}>
          Save
        </Button>
        <button type="button" onClick={remove} disabled={busy} className="text-red-600 hover:underline">
          Delete
        </button>
      </div>
    </div>
  );
}

function AddSpecialty({ onChange }: { onChange: () => void }) {
  const [name, setName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [busy, setBusy] = useState(false);
  async function add() {
    setBusy(true);
    const r = await adminFetch("/api/admin/specialties", {
      method: "POST",
      body: JSON.stringify({ name, keywords }),
    });
    setBusy(false);
    if (r.ok) {
      setName("");
      setKeywords("");
      onChange();
    }
  }
  return (
    <div className="rounded-xl border border-dashed border-border p-3">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New specialty name" className="mb-2" />
      <Input
        value={keywords}
        onChange={(e) => setKeywords(e.target.value)}
        placeholder="triage keywords"
        className="mb-2 text-[12px]"
      />
      <Button size="sm" onClick={add} disabled={busy || !name.trim()}>
        Add specialty
      </Button>
    </div>
  );
}

/* ---------------- doctors ---------------- */

function DoctorRow({ d, onChange }: { d: Doctor; onChange: () => void }) {
  const [name, setName] = useState(d.name);
  const [title, setTitle] = useState(d.title);
  const [specialty, setSpecialty] = useState(d.specialty ?? "");
  const [years, setYears] = useState(d.yearsExperience?.toString() ?? "");
  const [fee, setFee] = useState(d.consultationFee ?? "");
  const [active, setActive] = useState(d.active);
  const [busy, setBusy] = useState(false);
  const dirty =
    name !== d.name ||
    title !== d.title ||
    specialty !== (d.specialty ?? "") ||
    years !== (d.yearsExperience?.toString() ?? "") ||
    fee !== (d.consultationFee ?? "") ||
    active !== d.active;

  async function save() {
    setBusy(true);
    await adminFetch(`/api/admin/doctors/${d.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        name,
        title,
        specialty,
        yearsExperience: years ? Number(years) : undefined,
        consultationFee: fee,
        active,
      }),
    });
    setBusy(false);
    onChange();
  }
  async function remove() {
    if (!confirm(`Delete "${d.name}"?`)) return;
    setBusy(true);
    await adminFetch(`/api/admin/doctors/${d.id}`, { method: "DELETE" });
    setBusy(false);
    onChange();
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="font-medium" />
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
        <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Specialty" />
        <div className="grid grid-cols-2 gap-2">
          <Input value={years} onChange={(e) => setYears(e.target.value)} placeholder="Years" inputMode="numeric" />
          <Input value={fee} onChange={(e) => setFee(e.target.value)} placeholder="Fee e.g. $150" />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3 text-[12px]">
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Active
        </label>
        <Button size="sm" onClick={save} disabled={busy || !dirty}>
          Save
        </Button>
        <button type="button" onClick={remove} disabled={busy} className="text-red-600 hover:underline">
          Delete
        </button>
      </div>
    </div>
  );
}

function AddDoctor({ onChange }: { onChange: () => void }) {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [busy, setBusy] = useState(false);
  async function add() {
    setBusy(true);
    const r = await adminFetch("/api/admin/doctors", {
      method: "POST",
      body: JSON.stringify({ name, title, specialty }),
    });
    setBusy(false);
    if (r.ok) {
      setName("");
      setTitle("");
      setSpecialty("");
      onChange();
    }
  }
  return (
    <div className="rounded-xl border border-dashed border-border p-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
        <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Specialty" />
      </div>
      <Button size="sm" className="mt-2" onClick={add} disabled={busy || !name.trim() || !title.trim()}>
        Add doctor
      </Button>
    </div>
  );
}
