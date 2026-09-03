import {
  Siren,
  HeartPulse,
  ScanLine,
  Syringe,
  Baby,
  FlaskConical,
  Stethoscope,
  ShieldCheck,
  Sparkles,
  Clock,
  type LucideIcon,
} from "lucide-react";

export const HOSPITAL = {
  name: "Anaverse",
  full: "Anaverse — Hospital & Surgical Centre",
  tagline: "Where the city comes to heal.",
  address: "8 Meridian Quarter, City Centre",
  phone: "+1 (555) 200‑4000",
  emergency: "+1 (555) 200‑4111",
  email: "reception@anaverse.hospital",
  hours: [
    ["Outpatient clinics", "Mon – Fri · 8:00 – 20:00"],
    ["Weekend clinics", "Saturday · 9:00 – 15:00"],
    ["Visiting hours", "Daily · 11:00 – 20:00"],
    ["Emergency & trauma", "Open 24 / 7"],
  ] as const,
};

export const NAV = [
  { label: "Care", href: "#care" },
  { label: "Spaces", href: "#spaces" },
  { label: "Technology", href: "#technology" },
  { label: "Doctors", href: "#doctors" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
];

/* The scroll-locked hero reveals exactly two frames:
   the hospital at dusk → the team that runs it. */
export const REVEAL_IMAGES = ["/hero/building-dusk.jpg", "/hero/team-reveal.jpg"];

export interface Vital {
  value: string;
  label: string;
}

export const VITALS: Vital[] = [
  { value: "18", label: "Specialist consultants" },
  { value: "40k", label: "Patients treated a year" },
  { value: "120", label: "Inpatient rooms" },
  { value: "24/7", label: "Emergency & trauma" },
];

export interface Department {
  icon: LucideIcon;
  title: string;
  copy: string;
}

export const DEPARTMENTS: Department[] = [
  {
    icon: Siren,
    title: "Emergency & Critical Care",
    copy: "Resuscitation bays and a trauma team on site every hour of the year.",
  },
  {
    icon: HeartPulse,
    title: "Cardiology",
    copy: "Cath lab, echo and rhythm management under one roof.",
  },
  {
    icon: ScanLine,
    title: "Diagnostic Imaging",
    copy: "1.5T MRI, 128-slice CT and ultrasound — reported the same day.",
  },
  {
    icon: Syringe,
    title: "Surgery & Theatres",
    copy: "Six laminar-flow theatres, from day-case lists to complex work.",
  },
  {
    icon: Baby,
    title: "Maternity & Child",
    copy: "Midwife-led birthing suites and a level-2 neonatal unit.",
  },
  {
    icon: FlaskConical,
    title: "Laboratory & Pathology",
    copy: "On-site bloods, histology and microbiology — results in hours.",
  },
];

export interface Plate {
  src: string;
  label: string;
}

export const SPACE_TABS = [
  "Operating Theatre",
  "Critical Care",
  "Day Clinic",
  "Assessment Unit",
];

export const SPACE_COPY = [
  "Every bed gets daylight, every corridor a view to the outside, and the noise floor is kept deliberately low.",
  "Between patients a bay is stripped and reset completely — linens changed, surfaces wiped, monitors re-zeroed. Nothing of the last stay is left to see.",
  "One equipment standard across every floor, so moving from imaging to theatre to recovery is a walk down a corridor, not a change of hospital.",
];

export const SPACE_PLATES: {
  portrait: Plate;
  wide: Plate;
  closing: Plate;
} = {
  portrait: { src: "/ambience/theatre.jpg", label: "Operating theatre 3" },
  wide: { src: "/ambience/corridor.jpg", label: "The day-clinic corridor" },
  closing: { src: "/ambience/ward.jpg", label: "The assessment unit" },
};

export interface Tool {
  src: string;
  title: string;
  spec: string;
  price?: string;
}

export const TOOLS: Tool[] = [
  {
    src: "/tools/imaging.jpg",
    title: "MRI & CT Imaging",
    spec: "1.5T wide-bore MRI and 128-slice CT, reported same day.",
    price: "from $420 / scan",
  },
  {
    src: "/tools/theatre-suite.jpg",
    title: "Image-Guided Theatres",
    spec: "Mobile C-arm and laminar airflow in every operating room.",
  },
  {
    src: "/tools/monitoring.jpg",
    title: "Continuous Monitoring",
    spec: "Bedside telemetry to one central station — 1:1 nursing in critical care.",
  },
  {
    src: "/tools/array.jpg",
    title: "Ward-Ready Equipment",
    spec: "Infusion, ventilation and point-of-care kit on a single service log.",
  },
  {
    src: "/tools/instruments.jpg",
    title: "Sterile Services",
    spec: "Every instrument tray autoclaved and barcoded to your procedure.",
  },
];

export interface Doctor {
  name: string;
  role: string;
  years: string;
  focus: string;
  photo: string;
  consult: string;
}

export const DOCTORS: Doctor[] = [
  {
    name: "Dr. Marcus Ellingham",
    role: "Consultant Cardiologist",
    years: "27 years",
    focus: "Interventional & structural heart disease",
    photo: "/doctors/ellingham.jpg",
    consult: "$180",
  },
  {
    name: "Dr. Julian Hale",
    role: "Consultant Anaesthetist",
    years: "16 years",
    focus: "Theatre anaesthesia & pain medicine",
    photo: "/doctors/hale.jpg",
    consult: "$150",
  },
  {
    name: "Dr. Rohan Nasser",
    role: "Consultant Radiologist",
    years: "14 years",
    focus: "Cross-sectional & interventional imaging",
    photo: "/doctors/nasser.jpg",
    consult: "$140",
  },
  {
    name: "Dr. Camille Laurent",
    role: "Consultant Physician",
    years: "19 years",
    focus: "Acute internal medicine & diagnostics",
    photo: "/doctors/laurent.jpg",
    consult: "$160",
  },
  {
    name: "Dr. Ada Okafor",
    role: "Consultant Obstetrician",
    years: "21 years",
    focus: "High-risk pregnancy & fetal medicine",
    photo: "/doctors/okafor.jpg",
    consult: "$170",
  },
];

export interface Benefit {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  price?: string;
  priceNote?: string;
  lines: string[];
  cta: string;
  ctaVariant: "default" | "outline" | "solid";
  featured?: boolean;
}

export const BENEFITS: Benefit[] = [
  {
    icon: Stethoscope,
    eyebrow: "Starting from",
    title: "Health Assessment",
    price: "$290",
    priceNote: "half day",
    lines: [
      "Consultant review with full bloods & ECG",
      "Same-day MRI or CT if it is indicated",
      "Written report and a follow-up call within 48 hours",
    ],
    cta: "Book an assessment",
    ctaVariant: "solid",
    featured: true,
  },
  {
    icon: ShieldCheck,
    eyebrow: "Why Anaverse",
    title: "The Anaverse Standard",
    lines: [
      "The same consultant from clinic to discharge",
      "Itemised, fixed quotes before anything begins",
      "Theatre slots held for urgent cases every day",
      "One medical record, shared across every department",
    ],
    cta: "Meet the doctors",
    ctaVariant: "outline",
  },
  {
    icon: Sparkles,
    eyebrow: "Not sure yet",
    title: "Second Opinion",
    lines: [
      "Send your scans and notes ahead. A consultant reviews everything and meets you — in person or by video — within five working days.",
    ],
    cta: "Request a review",
    ctaVariant: "outline",
  },
  {
    icon: Clock,
    eyebrow: "Same-day",
    title: "Emergency & Trauma",
    price: "24/7",
    priceNote: "walk-in",
    lines: [
      "The resus bay is staffed and open every hour of the year. No appointment and no referral needed.",
    ],
    cta: "Emergency info",
    ctaVariant: "outline",
  },
];

export const A_LA_CARTE: { item: string; price: string }[] = [
  { item: "Consultant clinic appointment", price: "from $140" },
  { item: "MRI or CT scan (single region)", price: "from $420" },
  { item: "Full health screen — bloods, ECG, imaging", price: "from $290" },
  { item: "Day-case surgery (all-in)", price: "from $2,400" },
  { item: "Private inpatient room, per night", price: "from $680" },
  { item: "Maternity package — birth + 2 nights", price: "from $6,900" },
];
