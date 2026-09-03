import { Reveal } from "@/components/reveal";
import { HOSPITAL, VITALS } from "@/components/site-data";

export function Statement() {
  return (
    <section id="top" className="relative bg-background">
      <div className="container-x py-24 md:py-32">
        <Reveal>
          <p className="eyebrow">
            <span className="h-px w-8 bg-primary" />
            {HOSPITAL.full}
          </p>
        </Reveal>

        <Reveal delay={80}>
          <h2 className="mt-7 max-w-4xl font-display text-[clamp(30px,5.2vw,60px)] font-medium leading-[1.08] tracking-tightest text-foreground">
            A hospital built around calm — the science kept exacting, the
            experience kept&nbsp;quiet.
          </h2>
        </Reveal>

        <Reveal delay={140}>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Emergency medicine, cardiology, imaging, surgery and maternity in one
            building — run by consultants who stay with you from the first clinic
            to the day you go home.
          </p>
        </Reveal>

        <Reveal delay={200}>
          <dl className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
            {VITALS.map((v, i) => (
              <div key={v.label} className="bg-background px-6 py-8 md:px-8 md:py-10">
                <dt className="sr-only">{v.label}</dt>
                <dd>
                  <span className="block font-display text-[clamp(34px,4.4vw,52px)] font-medium leading-none tracking-tightest text-foreground">
                    {v.value}
                    {(i === 0 || i === 1) && (
                      <span className="text-primary">+</span>
                    )}
                  </span>
                  <span className="mt-3 block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {v.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
