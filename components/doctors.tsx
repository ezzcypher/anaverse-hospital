import { ArrowUpRight } from "lucide-react";

import { Reveal } from "@/components/reveal";
import { AppointmentDialog } from "@/components/appointment-dialog";
import { DOCTORS } from "@/components/site-data";

export function Doctors() {
  return (
    <section id="doctors" className="bg-secondary/40">
      <div className="container-x py-24 md:py-32">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <Reveal>
              <p className="eyebrow">
                <span className="h-px w-8 bg-primary" />
                The doctors
              </p>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="mt-6 font-display text-[clamp(28px,4.4vw,50px)] font-medium leading-[1.08] tracking-tightest text-foreground">
                Fourteen years, or twenty-seven — either way, the same face at
                every visit.
              </h2>
            </Reveal>
            <Reveal delay={140}>
              <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
                Every name below is a substantive consultant, not a rotating
                registrar — nearly a century of combined ward experience between
                the five of them. Each sets their own clinic fee, shown on the
                card, with nothing else added before you are quoted.
              </p>
            </Reveal>
          </div>
          <Reveal delay={180}>
            <AppointmentDialog label="Request a consultation" variant="outline" />
          </Reveal>
        </div>

        <ul className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-5">
          {DOCTORS.map((doc, i) => {
            const surname = doc.name.split(" ").slice(-1)[0];
            return (
              <Reveal as="li" key={doc.name} delay={(i % 5) * 60}>
                <article className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-gradient-to-b from-sky/40 via-mist/25 to-secondary ring-1 ring-inset ring-foreground/10 transition-all duration-500 hover:ring-primary/40 focus-within:ring-primary/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={doc.photo}
                    alt={doc.name}
                    loading="lazy"
                    className="photo-mono absolute inset-0 h-full w-full object-cover object-top transition-transform [transition-duration:1400ms] ease-silk group-hover:scale-[1.05] group-focus-within:scale-[1.05]"
                  />

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/5" />

                  {/* Always-visible experience badge — the trust anchor. */}
                  <span className="absolute left-3 top-3 rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-ink">
                    {doc.years}
                  </span>

                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <h3 className="font-display text-base font-medium leading-tight tracking-tightest text-white [text-shadow:0_1px_14px_rgba(7,26,51,0.9)]">
                      {doc.name}
                    </h3>
                    <p className="mt-1 text-[12px] font-semibold text-sky">{doc.role}</p>

                    {/* Revealed on hover / keyboard focus. */}
                    <div className="grid grid-rows-[0fr] opacity-0 transition-all duration-500 ease-silk group-hover:grid-rows-[1fr] group-hover:opacity-100 group-focus-within:grid-rows-[1fr] group-focus-within:opacity-100">
                      <div className="overflow-hidden">
                        <p className="mt-3 border-t border-white/15 pt-3 text-[12px] leading-relaxed text-white/75">
                          {doc.focus}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-[12px] text-white/60">Clinic fee</span>
                          <span className="font-display text-sm font-medium text-white">
                            {doc.consult}
                          </span>
                        </div>
                        <a
                          href="#contact"
                          className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-sky transition-colors hover:text-white"
                        >
                          Book with {surname}
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
