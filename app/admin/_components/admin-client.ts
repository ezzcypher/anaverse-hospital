"use client";

/** Small helper for admin mutations: same-origin JSON fetch with a friendly
 *  error string. All admin write routes check the session and the Origin. */
export async function adminFetch(
  url: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; data: any; error?: string }> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data,
        error: data?.error ?? `Request failed (${res.status}).`,
      };
    }
    return { ok: true, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null, error: "Network problem — please retry." };
  }
}

export function fmtDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
