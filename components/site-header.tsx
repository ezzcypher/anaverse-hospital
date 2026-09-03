"use client";

import { useEffect, useState } from "react";
import { Menu, Phone, Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { NAV, HOSPITAL } from "@/components/site-data";
import { AppointmentDialog } from "@/components/appointment-dialog";

function Wordmark({ light }: { light: boolean }) {
  return (
    <a
      href="#top"
      className={cn(
        "group inline-flex items-center gap-2 font-display text-xl font-medium tracking-tightest transition-colors",
        light
          ? "text-white [text-shadow:0_1px_10px_rgba(7,26,51,0.45)]"
          : "text-foreground",
      )}
    >
      <Plus
        className="h-4 w-4 text-sky transition-transform duration-500 group-hover:rotate-90"
        strokeWidth={3}
      />
      {HOSPITAL.name}
    </a>
  );
}

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = openMenu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [openMenu]);

  const light = !scrolled;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-colors duration-300",
        scrolled
          ? "border-b border-foreground/10 bg-background/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div
        className={cn(
          "container-x flex items-center justify-between transition-[height] duration-300",
          scrolled ? "h-16" : "h-20",
        )}
      >
        <Wordmark light={light} />

        <nav className="hidden items-center gap-9 lg:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className={cn(
                "text-[13px] font-medium tracking-wide transition-colors hover:text-primary",
                light
                  ? "text-white [text-shadow:0_1px_10px_rgba(7,26,51,0.45)]"
                  : "text-foreground/70",
              )}
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          <a
            href={`tel:${HOSPITAL.emergency.replace(/[^+\d]/g, "")}`}
            className={cn(
              "inline-flex items-center gap-2 text-[13px] font-medium transition-colors hover:text-primary",
              light
                ? "text-white [text-shadow:0_1px_10px_rgba(7,26,51,0.45)]"
                : "text-foreground/70",
            )}
          >
            <Phone className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Emergency</span> 24/7
          </a>
          <AppointmentDialog label="Book now" size="sm" />
        </div>

        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setOpenMenu(true)}
          className={cn("md:hidden", light ? "text-white" : "text-foreground")}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {openMenu && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background md:hidden">
          <div className="container-x flex h-20 items-center justify-between">
            <span className="inline-flex items-center gap-2 font-display text-xl font-medium tracking-tightest">
              <Plus className="h-4 w-4 text-sky" strokeWidth={3} />
              {HOSPITAL.name}
            </span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpenMenu(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="container-x mt-4 flex flex-col">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpenMenu(false)}
                className="border-b border-foreground/10 py-4 font-display text-2xl tracking-tightest"
              >
                {n.label}
              </a>
            ))}
          </nav>
          <div className="container-x mt-8 flex flex-col gap-3">
            <AppointmentDialog label="Book an appointment" className="w-full" />
            <a
              href={`tel:${HOSPITAL.emergency.replace(/[^+\d]/g, "")}`}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-foreground/20 py-3 text-sm font-medium"
            >
              <Phone className="h-4 w-4" />
              Emergency · {HOSPITAL.emergency}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
