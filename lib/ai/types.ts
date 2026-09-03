import { z } from "zod";

/** Patient details gathered over the course of a chat. Every field optional —
 *  the receptionist fills them in as the patient volunteers them. */
export interface CollectedState {
  patientName?: string;
  preferredDoctor?: string;
  specialty?: string;
  preferredDate?: string;
  preferredTime?: string;
  contactPhone?: string;
  contactEmail?: string;
  reasonForVisit?: string;
}

export type ChatIntent =
  | "greeting"
  | "faq"
  | "triage"
  | "booking"
  | "confirm"
  | "submit"
  | "smalltalk"
  | "emergency"
  | "handoff";

export interface AiTurn {
  /** Plain-text message shown to the patient. */
  reply: string;
  /** Only the fields newly learned on this turn. */
  collected: Partial<CollectedState>;
  intent: ChatIntent;
  /** Specialty the receptionist is steering toward, if any. */
  suggestedSpecialty?: string;
  /** True only when every required field is known AND the patient has just
   *  confirmed they want the request submitted. */
  readyToSubmit: boolean;
  /** 1–2 sentence running summary for staff. */
  summary?: string;
}

export interface ReceptionistInput {
  history: { role: "user" | "assistant"; content: string }[];
  userMessage: string;
  collected: CollectedState;
  knowledgeText: string;
  specialties: { name: string; keywords: string[] }[];
  doctors: { name: string; title: string; specialty: string | null }[];
}

/** Fields required before an appointment request can be submitted. */
export function missingForSubmit(c: CollectedState): string[] {
  const missing: string[] = [];
  if (!c.patientName) missing.push("name");
  if (!c.contactPhone) missing.push("phone");
  if (!c.preferredDoctor && !c.specialty) missing.push("doctor or specialty");
  if (!c.preferredDate) missing.push("preferred date");
  if (!c.preferredTime) missing.push("preferred time");
  return missing;
}

/** Schema used to validate whatever a live LLM returns. */
export const aiTurnSchema = z.object({
  reply: z.string().min(1).max(2000),
  collected: z
    .object({
      patientName: z.string().max(80).optional(),
      preferredDoctor: z.string().max(80).optional(),
      specialty: z.string().max(80).optional(),
      preferredDate: z.string().max(80).optional(),
      preferredTime: z.string().max(80).optional(),
      contactPhone: z.string().max(40).optional(),
      contactEmail: z.string().max(120).optional(),
      reasonForVisit: z.string().max(300).optional(),
    })
    .partial()
    .default({}),
  intent: z
    .enum([
      "greeting",
      "faq",
      "triage",
      "booking",
      "confirm",
      "submit",
      "smalltalk",
      "emergency",
      "handoff",
    ])
    .default("smalltalk"),
  suggestedSpecialty: z.string().max(80).optional(),
  readyToSubmit: z.boolean().default(false),
  summary: z.string().max(500).optional(),
});
