import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { ChatSession } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "av_chat";
const MAX_AGE_S = 24 * 60 * 60;

function newPublicId(): string {
  return randomBytes(18).toString("hex"); // 36 chars, opaque
}

export async function setChatCookie(publicId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, publicId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_S,
  });
}

export async function clearChatCookie(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
}

/**
 * Resolve the current chat session from the `av_chat` cookie, or start a new
 * one. Sessions older than 24h, closed sessions, and `reset` all start fresh.
 */
export async function getOrCreateChatSession(opts: {
  reset: boolean;
  ipHash: string | null;
}): Promise<{ session: ChatSession; isNew: boolean }> {
  const store = await cookies();
  const publicId = store.get(COOKIE_NAME)?.value;

  if (!opts.reset && publicId && /^[a-f0-9]{24,48}$/.test(publicId)) {
    const existing = await prisma.chatSession.findUnique({ where: { publicId } });
    if (
      existing &&
      existing.status !== "closed" &&
      Date.now() - existing.createdAt.getTime() < MAX_AGE_S * 1000
    ) {
      return { session: existing, isNew: false };
    }
  }

  const session = await prisma.chatSession.create({
    data: { publicId: newPublicId(), sourceIpHash: opts.ipHash },
  });
  return { session, isNew: true };
}
