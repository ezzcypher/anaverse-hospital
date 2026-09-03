import { cn } from "@/lib/utils";
import { Reveal } from "@/components/reveal";
import { SPACE_COPY, SPACE_PLATES, SPACE_TABS } from "@/components/site-data";

function Plate({
  src,
  label,
  className,
  imgClassName,
}: {
  src: string;
  label: string;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <figure
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-muted",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={label}
        loading="lazy"
        className={cn("photo-mono h-full w-full object-cover", imgClassName)}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/0 to-ink/0" />
      <figcaption className="absolute bottom-4 left-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/90">
        {label}
      </figcaption>
    </figure>
  );
}

export function Ambience() {
  return (
    <section id="spaces" className="bg-background">
      <div className="container-x py-24 md:py-32">
        <Reveal>
          <p className="eyebrow">
            <span className="h-px w-8 bg-primary" />
            The spaces
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="mt-6 max-w-3xl font-display text-[clamp(28px,4.6vw,52px)] font-medium leading-[1.08] tracking-tightest text-foreground">
            The room does half the healing.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-8 lg:grid-cols-12 lg:gap-12">
          <Reveal className="lg:col-span-5">
            <Plate
              src={SPACE_PLATES.portrait.src}
              label={SPACE_PLATES.portrait.label}
              className="aspect-[4/5] h-full w-full"
            />
          </Reveal>

          <Reveal delay={120} className="flex flex-col justify-center lg:col-span-7">
            <ol className="flex flex-col">
              {SPACE_COPY.map((line, i) => (
                <li
                  key={i}
                  className="flex gap-5 border-t border-border py-6 first:border-t-0 first:pt-0"
                >
                  <span className="font-display text-sm text-primary">
                    0{i + 1}
                  </span>
                  <p className="max-w-xl text-[15px] leading-relaxed text-foreground/80">
                    {line}
                  </p>
                </li>
              ))}
            </ol>

            <div className="mt-6 flex flex-wrap gap-2">
              {SPACE_TABS.map((tab) => (
                <span
                  key={tab}
                  className="rounded-full border border-border bg-secondary/60 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
                >
                  {tab}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      {/* Full-bleed plate */}
      <Reveal className="relative left-1/2 right-1/2 -mx-[50vw] w-screen">
        <Plate
          src={SPACE_PLATES.wide.src}
          label={SPACE_PLATES.wide.label}
          className="h-[52vh] min-h-[340px] w-full rounded-none md:h-[68vh]"
        />
      </Reveal>

      <div className="container-x py-24 md:py-28">
        <div className="grid items-end gap-8 md:grid-cols-2 md:gap-12">
          <Reveal>
            <Plate
              src={SPACE_PLATES.closing.src}
              label={SPACE_PLATES.closing.label}
              className="aspect-[16/11] w-full"
              imgClassName="object-[50%_82%]"
            />
          </Reveal>
          <Reveal delay={120}>
            <p className="font-display text-[clamp(20px,2.6vw,30px)] font-medium leading-[1.25] tracking-tightest text-foreground">
              Six laminar-flow theatres, one imaging suite, and a critical-care
              floor kept a corridor apart — so the most fragile move a patient
              makes is the shortest.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
