import { CLINIC } from "@/lib/clinic";

export type WhatsappTemplate =
  | "admin_notification"
  | "confirmation"
  | "reminder"
  | "followup";

export interface TemplateVars {
  name?: string | null;
  phone?: string | null;
  doctor?: string | null; // doctor OR specialty
  date?: string | null;
  time?: string | null;
  reason?: string | null;
  summary?: string | null;
  reference?: string | null;
}

const dash = (v?: string | null) => (v && v.trim() ? v.trim() : "—");
const doctorOf = (v?: string | null) => (v && v.trim() ? v.trim() : "our team");

/** Structured alert to the clinic administrator when a request is confirmed. */
export function adminNotification(v: TemplateVars): string {
  return [
    "NEW APPOINTMENT REQUEST",
    "",
    `Patient Name: ${dash(v.name)}`,
    `Phone Number: ${dash(v.phone)}`,
    `Doctor/Specialty: ${dash(v.doctor)}`,
    `Preferred Date: ${dash(v.date)}`,
    `Preferred Time: ${dash(v.time)}`,
    `Reason for Visit: ${dash(v.reason)}`,
    `Conversation Summary: ${dash(v.summary)}`,
    v.reference ? `Reference: ${v.reference}` : null,
  ]
    .filter((l) => l !== null)
    .join("\n");
}

export function appointmentConfirmation(v: TemplateVars): string {
  return [
    `Hello ${dash(v.name)},`,
    "",
    `Your appointment with ${doctorOf(v.doctor)} has been confirmed.`,
    "",
    `Date: ${dash(v.date)}`,
    `Time: ${dash(v.time)}`,
    "",
    `Clinic: ${CLINIC.legalName}`,
    "",
    "Please arrive 10 minutes before your appointment.",
  ].join("\n");
}

export function appointmentReminder(v: TemplateVars): string {
  return [
    `Hello ${dash(v.name)},`,
    "",
    `This is a friendly reminder about your upcoming appointment with ${doctorOf(v.doctor)}.`,
    "",
    `Date: ${dash(v.date)}`,
    `Time: ${dash(v.time)}`,
    "",
    `Clinic: ${CLINIC.legalName}`,
    "",
    "If you need to reschedule, please contact us.",
  ].join("\n");
}

export function followUp(v: TemplateVars): string {
  return [
    `Hello ${dash(v.name)},`,
    "",
    `Thank you for visiting ${CLINIC.legalName}. We hope you had a good experience.`,
    "",
    "If you have any questions, please feel free to contact us.",
  ].join("\n");
}

export function renderTemplate(template: WhatsappTemplate, vars: TemplateVars): string {
  switch (template) {
    case "admin_notification":
      return adminNotification(vars);
    case "confirmation":
      return appointmentConfirmation(vars);
    case "reminder":
      return appointmentReminder(vars);
    case "followup":
      return followUp(vars);
  }
}

export const TEMPLATE_LABELS: Record<WhatsappTemplate, string> = {
  admin_notification: "Admin notification",
  confirmation: "Appointment confirmation",
  reminder: "Appointment reminder",
  followup: "Post-visit follow-up",
};
