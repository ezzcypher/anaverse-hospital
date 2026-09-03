/**
 * Static clinic facts used by the receptionist and WhatsApp templates.
 *
 * Plain data, no imports — safe to use in any runtime. Editable clinic content
 * (doctors, specialties, FAQ, policies) lives in the database and is managed
 * from the admin dashboard; this file is only the handful of constants that
 * also appear in the marketing site and never change at runtime.
 */
export const CLINIC = {
  name: "Anaverse",
  legalName: "Anaverse — Hospital & Surgical Centre",
  address: "8 Meridian Quarter, City Centre",
  reception: "+1 (555) 200-4000",
  emergency: "+1 (555) 200-4111",
  email: "reception@anaverse.hospital",
  website: "anaverse.hospital",
  hours: [
    ["Outpatient clinics", "Monday to Friday, 8:00 – 20:00"],
    ["Weekend clinics", "Saturday, 9:00 – 15:00"],
    ["Visiting hours", "Every day, 11:00 – 20:00"],
    ["Emergency & trauma", "Open 24 hours, every day"],
  ] as const,
} as const;
