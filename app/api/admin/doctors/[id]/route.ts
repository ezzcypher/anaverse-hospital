import { Prisma } from "@prisma/client";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { doctorUpdateSchema } from "@/lib/validations";
import { invalidateKnowledgeCache } from "@/lib/ai/knowledge";
import { isSameOrigin, jsonError, jsonOk, readJson, handleRoute } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ID = /^[a-z0-9]{20,40}$/i;
type Ctx = { params: Promise<{ id: string }> };
const NULLABLE = ["specialty", "bio", "yearsExperience", "consultationFee", "languages"];

export async function PATCH(req: Request, { params }: Ctx) {
  return handleRoute("admin.doctors.update", async () => {
    await requireAdmin();
    if (!isSameOrigin(req)) return jsonError(403, "Request origin not allowed.");
    const { id } = await params;
    if (!ID.test(id)) return jsonError(404, "Not found.");

    const parsed = doctorUpdateSchema.safeParse(await readJson(req, 8_000));
    if (!parsed.success) {
      return jsonError(422, "Please check the fields.", { fields: parsed.error.flatten().fieldErrors });
    }
    const data = { ...parsed.data } as Record<string, unknown>;
    for (const k of NULLABLE) if (k in data && data[k] === undefined) data[k] = null;
    try {
      const item = await prisma.doctor.update({ where: { id }, data });
      invalidateKnowledgeCache();
      return jsonOk({ item });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        return jsonError(404, "Not found.");
      }
      throw err;
    }
  });
}

export async function DELETE(req: Request, { params }: Ctx) {
  return handleRoute("admin.doctors.delete", async () => {
    await requireAdmin();
    if (!isSameOrigin(req)) return jsonError(403, "Request origin not allowed.");
    const { id } = await params;
    if (!ID.test(id)) return jsonError(404, "Not found.");
    try {
      await prisma.doctor.delete({ where: { id } });
      invalidateKnowledgeCache();
      return jsonOk({ ok: true });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        return jsonError(404, "Not found.");
      }
      throw err;
    }
  });
}
