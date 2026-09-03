interface CallArgs {
  apiKey: string;
  model: string;
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
}

/** Chat Completions with JSON-object response format. Throws on any non-200. */
export async function callOpenAI({ apiKey, model, system, messages }: CallArgs): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 700,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: system }, ...messages],
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`OpenAI ${res.status}`);
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content ?? "";
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}
