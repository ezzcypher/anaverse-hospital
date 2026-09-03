import { CLINIC } from "@/lib/clinic";
import { detectEmergency, emergencyReply } from "@/lib/ai/emergency";
import {
  type AiTurn,
  type CollectedState,
  type ReceptionistInput,
  missingForSubmit,
} from "@/lib/ai/types";

/* ------------------------------------------------------------------ *
 * Small extractors — deliberately conservative. A false negative just
 * means the receptionist asks again; a false positive stores nonsense.
 * ------------------------------------------------------------------ */

const FILLER = new Set([
  "fine", "good", "great", "ok", "okay", "yes", "no", "sure", "here", "there",
  "looking", "not", "interested", "hello", "hi", "hey", "thanks", "thank",
  "please", "nothing", "maybe", "soon", "asap", "help", "me",
]);

function extractPhone(msg: string): string | undefined {
  const m = msg.match(/(\+?\d[\d\s().-]{6,}\d)/);
  if (!m) return undefined;
  const digits = m[1].replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return undefined;
  return m[1].replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
}

function extractEmail(msg: string): string | undefined {
  const m = msg.match(/[^\s@]+@[^\s@]+\.[^\s@]{2,}/);
  return m ? m[0].toLowerCase() : undefined;
}

function looksLikeName(raw: string): boolean {
  const parts = raw.trim().split(/\s+/);
  if (parts.length < 1 || parts.length > 4) return false;
  return parts.every(
    (p) => /^[A-Za-z][A-Za-z'.-]{1,20}$/.test(p) && !FILLER.has(p.toLowerCase()),
  );
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function extractName(msg: string, askedForName: boolean): string | undefined {
  const explicit = msg.match(
    /\b(?:my name is|name'?s|i am|i'?m|this is|it'?s|call me|name:)\s+([A-Za-z][A-Za-z'.\- ]{1,40})/i,
  );
  if (explicit) {
    const cand = explicit[1].replace(/[.,!?].*$/, "").trim();
    if (looksLikeName(cand)) return titleCase(cand);
  }
  if (askedForName) {
    const cleaned = msg.replace(/[.,!?].*$/, "").replace(/^(it'?s|i'?m)\s+/i, "").trim();
    if (looksLikeName(cleaned)) return titleCase(cleaned);
  }
  return undefined;
}

const WEEKDAY = "(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)";
const MONTH = "(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*";

function extractDate(msg: string): string | undefined {
  const low = msg.toLowerCase();
  const patterns: RegExp[] = [
    /\b(today|tomorrow|day after tomorrow|tonight)\b/,
    new RegExp(`\\b(this|next|coming)\\s+${WEEKDAY}\\b`),
    new RegExp(`\\bon\\s+${WEEKDAY}\\b`),
    new RegExp(`\\b${WEEKDAY}\\b(?!\\s*(morning|afternoon|evening))`),
    /\bnext week\b/,
    /\bin\s+(a|\d{1,2})\s+(day|days|week|weeks)\b/,
    new RegExp(`\\b\\d{1,2}(st|nd|rd|th)?\\s+(of\\s+)?${MONTH}\\b`),
    new RegExp(`\\b${MONTH}\\s+\\d{1,2}(st|nd|rd|th)?\\b`),
    /\b\d{1,2}[/-]\d{1,2}([/-]\d{2,4})?\b/,
  ];
  for (const re of patterns) {
    const m = low.match(re);
    if (m) return m[0].replace(/\bon\s+/, "").trim();
  }
  return undefined;
}

function extractTime(msg: string): string | undefined {
  const low = msg.toLowerCase();
  const clock = low.match(/\b(\d{1,2})(:\d{2})?\s*(a\.?m\.?|p\.?m\.?|o'clock)\b/);
  if (clock) return clock[0].replace(/\s+/g, " ").trim();
  const named = low.match(/\b(early morning|morning|midday|noon|lunchtime|afternoon|evening|late afternoon)\b/);
  if (named) return named[0];
  const at = low.match(/\bat\s+(\d{1,2})(:\d{2})?\b/);
  if (at) return at[0].replace(/^at\s+/, "");
  return undefined;
}

function matchDoctor(
  msg: string,
  doctors: ReceptionistInput["doctors"],
): { name: string; specialty: string | null } | undefined {
  const low = msg.toLowerCase();
  for (const d of doctors) {
    const surname = d.name.replace(/^dr\.?\s+/i, "").split(/\s+/).pop()?.toLowerCase();
    if (!surname) continue;
    if (low.includes(d.name.toLowerCase()) || new RegExp(`\\b(dr\\.?\\s+)?${surname}\\b`).test(low)) {
      return { name: d.name, specialty: d.specialty };
    }
  }
  return undefined;
}

function matchSpecialty(
  msg: string,
  specialties: ReceptionistInput["specialties"],
): string | undefined {
  const low = ` ${msg.toLowerCase()} `;
  // direct name mention
  for (const s of specialties) {
    if (low.includes(s.name.toLowerCase())) return s.name;
  }
  // symptom / topic keyword — a whole-word match counts double, a phrase
  // (multi-word keyword) contained anywhere counts once. No length bias.
  let best: { name: string; hits: number } | null = null;
  for (const s of specialties) {
    let hits = 0;
    for (const k of s.keywords) {
      if (!k) continue;
      if (k.includes(" ")) {
        if (low.includes(k)) hits += 1;
      } else if (new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(low)) {
        hits += 2;
      }
    }
    if (hits > 0 && (!best || hits > best.hits)) best = { name: s.name, hits };
  }
  return best?.name;
}

function isAffirmative(msg: string): boolean {
  return /\b(yes|yeah|yep|yup|sure|please|please do|go ahead|confirm|submit|that'?s right|correct|sounds good|ok|okay|do it|book it)\b/i.test(
    msg.trim(),
  );
}
function isNegative(msg: string): boolean {
  return /\b(no|nope|not yet|wait|hold on|change|edit|wrong|incorrect|actually)\b/i.test(msg.trim());
}

// A deliberate booking request (not merely a message that contains the word
// "appointment", e.g. "what should I bring to my appointment").
function wantsBooking(low: string): boolean {
  return /\b(book|booking|schedule|scheduling|reserve|make an appt|make an appointment|get an appointment|arrange (a |an )?(appointment|visit|consultation)|see (a |the )?(doctor|specialist|consultant)|i want to come in)\b/.test(
    low,
  );
}

// Note: stems have NO trailing \b so "insur" matches "insurance", "refer"
// matches "referral", "cancel" matches "cancellation", etc.
function isFaq(low: string): boolean {
  return /\b(hour|opening|closing|timing|when.*(open|close)|where|located|location|address|direction|park|contact|phone|number|email|reach us|insur|cover|claim|bill|invoice|refer|bring|prepare|cancel|reschedul|visiting hour|price|cost|fee|charge|how much|wheelchair|access|screen|package|assessment|health check|wellness|video (call|consult|appointment)|telehealth|pharmacy)/.test(
    low,
  );
}

function asksAboutServices(low: string): boolean {
  return /\b(what (services|specialt|clinics|departments)|which (specialt|departments|clinics)|list of (doctors|specialt)|what do you (offer|treat)|do you (have|treat|offer))\b/.test(
    low,
  );
}

function searchKnowledge(knowledgeText: string, ...needles: string[]): string | undefined {
  const lines = knowledgeText.split("\n");
  for (const n of needles) {
    const hit = lines.find((l) => /^\[[a-z]+\]/i.test(l) && l.toLowerCase().includes(n));
    if (hit) {
      const idx = hit.indexOf(": ");
      return idx >= 0 ? hit.slice(idx + 2).trim() : hit;
    }
  }
  return undefined;
}

function answerFromKnowledge(low: string, knowledgeText: string): string {
  // Specific topics first, so "pharmacy hours" doesn't fall into the generic
  // clinic-hours answer.
  if (/\bpharmacy\b/.test(low)) {
    return searchKnowledge(knowledgeText, "pharmacy") ?? "The on-site pharmacy is open Monday to Saturday, 8:00–20:00.";
  }
  if (/\b(screen|screening|package|assessment|health check|wellness)\b/.test(low)) {
    return (
      searchKnowledge(knowledgeText, "health assessment", "assessments", "screening") ??
      "We offer half-day health assessments with a consultant review, bloods and an ECG."
    );
  }
  if (/\b(video (call|consult|appointment)|telehealth|remote appointment)\b/.test(low)) {
    return searchKnowledge(knowledgeText, "video consultation") ?? "Several clinics offer video appointments for follow-ups — ask reception when booking.";
  }
  if (/\b(park|parking)\b/.test(low)) {
    return (
      searchKnowledge(knowledgeText, "visitor parking", "underground", "getting here") ??
      `There is visitor parking on site at ${CLINIC.address}.`
    );
  }
  if (/\b(where|located|location|address|direction|get to|find you)\b/.test(low)) {
    return `We're at ${CLINIC.address}. ${searchKnowledge(knowledgeText, "visitor parking", "getting here") ?? ""}`.trim();
  }
  if (/\b(hour|open|opening|close|closing|timing|when)\b/.test(low)) {
    return (
      "Our hours are:\n" +
      CLINIC.hours.map(([k, v]) => `• ${k}: ${v}`).join("\n")
    );
  }
  if (/\b(contact|phone|call|number|email|reach)/.test(low)) {
    return `You can reach reception on ${CLINIC.reception} or email ${CLINIC.email}. For anything urgent, Emergency & Trauma is ${CLINIC.emergency}, open 24 hours.`;
  }
  if (/\b(insur|cover|claim)/.test(low)) {
    return searchKnowledge(knowledgeText, "insurance", "billing") ?? "Please check cover with your insurer; reception can confirm what we accept.";
  }
  if (/\b(refer)/.test(low)) {
    return searchKnowledge(knowledgeText, "referral") ?? "You can book many clinics directly; some specialties prefer a GP referral. Reception can advise.";
  }
  if (/\b(bring|prepare)/.test(low)) {
    return searchKnowledge(knowledgeText, "bring", "before your appointment") ?? "Please bring photo ID, any referral letter, a list of current medicines, and previous scans or results if you have them.";
  }
  if (/\b(cancel|reschedul)/.test(low)) {
    return searchKnowledge(knowledgeText, "cancel", "reschedul") ?? "To change or cancel an appointment, please give us at least 24 hours' notice by calling reception.";
  }
  if (/\b(visiting|visitor)/.test(low)) {
    return "Visiting hours are every day, 11:00 – 20:00.";
  }
  if (/\b(price|cost|fee|charge|how much)/.test(low)) {
    return (
      (searchKnowledge(knowledgeText, "consultation fee", "fees", "pricing") ??
        "Consultation fees vary by specialist.") +
      " Each consultant's fee is listed with their profile — I can tell you a specific one if you name the doctor or specialty."
    );
  }
  return (
    searchKnowledge(knowledgeText, ...low.split(/\s+/).filter((w) => w.length > 4)) ??
    `I don't have that detail to hand, but reception can help on ${CLINIC.reception}, or leave your name and number and a colleague will follow up.`
  );
}

function summaryCard(c: CollectedState): string {
  return [
    "Here is your appointment request:",
    "",
    `Name: ${c.patientName ?? "—"}`,
    `Doctor/Specialty: ${c.preferredDoctor ?? c.specialty ?? "—"}`,
    `Date: ${c.preferredDate ?? "—"}`,
    `Time: ${c.preferredTime ?? "—"}`,
    "",
    "Would you like me to submit this request?",
  ].join("\n");
}

function runningSummary(c: CollectedState, topic: string): string {
  const who = c.patientName ?? "Visitor";
  const reason = c.reasonForVisit ?? topic ?? "general enquiry";
  const target = c.preferredDoctor ?? c.specialty;
  const when = [c.preferredDate, c.preferredTime].filter(Boolean).join(" ");
  const parts = [`${who} — ${reason}`];
  if (target) parts.push(`wants ${target}`);
  if (when) parts.push(`preferred ${when}`);
  if (c.contactPhone) parts.push("phone on file");
  return parts.join("; ") + ".";
}

/* ------------------------------------------------------------------ *
 * The rule-based receptionist (DEMO mode)
 * ------------------------------------------------------------------ */

export function mockReceptionist(input: ReceptionistInput): AiTurn {
  const { userMessage, collected, history, knowledgeText, specialties, doctors } = input;
  const msg = userMessage.trim();
  const low = msg.toLowerCase();

  if (detectEmergency(low)) {
    return {
      reply: emergencyReply(),
      collected: {},
      intent: "emergency",
      readyToSubmit: false,
      summary: "Possible emergency mentioned — advised to seek urgent care. Not booked.",
    };
  }

  const lastAssistant = [...history].reverse().find((m) => m.role === "assistant")?.content ?? "";
  const askedForName = /\bname\b/.test(lastAssistant.toLowerCase()) && /\?/.test(lastAssistant);
  const awaitingConfirm = /submit this request/i.test(lastAssistant);

  // --- extract everything this message offers ---
  const found: Partial<CollectedState> = {};
  const phone = extractPhone(msg);
  if (phone && !collected.contactPhone) found.contactPhone = phone;
  const email = extractEmail(msg);
  if (email && !collected.contactEmail) found.contactEmail = email;
  const name = extractName(msg, askedForName);
  if (name && !collected.patientName) found.patientName = name;

  // If we just asked for a name and the reply is only a name, don't try to read
  // a doctor/specialty/date/time out of it (a surname can collide with a doctor).
  const bareName = askedForName && !!name && msg.replace(/[^A-Za-z ]/g, "").trim().split(/\s+/).length <= 4 && !/\d/.test(msg);

  const date = bareName ? undefined : extractDate(msg);
  if (date && !collected.preferredDate) found.preferredDate = date;
  const time = bareName ? undefined : extractTime(msg);
  if (time && !collected.preferredTime) found.preferredTime = time;

  const doc = bareName ? undefined : matchDoctor(msg, doctors);
  if (doc && !collected.preferredDoctor) {
    found.preferredDoctor = doc.name;
    if (doc.specialty && !collected.specialty) found.specialty = doc.specialty;
  }
  let spec = bareName ? undefined : matchSpecialty(msg, specialties);

  // A concern about a child goes to Paediatrics regardless of the body part.
  const childContext = /\b(my (daughter|son|child|kid|baby|toddler|little one|newborn)|for my (daughter|son|child|kid|baby))\b/.test(
    low,
  );
  if (childContext && !bareName) {
    const paeds = specialties.find((s) => /paediatr|pediatr/i.test(s.name));
    if (paeds) spec = paeds.name;
  }

  if (spec && !collected.specialty && !found.specialty) found.specialty = spec;

  const symptomish =
    !!spec &&
    !wantsBooking(low) &&
    /\b(pain|ache|hurt|sore|swollen|swelling|problem|issue|trouble|symptom|rash|lump|cough|fever|dizzy|injured|injury|sprain|broke|broken|checkup|check-up|screening|worried about)\b/.test(
      low,
    );
  if (symptomish && !collected.reasonForVisit && !found.reasonForVisit) {
    found.reasonForVisit = msg.slice(0, 200);
  }

  const known: CollectedState = { ...collected, ...found };
  const nameBit = known.patientName ? `, ${known.patientName.split(" ")[0]}` : "";

  // --- awaiting confirmation of a shown summary ---
  if (awaitingConfirm) {
    if (isAffirmative(low) && missingForSubmit(known).length === 0) {
      return {
        reply: `Perfect${nameBit} — I'm submitting your appointment request now. Our reception team will call you shortly to confirm the exact time.`,
        collected: found,
        intent: "submit",
        suggestedSpecialty: known.specialty,
        readyToSubmit: true,
        summary: runningSummary(known, "appointment request"),
      };
    }
    if (isNegative(low)) {
      return {
        reply:
          "No problem — what would you like to change? You can tell me a new name, phone number, doctor or specialty, date, or time.",
        collected: found,
        intent: "booking",
        readyToSubmit: false,
        summary: runningSummary(known, "editing appointment request"),
      };
    }
    // They said something else — re-extract, then re-show if still complete.
    if (missingForSubmit(known).length === 0) {
      return {
        reply: `Thanks${nameBit}. ${summaryCard(known)}`,
        collected: found,
        intent: "confirm",
        readyToSubmit: false,
        summary: runningSummary(known, "confirming appointment request"),
      };
    }
  }

  const midFlow = awaitingConfirm || hasBookingProgress(collected);
  const explicitBooking = /\b(book|schedule|reserve|make an appointment|make an appt)\b/.test(low);

  // --- FAQ before booking, unless we're mid-flow or they explicitly asked to book ---
  if (!midFlow && !explicitBooking && isFaq(low)) {
    return {
      reply:
        answerFromKnowledge(low, knowledgeText) +
        "\n\nIf you'd like, I can also help you book an appointment.",
      collected: found,
      intent: "faq",
      readyToSubmit: false,
      summary: runningSummary(known, "clinic question"),
    };
  }

  const booking = awaitingConfirm || wantsBooking(low) || hasBookingProgress(collected) || hasBookingProgress(found);

  const activeSpecialty = found.specialty ?? spec ?? collected.specialty;
  const askedWhichDoctor =
    /\b(which|what|who)\b[^?]*\b(doctor|specialist|consultant|department|clinic|team|see|go to)\b/.test(low) ||
    /\bwho should i see\b/.test(low) ||
    /\brecommend (a |me )?(doctor|specialist|someone)\b/.test(low);

  // --- symptom / "which doctor?" triage (uses remembered context) ---
  if (!booking && activeSpecialty && (symptomish || askedWhichDoctor || spec)) {
    const docForSpec = doctors.find(
      (d) => d.specialty && d.specialty.toLowerCase() === activeSpecialty.toLowerCase(),
    );
    const docBit = docForSpec
      ? ` ${docForSpec.name} (${docForSpec.title}) sees patients in that clinic.`
      : "";
    return {
      reply:
        `I can't give medical advice, but that's usually looked after by our ${activeSpecialty} team.${docBit} ` +
        `Would you like me to help you book an appointment, or check available times?`,
      collected: found,
      intent: "triage",
      suggestedSpecialty: activeSpecialty,
      readyToSubmit: false,
      summary: runningSummary(known, `asked about ${activeSpecialty}`),
    };
  }

  // --- active booking flow ---
  if (booking) {
    const missing = missingForSubmit(known);
    if (missing.length === 0) {
      return {
        reply: `${found.patientName || found.contactPhone || found.preferredDate || found.preferredTime ? `Thanks${nameBit}. ` : ""}${summaryCard(known)}`,
        collected: found,
        intent: "confirm",
        suggestedSpecialty: known.specialty,
        readyToSubmit: false,
        summary: runningSummary(known, "appointment request"),
      };
    }
    const ask = nextQuestion(missing[0], nameBit, known);
    return {
      reply: ask,
      collected: found,
      intent: "booking",
      suggestedSpecialty: known.specialty,
      readyToSubmit: false,
      summary: runningSummary(known, "booking in progress"),
    };
  }

  // --- FAQ (before the generic "what services" list, so specific questions win) ---
  if (isFaq(low)) {
    return {
      reply:
        answerFromKnowledge(low, knowledgeText) +
        "\n\nIf you'd like, I can also help you book an appointment.",
      collected: found,
      intent: "faq",
      readyToSubmit: false,
      summary: runningSummary(known, "clinic question"),
    };
  }

  // --- "what specialties / services do you have?" ---
  if (asksAboutServices(low) && specialties.length) {
    const list = specialties.slice(0, 10).map((s) => s.name).join(", ");
    return {
      reply:
        `We have clinics across ${list}${specialties.length > 10 ? " and more" : ""}. ` +
        `Tell me what's going on and I can point you to the right one, or I can help you book.`,
      collected: found,
      intent: "faq",
      readyToSubmit: false,
      summary: runningSummary(known, "asked about our specialties"),
    };
  }

  // --- soft decline / "just looking" ---
  if (/\b(just (looking|browsing)|not (now|yet|today)|maybe later|no thanks|nothing (for )?now|i'?m (ok|fine|good))\b/.test(low)) {
    return {
      reply:
        "No problem at all — I'm here whenever you're ready. You can ask me about the hospital, a specialty, or book an appointment any time.",
      collected: found,
      intent: "smalltalk",
      readyToSubmit: false,
      summary: runningSummary(known, "browsing, not ready to book"),
    };
  }

  // --- greeting / fallback ---
  const greeting = /^(hi|hello|hey|good (morning|afternoon|evening)|hiya|hola)\b/.test(low) || low.length < 4;
  return {
    reply: greeting
      ? `Hello${nameBit}! I'm the ${CLINIC.name} virtual receptionist. I can answer questions about the hospital, help you find the right specialist, or book an appointment. What can I help you with?`
      : `I can help with questions about ${CLINIC.name}, finding the right specialist, or booking an appointment. Could you tell me a little more about what you need?`,
    collected: found,
    intent: greeting ? "greeting" : "smalltalk",
    readyToSubmit: false,
    summary: runningSummary(known, "general chat"),
  };
}

function hasBookingProgress(c: Partial<CollectedState>): boolean {
  return Boolean(
    c.patientName || c.contactPhone || c.preferredDate || c.preferredTime || c.preferredDoctor,
  );
}

function nextQuestion(field: string, nameBit: string, known: CollectedState): string {
  switch (field) {
    case "name":
      return "I'd be happy to help you book an appointment. Could I take your name, please?";
    case "phone":
      return `Thanks${nameBit}. What's the best phone number to reach you on?`;
    case "doctor or specialty":
      return `Which doctor or specialty would you like to see${known.reasonForVisit ? "" : ""}?`;
    case "preferred date":
      return "What day would suit you? You can say something like \"next Tuesday\" or a date.";
    case "preferred time":
      return "And what time works best — morning, afternoon, or a specific time?";
    default:
      return "Could you tell me a bit more so I can get this booked?";
  }
}
