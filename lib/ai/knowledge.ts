import { prisma } from "@/lib/prisma";
import { CLINIC } from "@/lib/clinic";

export interface KnowledgeBundle {
  text: string;
  specialties: { name: string; keywords: string[] }[];
  doctors: { name: string; title: string; specialty: string | null }[];
}

let cache: { at: number; value: KnowledgeBundle } | null = null;
const TTL_MS = 20_000;

/**
 * Assemble the clinic knowledge base the receptionist answers from: the static
 * CLINIC constants plus everything the admin manages in the database
 * (specialties, doctors, FAQ / policy / info items). Cached briefly so a busy
 * chat doesn't hammer the database; admin edits show within ~20s.
 */
export async function buildKnowledge(): Promise<KnowledgeBundle> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;

  const [specialtyRows, doctorRows, items] = await Promise.all([
    prisma.specialty.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.doctor.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.knowledgeItem.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    }),
  ]);

  const lines: string[] = [];
  lines.push("## CLINIC");
  lines.push(CLINIC.legalName);
  lines.push(`Address: ${CLINIC.address}`);
  lines.push(
    `Reception: ${CLINIC.reception} · Emergency & trauma: ${CLINIC.emergency} · Email: ${CLINIC.email}`,
  );
  lines.push("Hours:");
  for (const [k, v] of CLINIC.hours) lines.push(`- ${k}: ${v}`);

  if (specialtyRows.length) {
    lines.push("", "## SPECIALTIES (what each one treats)");
    for (const s of specialtyRows) {
      lines.push(`- ${s.name}${s.description ? ` — ${s.description}` : ""}`);
    }
  }

  if (doctorRows.length) {
    lines.push("", "## DOCTORS");
    for (const d of doctorRows) {
      const bits = [d.title];
      if (d.specialty) bits.push(`${d.specialty}`);
      if (d.yearsExperience) bits.push(`${d.yearsExperience} years`);
      if (d.consultationFee) bits.push(`consultation ${d.consultationFee}`);
      lines.push(`- ${d.name} — ${bits.join(", ")}`);
    }
  }

  if (items.length) {
    lines.push("", "## CLINIC KNOWLEDGE");
    for (const it of items) {
      lines.push(`[${it.category}] ${it.title}: ${it.content}`);
    }
  }

  const value: KnowledgeBundle = {
    text: lines.join("\n"),
    specialties: specialtyRows.map((s) => ({
      name: s.name,
      keywords: (s.keywords ?? "")
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean),
    })),
    doctors: doctorRows.map((d) => ({
      name: d.name,
      title: d.title,
      specialty: d.specialty,
    })),
  };

  cache = { at: Date.now(), value };
  return value;
}

export function invalidateKnowledgeCache() {
  cache = null;
}
