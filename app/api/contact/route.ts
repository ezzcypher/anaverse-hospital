import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/validations";
import { rateLimitMany } from "@/lib/rate-limit";
import {
  getClientIp,
  hashIp,
  isSameOrigin,
  jsonError,
  jsonOk,
  readJson,
  handleRoute,
} from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  return handleRoute("contact", async () => {
    if (!isSameOrigin(req)) {
      return jsonError(403, "Request origin not allowed.");
    }

    const ip = getClientIp(req);
    const limited = rateLimitMany([
      { key: `msg:min:${ip}`, limit: 5, windowMs: 60_000 },
      { key: `msg:hr:${ip}`, limit: 15, windowMs: 60 * 60_000 },
    ]);
    if (!limited.ok) {
      return jsonError(429, "Too many messages. Please wait a moment and try again.", {
        retryAfter: limited.retryAfter,
      });
    }

    const parsed = contactSchema.safeParse(await readJson(req));
    if (!parsed.success) {
      return jsonError(422, "Some details need fixing.", {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { company, subject, ...rest } = parsed.data;
    if (company && company.trim() !== "") {
      return jsonOk({ ok: true }, 201);
    }

    await prisma.contactMessage.create({
      data: {
        ...rest,
        subject: subject && subject !== "" ? subject : null,
        sourceIpHash: hashIp(ip),
      },
      select: { id: true },
    });

    return jsonOk({ ok: true }, 201);
  });
}

export function GET() {
  return jsonError(405, "Method not allowed.");
}
