import { Plus, Siren } from "lucide-react";

import { AppointmentDialog } from "@/components/appointment-dialog";
import { DEPARTMENTS, HOSPITAL, NAV } from "@/components/site-data";

const tel = (s: string) => `tel:${s.replace(/[^+\d]/g, "")}`;
const year = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer className="relative isolate overflow-hidden bg-ink text-white">
      {/* Full-bleed background */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/footer/bg.jpg"
        alt=""
        aria-hidden
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/95 via-ink/88 to-ink"
      />

      <div className="container-x py-20 md:py-28">
        <div className="flex flex-col gap-10 border-b border-white/12 pb-14 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2.5 font-display text-4xl font-medium tracking-tightest md:text-5xl">
              <Plus className="h-7 w-7 text-sky" strokeWidth={3} />
              {HOSPITAL.name}
            </span>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/65">
              {HOSPITAL.full}. {HOSPITAL.tagline}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <AppointmentDialog
              label="Book an appointment"
              className="bg-white text-ink hover:bg-white/90"
            />
            <a
              href={tel(HOSPITAL.emergency)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              <Siren className="h-4 w-4" />
              Emergency · {HOSPITAL.emergency}
            </a>
          </div>
        </div>

        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
              Explore
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a
                    href={n.href}
                    className="text-sm text-white/75 transition-colors hover:text-white"
                  >
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
              Departments
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {DEPARTMENTS.map((d) => (
                <li key={d.title} className="text-sm text-white/75">
                  {d.title}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
              Visit
            </h3>
            <address className="mt-4 flex flex-col gap-2.5 text-sm not-italic text-white/75">
              <span>{HOSPITAL.address}</span>
              <a href={tel(HOSPITAL.phone)} className="hover:text-white">
                {HOSPITAL.phone}
              </a>
              <a href={`mailto:${HOSPITAL.email}`} className="hover:text-white">
                {HOSPITAL.email}
              </a>
            </address>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
              Hours
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {HOSPITAL.hours.map(([k, v]) => (
                <li key={k} className="text-sm text-white/75">
                  <span className="block text-white/50">{k}</span>
                  {v}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/12 pt-8 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {HOSPITAL.name}. A fictional hospital, built as a design
            demonstration.
          </p>
          <p className="flex gap-5">
            <a href="#" className="hover:text-white/80">
              Privacy
            </a>
            <a href="#" className="hover:text-white/80">
              Patient charter
            </a>
            <a href="#" className="hover:text-white/80">
              Accessibility
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
