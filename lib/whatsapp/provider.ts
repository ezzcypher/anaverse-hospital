import { whatsappEnv } from "@/lib/env";

/**
 * Actual send. Only reached in PRODUCTION mode (keys present). Server-side only,
 * so it is not subject to the browser CSP. Returns nothing on success and throws
 * a plain Error (no provider payload) on failure.
 */
export async function sendWhatsapp(to: string, body: string): Promise<void> {
  const env = whatsappEnv();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);

  try {
    if (env.provider === "twilio") {
      if (!env.token || !env.twilioAccountSid || !env.twilioFrom) {
        throw new Error("Twilio not configured");
      }
      const params = new URLSearchParams({
        To: `whatsapp:${to}`,
        From: `whatsapp:${env.twilioFrom}`,
        Body: body,
      });
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${env.twilioAccountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            authorization: `Basic ${Buffer.from(`${env.twilioAccountSid}:${env.token}`).toString("base64")}`,
            "content-type": "application/x-www-form-urlencoded",
          },
          body: params,
          signal: controller.signal,
        },
      );
      if (!res.ok) throw new Error(`Twilio ${res.status}`);
      return;
    }

    // Meta WhatsApp Cloud API
    if (!env.token || !env.phoneNumberId) throw new Error("Meta WhatsApp not configured");
    const res = await fetch(`https://graph.facebook.com/v21.0/${env.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Meta ${res.status}`);
  } finally {
    clearTimeout(timer);
  }
}
