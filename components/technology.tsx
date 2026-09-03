import { Reveal } from "@/components/reveal";
import { TOOLS } from "@/components/site-data";

export function Technology() {
  return (
    <section id="technology" className="bg-ink text-white">
      <div className="container-x py-24 md:py-32">
        <div className="max-w-2xl">
          <Reveal>
            <p className="eyebrow text-sky">
              <span className="h-px w-8 bg-sky" />
              Technology
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-6 font-display text-[clamp(28px,4.4vw,50px)] font-medium leading-[1.08] tracking-tightest">
              The equipment behind the calm.
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-5 text-[15px] leading-relaxed text-white/65">
              Diagnostic and theatre kit chosen for one reason: fewer steps
              between a question and an answer. Serviced on a single log,
              barcoded to your procedure, and never more than a floor away.
            </p>
          </Reveal>
        </div>

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool, i) => (
            <Reveal
              as="li"
              key={tool.title}
              delay={(i % 3) * 70}
              className={i === 0 ? "sm:col-span-2 lg:col-span-2" : ""}
            >
              <figure className="group h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                <div className="relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tool.src}
                    alt={tool.title}
                    loading="lazy"
                    className={`w-full object-cover transition-transform [transition-duration:1200ms] ease-silk group-hover:scale-[1.04] ${
                      i === 0 ? "aspect-[16/10] lg:aspect-[16/8]" : "aspect-[16/11]"
                    }`}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
                  {tool.price && (
                    <span className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink">
                      {tool.price}
                    </span>
                  )}
                </div>
                <figcaption className="p-6">
                  <h3 className="font-display text-lg font-medium tracking-tightest">
                    {tool.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">
                    {tool.spec}
                  </p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
