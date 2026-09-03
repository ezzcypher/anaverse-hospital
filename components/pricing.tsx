import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { AppointmentDialog } from "@/components/appointment-dialog";
import { A_LA_CARTE, BENEFITS } from "@/components/site-data";

export function Pricing() {
  return (
    <section id="pricing" className="bg-background">
      <div className="container-x py-24 md:py-32">
        <div className="max-w-2xl">
          <Reveal>
            <p className="eyebrow">
              <span className="h-px w-8 bg-primary" />
              Pricing
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-6 font-display text-[clamp(28px,4.4vw,50px)] font-medium leading-[1.08] tracking-tightest text-foreground">
              Priced before anything begins.
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
              Every pathway is quoted as one itemised figure — consultant fee,
              theatre, imaging, ward — and it does not move once you have signed
              it. The cards below are where most people start.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-4">
          {BENEFITS.map((b, i) => {
            const href =
              b.title === "The Anaverse Standard" ? "#doctors" : "#contact";
            return (
              <Reveal key={b.title} delay={(i % 4) * 60}>
                <div
                  className={cn(
                    "flex h-full flex-col rounded-2xl border p-7",
                    b.featured
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-card-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-11 w-11 items-center justify-center rounded-xl",
                      b.featured
                        ? "bg-white/15 text-primary-foreground"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    <b.icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>

                  <p
                    className={cn(
                      "mt-6 text-[11px] font-semibold uppercase tracking-[0.18em]",
                      b.featured ? "text-primary-foreground/75" : "text-muted-foreground",
                    )}
                  >
                    {b.eyebrow}
                  </p>
                  <h3 className="mt-1.5 font-display text-xl font-medium tracking-tightest">
                    {b.title}
                  </h3>

                  {b.price && (
                    <p className="mt-4 flex items-baseline gap-1.5">
                      <span className="font-display text-4xl font-medium tracking-tightest">
                        {b.price}
                      </span>
                      {b.priceNote && (
                        <span
                          className={cn(
                            "text-xs",
                            b.featured
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground",
                          )}
                        >
                          {b.priceNote}
                        </span>
                      )}
                    </p>
                  )}

                  <ul className="mt-5 flex flex-1 flex-col gap-2.5">
                    {b.lines.map((line) => (
                      <li key={line} className="flex gap-2.5 text-[13px] leading-relaxed">
                        <Check
                          className={cn(
                            "mt-0.5 h-4 w-4 shrink-0",
                            b.featured ? "text-primary-foreground" : "text-primary",
                          )}
                        />
                        <span
                          className={
                            b.featured
                              ? "text-primary-foreground/90"
                              : "text-foreground/80"
                          }
                        >
                          {line}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-7">
                    {b.ctaVariant === "solid" ? (
                      <AppointmentDialog
                        label={b.cta}
                        variant="solid"
                        className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                      />
                    ) : (
                      <a
                        href={href}
                        className={cn(
                          buttonVariants({ variant: "outline" }),
                          "w-full",
                        )}
                      >
                        {b.cta}
                      </a>
                    )}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* À la carte */}
        <Reveal delay={80}>
          <div className="mt-14 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex flex-col gap-2 border-b border-border p-7 sm:flex-row sm:items-end sm:justify-between">
              <h3 className="font-display text-xl font-medium tracking-tightest text-foreground">
                À la carte
              </h3>
              <p className="text-xs text-muted-foreground">
                Indicative starting points — you get an itemised quote before consent.
              </p>
            </div>
            <ul className="divide-y divide-border">
              {A_LA_CARTE.map((row) => (
                <li
                  key={row.item}
                  className="flex items-center justify-between gap-6 px-7 py-4"
                >
                  <span className="text-sm text-foreground/80">{row.item}</span>
                  <span className="whitespace-nowrap font-display text-sm font-medium text-foreground">
                    {row.price}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
