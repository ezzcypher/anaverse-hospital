"use client";

import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Check } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DEPARTMENTS, HOSPITAL } from "@/components/site-data";

interface AppointmentDialogProps {
  label?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  className?: string;
}

type FieldErrors = Record<string, string[]>;

export function AppointmentDialog({
  label = "Book an appointment",
  size = "default",
  variant = "default",
  className,
}: AppointmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const formRef = useRef<HTMLFormElement>(null);
  const uid = useId();

  function reset() {
    setReference(null);
    setBusy(false);
    setFormError(null);
    setFieldErrors({});
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setTimeout(reset, 200);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setFormError(null);
    setFieldErrors({});

    const fd = new FormData(event.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      email: String(fd.get("email") ?? ""),
      department: String(fd.get("department") ?? ""),
      note: String(fd.get("note") ?? ""),
      company: String(fd.get("company") ?? ""), // honeypot
    };

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        reference?: string;
        error?: string;
        fields?: FieldErrors;
      };

      if (res.ok && data.ok) {
        setReference(data.reference ?? "received");
        formRef.current?.reset();
        return;
      }
      if (res.status === 422 && data.fields) {
        setFieldErrors(data.fields);
        setFormError("Please check the highlighted fields.");
      } else if (res.status === 429) {
        setFormError(data.error ?? "Too many requests. Please wait a moment.");
      } else {
        setFormError(data.error ?? "Something went wrong. Please try again or call us.");
      }
    } catch {
      setFormError("Network problem — please try again, or call the hospital.");
    } finally {
      setBusy(false);
    }
  }

  const err = (name: string) => fieldErrors[name]?.[0];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size={size} variant={variant} className={className}>
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        {reference ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/12 text-primary">
              <Check className="h-6 w-6" />
            </span>
            <DialogHeader className="items-center">
              <DialogTitle>Request received</DialogTitle>
              <DialogDescription>
                Your reference is{" "}
                <span className="whitespace-nowrap font-medium text-foreground">
                  {reference}
                </span>
                . Reception will call within one working hour to confirm a time.
                For anything urgent, phone{" "}
                <span className="whitespace-nowrap font-medium text-foreground">
                  {HOSPITAL.emergency}
                </span>
                .
              </DialogDescription>
            </DialogHeader>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <p className="eyebrow">Appointments</p>
              <DialogTitle>Request an appointment</DialogTitle>
              <DialogDescription>
                Tell us who to reach and roughly when. Reception confirms every
                request by phone — nothing is booked automatically.
              </DialogDescription>
            </DialogHeader>

            <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4" noValidate>
              <Field label="Full name" htmlFor={`${uid}-name`} error={err("name")}>
                <Input
                  id={`${uid}-name`}
                  name="name"
                  required
                  maxLength={80}
                  autoComplete="name"
                  aria-invalid={!!err("name")}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Phone" htmlFor={`${uid}-phone`} error={err("phone")}>
                  <Input
                    id={`${uid}-phone`}
                    name="phone"
                    type="tel"
                    required
                    maxLength={32}
                    autoComplete="tel"
                    aria-invalid={!!err("phone")}
                  />
                </Field>
                <Field
                  label="Email (optional)"
                  htmlFor={`${uid}-email`}
                  error={err("email")}
                >
                  <Input
                    id={`${uid}-email`}
                    name="email"
                    type="email"
                    maxLength={120}
                    autoComplete="email"
                    aria-invalid={!!err("email")}
                  />
                </Field>
              </div>

              <Field label="Department" htmlFor={`${uid}-dept`} error={err("department")}>
                <select
                  id={`${uid}-dept`}
                  name="department"
                  defaultValue={DEPARTMENTS[0]?.title}
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d.title} value={d.title}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Anything we should know?"
                htmlFor={`${uid}-note`}
                error={err("note")}
                optional
              >
                <Textarea
                  id={`${uid}-note`}
                  name="note"
                  maxLength={1000}
                  placeholder="Preferred days or times, referral details, symptoms…"
                />
              </Field>

              {/* Honeypot: off-screen, not tabbable, ignored by humans. */}
              <div aria-hidden className="absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden">
                <label htmlFor={`${uid}-company`}>Company</label>
                <input
                  id={`${uid}-company`}
                  name="company"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {formError && (
                <p role="alert" className="text-sm text-red-600">
                  {formError}
                </p>
              )}

              <Button type="submit" size="lg" className="mt-1 w-full" disabled={busy}>
                {busy ? "Sending…" : "Send request"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                By sending this you agree we may contact you about your care.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  error,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground"
      >
        {label}
        {optional && <span className="normal-case"> (optional)</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
