import { ArrowUpRight } from "lucide-react";

import { Reveal } from "@/components/reveal";
import { DEPARTMENTS } from "@/components/site-data";

export function Departments() {
  return (
    <section id="care" className="bg-secondary/40">
      <div className="container-x py-24 md:py-32">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Reveal>
              <p className="eyebrow">
                <span className="h-px w-8 bg-primary" />
                Departments
              </p>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="mt-6 max-w-2xl font-display text-[clamp(28px,4.4vw,48px)] font-medium leading-[1.1] tracking-tightest text-foreground">
                Care, organised around the patient — not the building.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={140}>
            <a
              href="#pricing"
              className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-primary transition-colors hover:text-foreground"
            >
              See what a visit costs
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </Reveal>
        </div>

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {DEPARTMENTS.map((d, i) => (
            <Reveal as="li" key={d.title} delay={(i % 3) * 70}>
              <div className="group h-full rounded-2xl border border-border bg-card p-7 transition-all duration-500 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_24px_60px_-32px_rgba(22,103,230,0.4)]">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-500 group-hover:bg-primary group-hover:text-primary-foreground">
                  <d.icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-6 font-display text-xl font-medium tracking-tightest text-foreground">
                  {d.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {d.copy}
                </p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
