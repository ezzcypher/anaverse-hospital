import { BedDouble, HeartPulse, Siren, UsersRound } from "lucide-react";

import { AppointmentDialog } from "@/components/appointment-dialog";
import { HOSPITAL, VITALS } from "@/components/site-data";

const STAT_ICONS = [UsersRound, HeartPulse, BedDouble, Siren] as const;

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[92vh] flex-col justify-center overflow-hidden bg-ink">
      {/* Background — the existing hero photo, unchanged */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/hero/building-dusk.jpg"
        alt=""
        aria-hidden
        className="absolute inset-0 -z-10 h-full w-full object-cover object-center"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-br from-ink/90 via-ink/60 to-ink/25"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-ink via-ink/70 to-transparent"
      />

      {/* Headline block */}
      <div className="container-x flex flex-1 flex-col justify-center pb-10 pt-28 md:pt-32">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-sky">
            <span className="h-px w-8 bg-sky" />
            {HOSPITAL.full}
          </p>

          <h1 className="mt-6 font-display text-[clamp(38px,6.4vw,76px)] font-medium leading-[1.03] tracking-tightest text-white">
            Where the city
            <br />
            <span className="text-sky">comes to heal.</span>
          </h1>

          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-white/75 md:text-base">
            Emergency medicine, cardiology, imaging, surgery and maternity in one
            building — run by consultants who stay with you from the first clinic
            to the day you go home.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="#care"
              className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              Explore our care
            </a>
            <AppointmentDialog
              label="Book an appointment"
              className="h-12 border-white/40 bg-transparent px-6 text-white hover:bg-white hover:text-ink"
              variant="outline"
            />
          </div>
        </div>
      </div>

      {/* Stats bar — a light card sitting across the foot of the hero */}
      <div className="container-x pb-12 md:pb-16">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-black/5 bg-border shadow-2xl shadow-ink/30 md:grid-cols-4">
          {VITALS.map((v, i) => {
            const Icon = STAT_ICONS[i] ?? UsersRound;
            return (
              <div
                key={v.label}
                className="flex items-center gap-3.5 bg-white px-5 py-6 md:px-7"
              >
                <Icon className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
                <div>
                  <dt className="sr-only">{v.label}</dt>
                  <dd>
                    <span className="block font-display text-[22px] font-medium leading-none tracking-tightest text-foreground">
                      {v.value}
                      {(i === 0 || i === 1) && <span className="text-primary">+</span>}
                    </span>
                    <span className="mt-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {v.label}
                    </span>
                  </dd>
                </div>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
