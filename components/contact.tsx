import { Clock, Mail, MapPin, Phone, Siren } from "lucide-react";

import { Reveal } from "@/components/reveal";
import { AppointmentDialog } from "@/components/appointment-dialog";
import { ContactForm } from "@/components/contact-form";
import { HOSPITAL } from "@/components/site-data";

const tel = (s: string) => `tel:${s.replace(/[^+\d]/g, "")}`;

export function Contact() {
  return (
    <section id="contact" className="bg-secondary/40">
      <div className="container-x py-24 md:py-32">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <Reveal>
              <p className="eyebrow">
                <span className="h-px w-8 bg-primary" />
                Contact
              </p>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="mt-6 font-display text-[clamp(28px,4.6vw,52px)] font-medium leading-[1.06] tracking-tightest text-foreground">
                Come in, or call first.
              </h2>
            </Reveal>
            <Reveal delay={140}>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                Outpatient appointments are confirmed by phone within one working
                hour. Emergency and trauma need no referral — walk in, any hour.
              </p>
            </Reveal>

            <Reveal delay={200}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <AppointmentDialog label="Book an appointment" size="lg" />
                <a
                  href={tel(HOSPITAL.emergency)}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <Siren className="h-4 w-4" />
                  Emergency · {HOSPITAL.emergency}
                </a>
              </div>
            </Reveal>
          </div>

          <Reveal delay={120}>
            <div className="rounded-2xl border border-border bg-card p-8">
              <dl className="flex flex-col gap-6">
                <div className="flex gap-4">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Address
                    </dt>
                    <dd className="mt-1 text-[15px] text-foreground">
                      {HOSPITAL.address}
                    </dd>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Reception
                    </dt>
                    <dd className="mt-1 text-[15px] text-foreground">
                      <a href={tel(HOSPITAL.phone)} className="hover:text-primary">
                        {HOSPITAL.phone}
                      </a>
                    </dd>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Email
                    </dt>
                    <dd className="mt-1 text-[15px] text-foreground">
                      <a
                        href={`mailto:${HOSPITAL.email}`}
                        className="hover:text-primary"
                      >
                        {HOSPITAL.email}
                      </a>
                    </dd>
                  </div>
                </div>

                <div className="flex gap-4 border-t border-border pt-6">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
                  <div className="w-full">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Hours
                    </dt>
                    <dd className="mt-2">
                      <ul className="flex flex-col gap-1.5">
                        {HOSPITAL.hours.map(([k, v]) => (
                          <li
                            key={k}
                            className="flex items-baseline justify-between gap-4 text-sm"
                          >
                            <span className="text-muted-foreground">{k}</span>
                            <span className="text-right font-medium text-foreground">
                              {v}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                </div>
              </dl>
            </div>
          </Reveal>
        </div>

        <Reveal delay={80} className="mt-10 max-w-xl lg:mt-14">
          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}
