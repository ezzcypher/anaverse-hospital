"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type FieldErrors = Record<string, string[]>;

export function ContactForm() {
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setFormError(null);
    setFieldErrors({});

    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      subject: String(fd.get("subject") ?? ""),
      body: String(fd.get("body") ?? ""),
      company: String(fd.get("company") ?? ""),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        fields?: FieldErrors;
      };
      if (res.ok && data.ok) {
        setDone(true);
        formRef.current?.reset();
        return;
      }
      if (res.status === 422 && data.fields) {
        setFieldErrors(data.fields);
        setFormError("Please check the highlighted fields.");
      } else if (res.status === 429) {
        setFormError(data.error ?? "Too many messages. Please wait a moment.");
      } else {
        setFormError(data.error ?? "Could not send. Please try again or call us.");
      }
    } catch {
      setFormError("Network problem — please try again, or call the hospital.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-6 text-sm">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
          <Check className="h-4 w-4" />
        </span>
        <p className="text-muted-foreground">
          Thanks — your message reached the front desk. We reply during clinic
          hours; for anything urgent please call instead.
        </p>
      </div>
    );
  }

  const err = (name: string) => fieldErrors[name]?.[0];

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      className="grid gap-4 rounded-2xl border border-border bg-card p-6"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Send a message
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label htmlFor={`${uid}-name`} className="text-xs text-muted-foreground">
            Name
          </label>
          <Input id={`${uid}-name`} name="name" required maxLength={80} autoComplete="name" />
          {err("name") && <p className="text-xs text-red-600">{err("name")}</p>}
        </div>
        <div className="grid gap-1.5">
          <label htmlFor={`${uid}-email`} className="text-xs text-muted-foreground">
            Email
          </label>
          <Input
            id={`${uid}-email`}
            name="email"
            type="email"
            required
            maxLength={120}
            autoComplete="email"
          />
          {err("email") && <p className="text-xs text-red-600">{err("email")}</p>}
        </div>
      </div>
      <div className="grid gap-1.5">
        <label htmlFor={`${uid}-subject`} className="text-xs text-muted-foreground">
          Subject (optional)
        </label>
        <Input id={`${uid}-subject`} name="subject" maxLength={120} />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor={`${uid}-body`} className="text-xs text-muted-foreground">
          Message
        </label>
        <Textarea id={`${uid}-body`} name="body" required maxLength={2000} />
        {err("body") && <p className="text-xs text-red-600">{err("body")}</p>}
      </div>

      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={`${uid}-company`}>Company</label>
        <input id={`${uid}-company`} name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {formError && (
        <p role="alert" className="text-sm text-red-600">
          {formError}
        </p>
      )}
      <Button type="submit" disabled={busy}>
        {busy ? "Sending…" : "Send message"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Please don&rsquo;t send clinical details or emergencies through this form.
      </p>
    </form>
  );
}
