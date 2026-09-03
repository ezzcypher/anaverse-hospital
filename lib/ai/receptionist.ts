import { aiRuntime } from "@/lib/config";
import { buildSystemPrompt } from "@/lib/ai/prompt";
import { mockReceptionist } from "@/lib/ai/mock";
import { callOpenAI } from "@/lib/ai/openai";
import { callAnthropic } from "@/lib/ai/anthropic";
import { detectEmergency, emergencyReply } from "@/lib/ai/emergency";
import {
  aiTurnSchema,
  missingForSubmit,
  type AiTurn,
  type CollectedState,
  type ReceptionistInput,
} from "@/lib/ai/types";

export interface ReceptionistResult {
  turn: AiTurn;
  mode: "demo" | "live";
  /** True when live was configured but we fell back to the rule-based reply. */
  usedFallback: boolean;
}

/**
 * Single entry point for a receptionist turn.
 *  - Emergencies short-circuit in every mode (guaranteed safety response).
 *  - DEMO: rule-based mock.
 *  - LIVE: the configured LLM, with an automatic fall back to the mock on any
 *    error, timeout, or malformed response.
 */
export async function runReceptionist(input: ReceptionistInput): Promise<ReceptionistResult> {
  const rt = aiRuntime();

  if (detectEmergency(input.userMessage)) {
    return {
      mode: rt.mode,
      usedFallback: false,
      turn: {
        reply: emergencyReply(),
        collected: {},
        intent: "emergency",
        readyToSubmit: false,
        summary: "Possible emergency mentioned — advised to seek urgent care. Not booked.",
      },
    };
  }

  if (rt.mode === "demo" || !rt.provider) {
    return { mode: "demo", usedFallback: false, turn: mockReceptionist(input) };
  }

  try {
    const system = buildSystemPrompt(input.knowledgeText, input.collected);
    const { aiEnv } = await import("@/lib/env");
    const key = aiEnv().apiKey!;
    const messages = [
      ...input.history.slice(-16).map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: input.userMessage },
    ];

    const raw =
      rt.provider === "anthropic"
        ? await callAnthropic({ apiKey: key, model: rt.model, system, messages })
        : await callOpenAI({ apiKey: key, model: rt.model, system, messages });

    const parsed = aiTurnSchema.safeParse(raw);
    if (!parsed.success) throw new Error("LLM returned an unexpected shape");

    const turn = sanitizeTurn(parsed.data as AiTurn, input.collected);
    return { mode: "live", usedFallback: false, turn };
  } catch (err) {
    console.error(`[ai] live provider failed, using fallback: ${err instanceof Error ? err.name : "error"}`);
    return { mode: "live", usedFallback: true, turn: mockReceptionist(input) };
  }
}

/** The route is the source of truth for "can we submit", but tighten the LLM
 *  output here too so a hallucinated readyToSubmit can't slip through. */
function sanitizeTurn(turn: AiTurn, priorCollected: CollectedState): AiTurn {
  const merged = { ...priorCollected, ...turn.collected };
  const ready = turn.readyToSubmit && missingForSubmit(merged).length === 0;
  return { ...turn, readyToSubmit: ready, reply: turn.reply.slice(0, 2000) };
}
