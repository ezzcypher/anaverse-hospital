import { CLINIC } from "@/lib/clinic";

/**
 * Safety net. Runs on every inbound message regardless of AI mode. If it fires,
 * the receptionist does not triage, book, or chat — it tells the person to get
 * urgent help. Deliberately broad: over-warning is the safe failure here.
 */
const EMERGENCY_PATTERNS: RegExp[] = [
  /\bchest (pain|pressure|tightness)\b/,
  /\b(crushing|radiating) (chest|arm|jaw)\b/,
  /\b(can'?t|cannot|can not|struggling to|hard to) breathe\b/,
  /\b(difficulty|trouble|labou?red) breathing\b/,
  /\bshort(ness)? of breath\b/,
  /\bchoking\b/,
  /\b(having|had) a (stroke|heart attack)\b/,
  /\bface (is )?droop/,
  /\bslurred speech\b/,
  /\b(numb|weak)(ness)? (on |down )?(one side|left side|right side)\b/,
  /\b(unconscious|unresponsive|passed out|blacked out|collapsed)\b/,
  /\b(severe|heavy|profuse) bleeding\b/,
  /\bbleeding (that )?(won'?t|will not) stop\b/,
  /\b(coughing|vomiting|throwing) up blood\b/,
  /\banaphyla/,
  /\b(severe allergic|throat (is )?closing|tongue swelling)\b/,
  /\b(suicidal|kill myself|end my life|want to die|take my (own )?life|self[- ]harm)\b/,
  /\boverdose(d)?\b/,
  /\bseizure (that )?(won'?t|will not) stop\b/,
  /\b(poisoned|swallowed poison)\b/,
  /\b(major|severe) (accident|trauma|burn)\b/,
  /\bbone(s)? (sticking|poking) (out|through)\b/,
];

export function detectEmergency(text: string): boolean {
  const t = text.toLowerCase();
  return EMERGENCY_PATTERNS.some((re) => re.test(t));
}

export function emergencyReply(): string {
  return (
    "This may be a medical emergency, and I'm not able to assess symptoms. " +
    "If this is happening now, please call your local emergency number immediately, " +
    `go to the nearest emergency department, or reach Anaverse Emergency & Trauma on ${CLINIC.emergency} — it is open 24 hours. ` +
    "If the situation has already passed and you would like a follow-up appointment, tell me and I can help you book with the right clinic."
  );
}
