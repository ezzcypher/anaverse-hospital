"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  MessageCircle,
  Phone,
  RotateCcw,
  Send,
  Stethoscope,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface Msg {
  role: "assistant" | "user";
  content: string;
  emergency?: boolean;
  reference?: string;
}

interface Hello {
  mode: "demo" | "live";
  greeting: string;
  suggestions: string[];
  disclaimer: string;
}

const UI_KEY = "av_chat_ui_v1";
const EMERGENCY_TEL = "+15552004111";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [hello, setHello] = useState<Hello | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const loadedHello = useRef(false);

  // Restore visible transcript for this tab.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(UI_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { open: boolean; messages: Msg[] };
        if (Array.isArray(saved.messages)) setMessages(saved.messages);
        if (saved.open) setOpen(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(UI_KEY, JSON.stringify({ open, messages }));
    } catch {
      /* ignore */
    }
  }, [open, messages]);

  const loadHello = useCallback(async () => {
    if (loadedHello.current) return;
    loadedHello.current = true;
    try {
      const res = await fetch("/api/chat", { headers: { accept: "application/json" } });
      const data = (await res.json()) as Hello;
      setHello(data);
      setMessages((prev) =>
        prev.length ? prev : [{ role: "assistant", content: data.greeting }],
      );
    } catch {
      setHello({
        mode: "demo",
        greeting: "Hello! I'm the Anaverse virtual receptionist. How can I help?",
        suggestions: ["Opening hours", "Find a specialist", "Book an appointment"],
        disclaimer:
          "I can't provide medical advice. In an emergency, call your local emergency number.",
      });
    }
  }, []);

  useEffect(() => {
    if (open) {
      void loadHello();
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [open, loadHello]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(text: string, reset = false) {
    const message = text.trim();
    if (!message || busy) return;
    setError(null);
    setShowSuggestions(false);
    setMessages((m) => [...m, { role: "user", content: message }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, reset }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        reply?: string;
        error?: string;
        emergency?: boolean;
        appointment?: { reference: string };
      };
      if (!res.ok || !data.reply) {
        setError(data.error ?? "Something went wrong. Please try again, or call reception.");
        return;
      }
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.reply!,
          emergency: data.emergency,
          reference: data.appointment?.reference,
        },
      ]);
    } catch {
      setError("Network problem — please try again, or call reception.");
    } finally {
      setBusy(false);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }

  function restart() {
    setMessages(hello ? [{ role: "assistant", content: hello.greeting }] : []);
    setShowSuggestions(true);
    setError(null);
    void send("Hello", true).then(() => {
      // send() adds a user "Hello" bubble + reply; trim the extra user bubble
      setMessages((m) => m.filter((msg, i) => !(i === 1 && msg.role === "user")));
    });
  }

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close the receptionist chat" : "Open the receptionist chat"}
        className={cn(
          "fixed bottom-5 right-5 z-[70] flex h-14 w-14 items-center justify-center rounded-full",
          "bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform",
          "hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "motion-reduce:transition-none",
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Anaverse virtual receptionist"
          className={cn(
            "fixed bottom-24 right-5 z-[70] flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl",
            "w-[min(400px,calc(100vw-2.5rem))] h-[min(560px,calc(100dvh-8rem))]",
            "animate-fade-up motion-reduce:animate-none",
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border bg-secondary/50 px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
              <Stethoscope className="h-[18px] w-[18px]" strokeWidth={1.9} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-semibold leading-tight text-foreground">
                Anaverse Reception
                {hello?.mode === "demo" && (
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
                    Demo
                  </span>
                )}
              </p>
              <p className="text-[11px] text-muted-foreground">Virtual receptionist · replies instantly</p>
            </div>
            <button
              type="button"
              onClick={restart}
              aria-label="Start over"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed",
                    m.role === "user"
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : m.emergency
                        ? "rounded-bl-sm border border-red-200 bg-red-50 text-red-900"
                        : "rounded-bl-sm bg-secondary text-foreground",
                  )}
                >
                  {m.emergency && (
                    <span className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-red-700">
                      <AlertTriangle className="h-3.5 w-3.5" /> Urgent
                    </span>
                  )}
                  {m.content}
                  {m.emergency && (
                    <a
                      href={`tel:${EMERGENCY_TEL}`}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-[11px] font-semibold text-white"
                    >
                      <Phone className="h-3 w-3" /> Call Anaverse Emergency
                    </a>
                  )}
                  {m.reference && (
                    <span className="mt-2 block rounded-lg bg-primary/10 px-2.5 py-1.5 text-[11px] font-semibold text-primary">
                      Request sent · Reference {m.reference}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {busy && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-secondary px-3.5 py-2.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground motion-reduce:animate-none" />
                  <span className="text-[12px] text-muted-foreground">typing…</span>
                </div>
              </div>
            )}

            {showSuggestions && hello?.suggestions?.length ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {hello.suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border border-border bg-background px-3 py-1 text-[12px] text-foreground/80 hover:border-primary/40 hover:text-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : null}

            {error && (
              <p role="alert" className="text-[12px] text-red-600">
                {error}
              </p>
            )}
          </div>

          {/* Disclaimer + input */}
          <div className="border-t border-border px-4 py-3">
            <p className="mb-2 text-[10px] leading-snug text-muted-foreground">
              {hello?.disclaimer ??
                "I can't provide medical advice. In an emergency, call your local emergency number."}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-end gap-2"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                maxLength={2000}
                placeholder="Type your message…"
                className="max-h-24 min-h-[40px] flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
