interface CallArgs {
  apiKey: string;
  model: string;
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("no JSON in response");
  return JSON.parse(candidate.slice(start, end + 1));
}

/** Messages API. Anthropic has no JSON mode, so the prompt asks for JSON and we
 *  extract the first object from the text. Throws on any non-200. */
export async function callAnthropic({ apiKey, model, system, messages }: CallArgs): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        system,
        max_tokens: 700,
        temperature: 0.4,
        messages,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Anthropic ${res.status}`);
    }
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = data.content?.map((c) => c.text ?? "").join("") ?? "";
    return extractJson(text);
  } finally {
    clearTimeout(timer);
  }
}
