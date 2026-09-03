import { aiEnv, whatsappEnv } from "@/lib/env";

/**
 * Runtime mode resolution. DEMO is the default and needs no configuration:
 *   - AI  : mock rule-based receptionist
 *   - WhatsApp : messages are stored and shown in the admin "Outbox" only
 *
 * Provide the relevant environment variables to switch a channel to LIVE /
 * PRODUCTION independently. See .env.example and README.
 */

export type AiMode = "demo" | "live";
export type WhatsappMode = "demo" | "production";

export interface AiRuntime {
  mode: AiMode;
  provider: "openai" | "anthropic" | null;
  model: string;
}

export function aiRuntime(): AiRuntime {
  const { provider, apiKey, model } = aiEnv();
  if (!provider || !apiKey) return { mode: "demo", provider: null, model: "mock" };
  return {
    mode: "live",
    provider,
    model: model ?? (provider === "anthropic" ? "claude-3-5-haiku-latest" : "gpt-4o-mini"),
  };
}

export interface WhatsappRuntime {
  mode: WhatsappMode;
  provider: "meta" | "twilio";
  adminNumber: string | null;
}

export function whatsappRuntime(): WhatsappRuntime {
  const env = whatsappEnv();
  const configured =
    env.provider === "twilio"
      ? Boolean(env.token && env.twilioAccountSid && env.twilioFrom)
      : Boolean(env.token && env.phoneNumberId);
  return {
    mode: configured ? "production" : "demo",
    provider: env.provider,
    adminNumber: env.adminNumber,
  };
}

/** Small, safe-to-expose summary for the chat widget / admin badge. */
export function publicRuntimeInfo() {
  return {
    aiMode: aiRuntime().mode,
    whatsappMode: whatsappRuntime().mode,
  };
}
