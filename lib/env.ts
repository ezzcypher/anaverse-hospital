/**
 * Central, validated access to server-side configuration.
 *
 * SERVER ONLY. Import this only from route handlers, middleware helpers, and
 * server components — never from a "use client" module. It reads secrets from
 * process.env, which is not available in the browser bundle anyway.
 *
 * Every secret the backend needs is read here and nowhere else. Values are
 * validated on first use and the result is cached; if anything required is
 * missing or malformed the process throws a single, explicit error listing
 * every problem — so a misconfigured deployment fails immediately and loudly
 * instead of limping along with auth or the database silently broken.
 *
 * Nothing in this file is a literal secret — only the *names* of variables and
 * their shape rules live here.
 */

interface ServerEnv {
  DATABASE_URL: string;
  AUTH_SECRET: string;
  IP_HASH_SALT: string;
  ADMIN_PASSWORD_HASH: string;
  /** Comma-separated extra origins allowed to call mutating API routes. */
  ALLOWED_ORIGINS: string[];
  NODE_ENV: "development" | "test" | "production";
}

let cached: ServerEnv | null = null;

function fail(problems: string[]): never {
  throw new Error(
    `Invalid server configuration — the app cannot start:\n` +
      problems.map((p) => `  • ${p}`).join("\n") +
      `\n\nCopy .env.example to .env and fill in the values ` +
      `(see the "Backend setup" section of README.md).`,
  );
}

export function serverEnv(): ServerEnv {
  if (cached) return cached;

  const problems: string[] = [];
  const {
    DATABASE_URL,
    AUTH_SECRET,
    IP_HASH_SALT,
    ADMIN_PASSWORD_HASH,
    ALLOWED_ORIGINS,
    NODE_ENV,
  } = process.env;

  if (!DATABASE_URL || DATABASE_URL.trim() === "") {
    problems.push("DATABASE_URL is required (e.g. file:./dev.db)");
  }
  if (!AUTH_SECRET || AUTH_SECRET.length < 32) {
    problems.push(
      "AUTH_SECRET is required and must be at least 32 characters " +
        "(generate: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\")",
    );
  }
  if (!IP_HASH_SALT || IP_HASH_SALT.length < 16) {
    problems.push("IP_HASH_SALT is required and must be at least 16 characters");
  }
  if (!ADMIN_PASSWORD_HASH || !/^scrypt:\d+:[a-f0-9]+:[a-f0-9]+$/i.test(ADMIN_PASSWORD_HASH)) {
    problems.push(
      "ADMIN_PASSWORD_HASH is required and must be a scrypt hash " +
        "(generate: npm run admin:hash -- 'your-admin-password')",
    );
  }

  if (problems.length) fail(problems);

  cached = {
    DATABASE_URL: DATABASE_URL!,
    AUTH_SECRET: AUTH_SECRET!,
    IP_HASH_SALT: IP_HASH_SALT!,
    ADMIN_PASSWORD_HASH: ADMIN_PASSWORD_HASH!,
    ALLOWED_ORIGINS: (ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    NODE_ENV: (NODE_ENV as ServerEnv["NODE_ENV"]) ?? "development",
  };
  return cached;
}

export const isProd = () => process.env.NODE_ENV === "production";

/* ------------------------------------------------------------------ *
 * OPTIONAL integrations — the AI receptionist and WhatsApp.
 *
 * These are never required: if a key is absent the app runs in DEMO mode
 * (mock AI answers, simulated WhatsApp). They are read here so that
 * lib/env.ts stays the single place that touches process.env for config,
 * and so keys never leak into a client bundle.
 * ------------------------------------------------------------------ */

export interface AiEnv {
  provider: "openai" | "anthropic" | null;
  apiKey: string | null;
  model: string | null;
}

export function aiEnv(): AiEnv {
  const explicit = (process.env.AI_PROVIDER ?? "").trim().toLowerCase();
  const openai = process.env.OPENAI_API_KEY?.trim() || null;
  const anthropic = process.env.ANTHROPIC_API_KEY?.trim() || null;
  const model = process.env.AI_MODEL?.trim() || null;

  if (explicit === "openai" && openai) return { provider: "openai", apiKey: openai, model };
  if (explicit === "anthropic" && anthropic)
    return { provider: "anthropic", apiKey: anthropic, model };
  if (!explicit && openai) return { provider: "openai", apiKey: openai, model };
  if (!explicit && anthropic) return { provider: "anthropic", apiKey: anthropic, model };
  return { provider: null, apiKey: null, model };
}

export interface WhatsappEnv {
  provider: "meta" | "twilio";
  token: string | null;
  phoneNumberId: string | null;
  adminNumber: string | null;
  twilioAccountSid: string | null;
  twilioFrom: string | null;
}

export function whatsappEnv(): WhatsappEnv {
  return {
    provider: (process.env.WHATSAPP_PROVIDER ?? "meta").trim().toLowerCase() === "twilio"
      ? "twilio"
      : "meta",
    token: process.env.WHATSAPP_TOKEN?.trim() || null,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || null,
    adminNumber: process.env.WHATSAPP_ADMIN_NUMBER?.trim() || null,
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID?.trim() || null,
    twilioFrom: process.env.WHATSAPP_FROM?.trim() || null,
  };
}
