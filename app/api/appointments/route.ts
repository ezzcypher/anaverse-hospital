import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { appointmentSchema } from "@/lib/validations";
import { makeReference } from "@/lib/reference";
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

// This route touches the database and per-request headers — never static.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  return handleRoute("appointments", async () => {
    if (!isSameOrigin(req)) {
      return jsonError(403, "Request origin not allowed.");
    }

    const ip = getClientIp(req);
    const limited = rateLimitMany([
      { key: `appt:min:${ip}`, limit: 5, windowMs: 60_000 },
      { key: `appt:hr:${ip}`, limit: 20, windowMs: 60 * 60_000 },
    ]);
    if (!limited.ok) {
      return jsonError(429, "Too many requests. Please wait a moment and try again.", {
        retryAfter: limited.retryAfter,
      });
    }

    const parsed = appointmentSchema.safeParse(await readJson(req));
    if (!parsed.success) {
      return jsonError(422, "Some details need fixing.", {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { company, note, email, ...rest } = parsed.data;

    // Honeypot: a bot filled a field no human can see. Look successful, store nothing.
    if (company && company.trim() !== "") {
      return jsonOk({ ok: true, reference: makeReference() }, 201);
    }

    // Retry a couple of times on the (astronomically unlikely) reference clash.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const created = await prisma.appointment.create({
          data: {
            ...rest,
            email: email ?? null,
            note: note && note !== "" ? note : null,
            reference: makeReference(),
            sourceIpHash: hashIp(ip),
          },
          select: { reference: true },
        });
        return jsonOk({ ok: true, reference: created.reference }, 201);
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002" &&
          attempt < 2
        ) {
          continue;
        }
        throw err;
      }
    }
    return jsonError(500, "Could not save your request. Please try again or call the hospital.");
  });
}

// Any other method: 405 without a body.
export function GET() {
  return jsonError(405, "Method not allowed.");
}
