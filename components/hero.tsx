"use client";

import { useEffect, useRef, useState } from "react";
import { BedDouble, ChevronDown, HeartPulse, Siren, UsersRound } from "lucide-react";

import { AppointmentDialog } from "@/components/appointment-dialog";
import { HOSPITAL, VITALS } from "@/components/site-data";

// ─────────────────────────────────────────────────────────────
// HERO — a static, left-aligned headline block over a scroll-locked
// image scrub. On the first visit of a session the page is briefly
// pinned (body position:fixed) and wheel / touch / arrow input drives
// a 0→1 `progress`: the headline block and stats card lift and blur
// out while the background cross-dissolves from the building at dusk
// into the surgical team, and a single reveal line resolves in. Push
// past the end (or press Skip) and it releases into the normal page;
// scroll back to the very top and it re-locks so the reveal can play
// in reverse. Seen-once per session; prefers-reduced-motion gets the
// plain static hero with no lock.
// ─────────────────────────────────────────────────────────────

const IMAGES = ["/hero/building-dusk.jpg", "/hero/team-reveal.jpg"];
const SCRUB_DISTANCE = 2400;
const SEEN_KEY = "av-hero-reveal-seen";
const STAT_ICONS = [UsersRound, HeartPulse, BedDouble, Siren] as const;

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const releaseRef = useRef<(() => void) | null>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (!sectionRef.current) return;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      return;
    }

    let rafId = 0;
    let target = 0;
    let current = 0;
    let locked = false;
    let lockedScrollY = 0;
    let touchStartY = 0;
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {}

    function engageLock() {
      if (locked || typeof document === "undefined") return;
      locked = true;
      lockedScrollY = window.scrollY;
      const b = document.body.style;
      b.position = "fixed";
      b.top = `-${lockedScrollY}px`;
      b.left = "0";
      b.right = "0";
      b.width = "100%";
    }

    function releaseLock() {
      if (!locked || typeof document === "undefined") return;
      locked = false;
      seen = true;
      const y = lockedScrollY;
      const b = document.body.style;
      b.position = "";
      b.top = "";
      b.left = "";
      b.right = "";
      b.width = "";
      window.scrollTo(0, y);
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {}
    }
    releaseRef.current = releaseLock;

    if (!seen && window.scrollY < 4) engageLock();

    function addDelta(deltaY: number): boolean {
      if (!locked) {
        // Released but back at the very top, still scrolling up → re-lock at
        // the end so the reveal can be scrubbed back to the start.
        if (!seen && deltaY < 0 && window.scrollY <= 0) {
          engageLock();
          target = 1;
          current = 1;
          return true;
        }
        return false;
      }
      if (deltaY > 0 && target > 0.999) {
        releaseLock();
        window.scrollBy(0, Math.max(deltaY, 24));
        return false;
      }
      if (deltaY < 0 && target < 0.001) {
        releaseLock();
        return false;
      }
      target = clamp(target + deltaY / SCRUB_DISTANCE, 0, 1);
      return true;
    }

    const onWheel = (e: WheelEvent) => {
      if (addDelta(e.deltaY)) e.preventDefault();
    };
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? touchStartY;
      const dy = touchStartY - y;
      touchStartY = y;
      if (addDelta(dy)) e.preventDefault();
    };
    const onKey = (e: KeyboardEvent) => {
      if (!locked) return;
      const step = SCRUB_DISTANCE * 0.16;
      const map: Record<string, number> = {
        ArrowDown: step,
        PageDown: step * 2.2,
        " ": step * 2.2,
        ArrowUp: -step,
        PageUp: -step * 2.2,
        End: SCRUB_DISTANCE,
        Home: -SCRUB_DISTANCE,
      };
      if (e.key in map && addDelta(map[e.key]!)) e.preventDefault();
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKey);

    function frame() {
      current += (target - current) * 0.16;
      const p = current;

      const b0 = imgRefs.current[0];
      const b1 = imgRefs.current[1];
      if (b0) {
        b0.style.opacity = String(clamp(1 - p * 1.15, 0, 1));
        b0.style.transform = `scale(${(1.04 + p * 0.06).toFixed(4)})`;
      }
      if (b1) {
        b1.style.opacity = String(clamp((p - 0.08) * 1.25, 0, 1));
        b1.style.transform = `scale(${(1.1 - p * 0.06).toFixed(4)})`;
      }

      if (contentRef.current) {
        const t = 1 - clamp(p / 0.42, 0, 1);
        contentRef.current.style.opacity = String(t);
        contentRef.current.style.transform = `translateY(${(1 - t) * -26}px)`;
        contentRef.current.style.filter = `blur(${(1 - t) * 10}px)`;
        contentRef.current.style.pointerEvents = t < 0.06 ? "none" : "auto";
      }

      if (statsRef.current) {
        const s = 1 - clamp(p / 0.5, 0, 1);
        statsRef.current.style.opacity = String(s);
        statsRef.current.style.transform = `translateY(${(1 - s) * 48}px)`;
        statsRef.current.style.pointerEvents = s < 0.06 ? "none" : "auto";
      }

      if (revealRef.current) {
        const r = clamp((p - 0.58) / 0.34, 0, 1);
        revealRef.current.style.opacity = String(r);
        revealRef.current.style.transform = `translateY(${(1 - r) * 20}px)`;
        revealRef.current.style.filter = `blur(${(1 - r) * 8}px)`;
      }

      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;

      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
      cancelAnimationFrame(rafId);
      releaseLock();
      releaseRef.current = null;
    };
  }, []);

  function skip() {
    releaseRef.current?.();
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {}
    const next = sectionRef.current?.nextElementSibling as HTMLElement | null;
    (next ?? document.body).scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section ref={sectionRef} className="relative h-[100dvh] w-full overflow-hidden bg-[#061126]">
      {/* Background images — 0 → 1 cross-dissolve */}
      {IMAGES.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          ref={(el) => {
            imgRefs.current[i] = el;
          }}
          src={src}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            opacity: reduced ? (i === 0 ? 1 : 0) : i === 0 ? 1 : 0,
            transform: `scale(${i === 0 ? 1.04 : 1.1})`,
            willChange: "opacity, transform",
          }}
        />
      ))}

      {/* Scrims — left for headline legibility, bottom for the stats card + release */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, rgba(6,17,38,0.9) 0%, rgba(6,17,38,0.55) 42%, rgba(6,17,38,0.2) 72%, rgba(6,17,38,0.35) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
        style={{
          background:
            "linear-gradient(180deg, rgba(6,17,38,0) 0%, rgba(6,17,38,0.55) 55%, rgba(6,17,38,0.92) 100%)",
        }}
      />

      {/* Reveal line — resolves in over the team photo as the content fades */}
      <div
        ref={revealRef}
        className="pointer-events-none absolute inset-0 flex items-center justify-center px-8 text-center"
        style={{ opacity: 0 }}
      >
        <p className="font-display text-[clamp(24px,4.4vw,52px)] font-medium leading-[1.15] tracking-tightest text-white [text-shadow:0_6px_40px_rgba(0,0,0,0.45)]">
          The people behind the calm.
        </p>
      </div>

      {/* Headline block */}
      <div
        ref={contentRef}
        className="absolute inset-0"
        style={{ willChange: "transform, filter, opacity" }}
      >
        <div className="container-x flex h-full flex-col justify-center pt-24 md:pt-28">
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
              Emergency medicine, cardiology, imaging, surgery and maternity in
              one building — run by consultants who stay with you from the first
              clinic to the day you go home.
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

            {!reduced && (
              <p className="mt-10 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/55">
                <ChevronDown className="h-3.5 w-3.5 animate-bounce motion-reduce:animate-none" />
                Scroll to meet the team
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div
        ref={statsRef}
        className="absolute inset-x-0 bottom-0"
        style={{ willChange: "transform, opacity" }}
      >
        <div className="container-x pb-10 md:pb-14">
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
      </div>

      {/* Skip control + progress bar (motion path only) */}
      {!reduced && (
        <>
          <button
            type="button"
            onClick={skip}
            className="absolute right-[clamp(16px,4vw,40px)] top-[88px] z-[5] rounded-full border border-white/40 bg-white/[0.06] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/90 backdrop-blur-sm hover:bg-white hover:text-ink md:top-24"
          >
            Skip
          </button>
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/15">
            <div
              ref={barRef}
              className="h-full w-full origin-left bg-sky"
              style={{ transform: "scaleX(0)" }}
            />
          </div>
        </>
      )}
    </section>
  );
}
