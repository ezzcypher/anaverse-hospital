import { z } from "zod";

/**
 * Input schemas shared by the client forms and the API route handlers.
 * The server always re-validates with these — the client copy is only for UX.
 */

// Strip C0 + DEL control characters (defined via string escapes so no literal
// control byte ends up in this source file).
const CONTROL = new RegExp("[\\u0000-\\u001F\\u007F]", "g");
const stripControl = (s: string) => s.replace(CONTROL, "");
const collapseWs = (s: string) => s.replace(/\s+/g, " ").trim();

const name = z
  .string()
  .transform((s) => collapseWs(stripControl(s)))
  .pipe(z.string().min(2, "Please enter your name").max(80));

const phone = z
  .string()
  .transform((s) => collapseWs(stripControl(s)))
  .pipe(
    z
      .string()
      .min(6, "Enter a valid phone number")
      .max(32)
      .regex(/^[+()\-.\s\d]+$/, "Enter a valid phone number"),
  );

const optionalEmail = z
  .string()
  .trim()
  .max(120)
  .email("Enter a valid email")
  .optional()
  .or(z.literal("").transform(() => undefined));

const multiline = (min: number, max: number, msg: string) =>
  z
    .string()
    .transform((s) => stripControl(s).replace(/\r\n?/g, "\n").trim())
    .pipe(z.string().min(min, msg).max(max));

/**
 * Kept in sync with DEPARTMENTS in components/site-data.ts. A server-side enum
 * so a request cannot store an arbitrary "department" string.
 */
export const DEPARTMENT_NAMES = [
  "Emergency & Critical Care",
  "Cardiology",
  "Diagnostic Imaging",
  "Surgery & Theatres",
  "Maternity & Child",
  "Laboratory & Pathology",
] as const;

export const appointmentSchema = z
  .object({
    name,
    phone,
    email: optionalEmail,
    department: z.enum(DEPARTMENT_NAMES, {
      errorMap: () => ({ message: "Choose a department" }),
    }),
    note: z
      .string()
      .max(4000)
      .transform((s) => stripControl(s).replace(/\r\n?/g, "\n").trim())
      .pipe(z.string().max(1000))
      .optional(),
    // Honeypot — real users never see or fill this. Handled in the route.
    company: z.string().max(100).optional(),
  })
  .strict();

export const contactSchema = z
  .object({
    name,
    email: z.string().trim().max(120).email("Enter a valid email"),
    subject: z
      .string()
      .max(400)
      .transform((s) => collapseWs(stripControl(s)))
      .pipe(z.string().max(120))
      .optional(),
    body: multiline(5, 2000, "Tell us a little more"),
    company: z.string().max(100).optional(),
  })
  .strict();

export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type ContactInput = z.infer<typeof contactSchema>;

export const APPOINTMENT_STATUSES = ["pending", "confirmed", "cancelled", "completed"] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const statusUpdateSchema = z.object({ status: z.enum(APPOINTMENT_STATUSES) }).strict();

export const loginSchema = z
  .object({ password: z.string().min(1, "Enter the admin password").max(200) })
  .strict();

/* ----------------------------- chat ----------------------------- */

export const chatMessageSchema = z
  .object({
    message: z
      .string()
      .max(8000)
      .transform((s) => stripControl(s).replace(/\r\n?/g, "\n").trim())
      .pipe(z.string().min(1, "Say something").max(2000)),
    reset: z.boolean().optional(),
    company: z.string().max(100).optional(), // honeypot
  })
  .strict();

/** The chatbot builds an appointment row directly (its specialties are broader
 *  than the marketing DEPARTMENT_NAMES enum), so it uses this looser shape. */
export const chatAppointmentSchema = z.object({
  name,
  phone,
  email: optionalEmail,
  department: z
    .string()
    .transform((s) => collapseWs(stripControl(s)))
    .pipe(z.string().min(2).max(80)),
  preferredDate: z.string().max(80).optional(),
  preferredTime: z.string().max(80).optional(),
  reasonForVisit: z.string().max(500).optional(),
  conversationSummary: z.string().max(1000).optional(),
});

/* ------------------- admin: knowledge & directory ------------------- */

const shortText = (max: number) =>
  z
    .string()
    .max(max * 2)
    .transform((s) => collapseWs(stripControl(s)))
    .pipe(z.string().min(1).max(max));

const longText = (max: number) =>
  z
    .string()
    .max(max * 2)
    .transform((s) => stripControl(s).replace(/\r\n?/g, "\n").trim())
    .pipe(z.string().min(1).max(max));

export const KNOWLEDGE_CATEGORIES = [
  "clinic",
  "hours",
  "location",
  "contact",
  "policy",
  "faq",
  "service",
  "insurance",
] as const;

export const knowledgeCreateSchema = z
  .object({
    category: z.enum(KNOWLEDGE_CATEGORIES),
    title: shortText(120),
    content: longText(2000),
    active: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(999).optional(),
  })
  .strict();

export const knowledgeUpdateSchema = knowledgeCreateSchema.partial().strict();

export const specialtyCreateSchema = z
  .object({
    name: shortText(80),
    description: longText(400).optional(),
    keywords: z.string().max(600).transform((s) => stripControl(s).trim()).optional(),
    active: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(999).optional(),
  })
  .strict();

export const specialtyUpdateSchema = specialtyCreateSchema.partial().strict();

export const doctorCreateSchema = z
  .object({
    name: shortText(80),
    title: shortText(120),
    specialty: shortText(80).optional(),
    bio: longText(800).optional(),
    yearsExperience: z.number().int().min(0).max(80).optional(),
    consultationFee: z.string().max(40).transform((s) => stripControl(s).trim()).optional(),
    languages: z.string().max(200).transform((s) => stripControl(s).trim()).optional(),
    active: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(999).optional(),
  })
  .strict();

export const doctorUpdateSchema = doctorCreateSchema.partial().strict();
