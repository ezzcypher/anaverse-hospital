import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { doctorCreateSchema } from "@/lib/validations";
import { uniqueSlug } from "@/lib/slug";
import { invalidateKnowledgeCache } from "@/lib/ai/knowledge";
import { isSameOrigin, jsonError, jsonOk, readJson, handleRoute } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return handleRoute("admin.doctors.list", async () => {
    await requireAdmin();
    const items = await prisma.doctor.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return jsonOk({ items });
  });
}

export async function POST(req: Request) {
  return handleRoute("admin.doctors.create", async () => {
    await requireAdmin();
    if (!isSameOrigin(req)) return jsonError(403, "Request origin not allowed.");

    const parsed = doctorCreateSchema.safeParse(await readJson(req, 8_000));
    if (!parsed.success) {
      return jsonError(422, "Please check the fields.", { fields: parsed.error.flatten().fieldErrors });
    }
    const d = parsed.data;
    const item = await prisma.doctor.create({
      data: {
        slug: uniqueSlug(d.name),
        name: d.name,
        title: d.title,
        specialty: d.specialty ?? null,
        bio: d.bio ?? null,
        yearsExperience: d.yearsExperience ?? null,
        consultationFee: d.consultationFee ?? null,
        languages: d.languages ?? null,
        active: d.active ?? true,
        sortOrder: d.sortOrder ?? 0,
      },
    });
    invalidateKnowledgeCache();
    return jsonOk({ item }, 201);
  });
}
