# Security review — Anaverse Hospital

This backend was built to the checklist in *"5 Security Checks Before You Launch
Your App"* (Emergent Prompts v1.1). Below is every check, its status, and what
was done. Where a check targets a feature this app does not have (payments,
Supabase, OAuth, file uploads, user accounts), that is called out as **N/A**.

**Scope of the app:** a single‑page marketing site plus a small backend — two
public form endpoints (appointment request, contact message), a single
password‑protected operator area to read/triage/delete those submissions, and a
health check. PostgreSQL via Prisma (Neon in production). No other third‑party services in demo mode.

---

## 1 · Secret Leak Prevention (Gitleaks)

| Check | Status |
| --- | --- |
| No secret as a string literal anywhere in source | ✅ Pass |
| All secrets in environment variables | ✅ `lib/env.ts` is the only reader of `process.env`; it holds variable *names* and shape rules, never values |
| `NEXT_PUBLIC_` / `REACT_APP_` exposure | ✅ None exist. Nothing sensitive is shipped to the browser bundle (verified by grep) |
| `.env` gitignored + `.env.example` committed | ✅ `.gitignore` has `.env*` with `!.env.example`; `.env.example` lists every var with placeholders and generation commands |
| Logs / responses don't leak secrets | ✅ `logServerError()` logs `name: message` + an 8‑char correlation id only. Prisma `log` is `["error"]` in production (query logging echoes parameter values, i.e. PII — disabled). Login failures are not logged at all |
| Git‑history rotation warning | ✅ See below and README |

**Secrets inventory**

| Variable | Where it lives | Notes |
| --- | --- | --- |
| `AUTH_SECRET` | `.env` → `lib/env.ts` → `lib/auth.ts` | HMACs the session token so tampered/foreign cookies are rejected without a DB hit |
| `IP_HASH_SALT` | `.env` → `lib/env.ts` → `lib/http.ts` | Salts the SHA‑256 of client IPs. Raw IPs are never stored or logged |
| `ADMIN_PASSWORD_HASH` | `.env` → `lib/env.ts` → login route | `scrypt:N:salt:hash`. The plaintext admin password exists nowhere in the system |
| `DATABASE_URL` | `.env` / Vercel env | Postgres connection string (TLS-required) |

**Fixed during the build**

- `ADMIN_PASSWORD_HASH` originally used `$` separators; `@next/env` performs
  dotenv variable‑expansion and silently truncated the value at the first `$`.
  Switched the hash format to colon separators (`scrypt:16384:…:…`) so the value
  survives unescaped. (This was a real "app won't start" failure, now fixed.)

> **Rotation note.** `.env` is gitignored (`.env*` with `!.env.example`) and is
> never uploaded to Vercel — production secrets come only from `vercel env`. The
> local `.env` holds **development** values and a known dev admin password;
> [DEPLOY.md](DEPLOY.md) step 3 generates fresh `AUTH_SECRET` / `IP_HASH_SALT` and
> a real `ADMIN_PASSWORD_HASH` for production. Rotate the Neon DB password if the
> connection string is ever exposed.

---

## 2 · Personal Data Flow Audit (Bearer)

**Data map**

| Entry point | Fields | Travels to | At rest |
| --- | --- | --- | --- |
| `POST /api/appointments` | name, phone, email?, department, note? | zod validation → Prisma | `Appointment` row + `sourceIpHash` (SHA‑256, truncated) |
| `POST /api/contact` | name, email, subject?, body | zod validation → Prisma | `ContactMessage` row + `sourceIpHash` |
| Every request | client IP | `hashIp()` immediately | only the hash, only for abuse triage |

**Nothing is sent to any third party.** There is no analytics, error tracking,
email provider, payment processor or AI API in the codebase. Data path is
browser → same‑origin API → Postgres. Full stop.

| Check | Status |
| --- | --- |
| Logs scrubbed of PII | ✅ No log statement takes a request body, a field value, or an IP |
| Third‑party integrations audited | ✅ There are none |
| Password hashing | ✅ scrypt (listed as acceptable in the guide) for the admin password; session tokens stored only as SHA‑256. No MD5/SHA‑alone, no plaintext |
| Cookie flags | ✅ Session cookie is `HttpOnly; Secure; SameSite=Strict; Path=/` with the `__Host-` prefix. It carries an opaque token — no PII |
| No PII in `localStorage` | ✅ Not used. Form state lives in transient React state only |
| API response field‑filtering | ✅ Admin list/detail routes use explicit `select` allow‑lists — `sourceIpHash` is never returned. Public endpoints return only `{ ok, reference }` |
| Data deletion | ✅ `DELETE /api/admin/appointments/[id]` and `/api/admin/messages/[id]` hard‑delete a record. Sessions self‑expire (8 h) and are swept on each login |

**Verified at runtime:** submitted a record, dumped the DB — `sourceIpHash` is a
32‑hex‑char hash, not an IP; honeypot submissions are not persisted.

---

## 3 · Pre‑Deploy Production Audit (ECC)

| # | Check | Status | Detail |
| --- | --- | --- | --- |
| 1 | Env vars validated, app refuses to start if missing | ✅ | `serverEnv()` aggregates every missing/malformed var into one fatal error. Proven: the build failed until `.env` was correct |
| 2 | Debug code removed | ✅ | No debug `console.log` (grep‑verified). No `/test`, `/debug`, `/seed` routes. No commented‑out blocks, no `TODO/FIXME`. No hardcoded creds in source |
| 3 | Error handling | ✅ | `handleRoute()` returns a generic message + correlation id; the real error is `console.error`‑logged server‑side only. No stack traces, query text, or paths reach the client. Prisma `P2002/P2025` mapped to clean 409‑retry / 404 |
| 4 | Security headers | ✅ | `next.config.mjs` sets CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security` (1 year), `Referrer-Policy`, `Permissions-Policy`, COOP, CORP on every route. Middleware adds `Cache-Control: no-store` + `X-Robots-Tag: noindex` on `/api` and `/admin`. `poweredByHeader: false` |
| 5 | Rate limiting on auth endpoints | ✅ | Login: **5 / min** + 20 / hour per IP. Appointments: 5 / min + 20 / h. Contact: 5 / min + 15 / h. `Retry-After` returned on 429. Password reset: N/A (no reset flow — single operator, rotate via env) |
| 6 | CORS not `*` | ✅ | No CORS headers are emitted at all, so browsers apply same‑origin policy. Every mutating route additionally enforces `isSameOrigin()` (Origin/Referer host must match) |
| 7 | Database security | ✅ | Managed Postgres (Neon) over TLS (`sslmode=require`); credentials only in `.env` / Vercel env, never in source. No DB port exposed by the app |

**Verified at runtime:** headers present on `/` and `/api/*`; 6 rapid POSTs → one
`201` then `429`s; `/api/health` returns exactly `{"ok":true}` (no version, no
uptime, no host info).

---

## 4 · Deep Security Audit — custom auth + form logic (Trail of Bits)

*This app has custom password auth and public form endpoints. No payments, no
smart contracts.*

### Authentication & authorization

| Check | Status | Detail |
| --- | --- | --- |
| Every protected route has auth | ✅ | All `/api/admin/*` data routes call `requireAdmin()` (throws 401). `/admin` pages call `getAdminSession()` → `redirect('/admin/login')`. Edge middleware pre‑filters `/admin` on cookie presence |
| No IDOR | ✅ | There is exactly one principal — the operator — and it is authorized to see every record. No per‑user ownership model exists, so there is no "other user's data" to reach. `[id]` routes still validate the id shape and return an indistinguishable `404` on miss |
| Password reset tokens | N/A | No reset flow. The single operator password is rotated by regenerating `ADMIN_PASSWORD_HASH` |
| JWT handling | ✅ (not used) | Sessions are opaque server‑side records, not JWTs. Token = 32 random bytes, base64url; cookie = `token.HMAC(token, AUTH_SECRET)`; DB stores only `sha256(token)`. **8‑hour absolute expiry.** Logout **deletes the row** — real revocation, not just a cookie clear |

### Payment logic — **N/A** (no payments anywhere in the codebase).

### Input handling

| Check | Status | Detail |
| --- | --- | --- |
| SQL injection | ✅ | 100% Prisma. No raw SQL, no string‑built queries anywhere |
| XSS | ✅ | No `dangerouslySetInnerHTML` in the codebase. All user data renders through React (auto‑escaped) or as JSON. **Verified:** a stored `<script>alert(1)</script>` / `<img onerror>` renders as inert escaped text in the admin table. CSP is defence‑in‑depth |
| Mass assignment | ✅ | Every schema is zod `.strict()` (unknown keys rejected). Routes destructure explicit fields into Prisma `data`; `status` changes go through a separate strict enum schema |
| Body size | ✅ | `readJson()` rejects bodies over 16 KB (both `Content-Length` and actual length) |
| Field constraints | ✅ | Name 2–80, phone 6–32 + charset regex, email ≤120 + format, note ≤1000, message ≤2000, department is a fixed enum. Control characters stripped, whitespace collapsed |
| File uploads | N/A | None |

---

## 5 · Attacker's Perspective Review (ECC)

| Attack path | Result |
| --- | --- |
| **1. ID manipulation** | No multi‑tenant data. `[id]` params are shape‑validated; misses return a uniform `404`. Appointment *references* (`AV‑XXXXXX`) are random from an unambiguous alphabet — not sequential, nothing to enumerate |
| **2. Login bypass** | No admin route skips `requireAdmin()`. Absent / malformed / HMAC‑failing / expired / logged‑out cookie → `401`. No default account: the app won't start without `ADMIN_PASSWORD_HASH`. Login is generic ("Incorrect password.") — never reveals which field failed |
| **3. Privilege escalation** | One role, one capability set. Nothing in the session encodes a role/level, so there's nothing to tamper with. Authorization is server‑side (`requireAdmin`), never UI‑only |
| **4. Feature abuse** | Signup: N/A. Messaging/appointments: 5/min + hourly caps per IP, plus a hidden honeypot field on both forms (a filled honeypot returns a fake success and stores nothing). Uploads / promo / referral: N/A |
| **5. Content injection** | JS in any field → escaped on render (verified). SQLi → Prisma‑parameterized. `.strict()` schemas drop extra fields |
| **6. Internal exposure** | No DB admin panel. Errors are generic + correlation‑id only. `.env` and dotfiles are never served (outside `public/`). Not a git repo — no `.git/` to expose. No Swagger/OpenAPI. `/api/health` = `{"ok":true}` and nothing else. `X-Robots-Tag: noindex` + `no-store` on `/api` and `/admin`. `poweredByHeader: false` |
| **7. Business‑logic manipulation** | No payments, trials, discounts or referrals to abuse. Admin status transitions are unrestricted **by design** — the operator is trusted |

---

## Addendum — AI Virtual Receptionist (chat, AI keys, WhatsApp)

Added after the original review. The five checks above were re‑run against the new
surface; results below.

### Secrets (check 1)

| Item | Status |
| --- | --- |
| AI + WhatsApp keys | ✅ Read only in `lib/env.ts` (`aiEnv()` / `whatsappEnv()`), never with a `NEXT_PUBLIC_` prefix, never sent to the browser. `GET /api/chat` returns only `{mode, greeting, suggestions, disclaimer}` — grep‑verified for secret‑shaped strings |
| All optional | ✅ Absent keys ⇒ demo mode; the app still starts. `serverEnv()`'s required list is unchanged |
| Provider errors | ✅ Logged as `[ai] live provider failed … <ErrorName>` only — no key, no request body, no patient text |

### Personal data (check 2)

| Item | Status |
| --- | --- |
| What the chat stores | `ChatSession` (name, phone, email, specialty, date/time, reason, running summary) + `ChatMessage` transcript + `sourceIpHash`. All admin‑only, all behind `requireAdmin()` |
| Third parties | Only the AI provider **in live mode** receives message text + the knowledge base (needed to answer). In demo mode nothing leaves the server. WhatsApp provider **in production mode** receives the rendered message + recipient number. Both documented; both off by default |
| Logs | No chat message, collected field, or phone number is ever logged |
| Cookie | `av_chat` = opaque 36‑hex id, `HttpOnly; Secure; SameSite=Lax`, 24h. No PII in it |
| API filtering | Admin list/detail routes use explicit `select` allow‑lists (`lib/admin-select.ts`) — `sourceIpHash` never leaves the server. `GET /api/chat` (public) returns the visitor only their *own* collected details |
| Deletion | `DELETE /api/admin/conversations/[id]` removes a session and cascades its messages. Sessions self‑expire at 24h |

### Pre‑deploy (check 3)

| Item | Status |
| --- | --- |
| Rate limiting | `POST /api/chat`: 15/min + 220/hour per IP, plus a hard 60‑message‑per‑session cap to bound cost/abuse |
| Body size | Chat body capped at 12 KB; message itself ≤ 2000 chars after control‑char stripping |
| CORS / origin | `isSameOrigin()` enforced on `POST /api/chat` and every admin write route (knowledge, doctors, specialties, conversations, whatsapp resend) |
| Error handling | All new routes go through `handleRoute` → generic message + correlation id; provider/network failures fall back to the mock, never a stack trace |
| Debug code | None. No `console.log`, no test route, no seed *endpoint* (`prisma/seed.mjs` is a CLI script, not routable) |
| Prompt injection | The knowledge base is admin‑authored. User messages are passed as chat content, never as instructions; the model returns **data only** (a JSON turn) — there is no tool‑calling, no code execution, no DB write driven by model output except the appointment insert, which is re‑validated server‑side (`chatAppointmentSchema`) and gated on `readyToSubmit && missingForSubmit().length === 0` |

### Deep audit / attacker view (checks 4 & 5)

| Item | Status |
| --- | --- |
| Auth on admin chat data | ✅ `leads`, `conversations`, `whatsapp`, `knowledge`, `doctors`, `specialties` all call `requireAdmin()`; `[id]` params are shape‑validated, misses return a uniform `404` |
| IDOR | Chat sessions are keyed by an unguessable 36‑hex `publicId` in an `HttpOnly` cookie; a visitor can only ever reach their own. Admin (one principal) may read all — no cross‑tenant model exists |
| XSS | Chat messages render through React (`whitespace-pre-wrap`, auto‑escaped) in both the widget and the admin transcript view. No `dangerouslySetInnerHTML` anywhere. WhatsApp bodies are plain text |
| Booking‑logic abuse | Server recomputes `missingForSubmit()` and re‑validates every field before inserting; a hallucinated `readyToSubmit` from a live model is overridden (`sanitizeTurn`). Honeypot (`company`) on chat too — a filled one returns a bland reply and stores nothing |
| WhatsApp abuse | Recipient numbers are normalised to E.164 and rejected if outside 8–15 digits before any send. Admin “resend” requires a session + same‑origin and only re‑issues an existing stored message |
| Medical safety | Emergency keyword net runs before the model in every mode; the system prompt forbids diagnosis/prescription/dosage and the mock never produces them |

### New residual risks

7. **Live AI cost / prompt‑abuse.** Rate limits + the 60‑msg session cap bound
   it, but a determined abuser on many IPs could still run up provider spend in
   live mode. Add a provider‑side budget alert and consider a CAPTCHA on the
   widget before enabling live mode publicly.
8. **Live mode sends patient text to a third‑party model** (OpenAI/Anthropic).
   That is a data‑processing relationship to disclose in a real privacy notice;
   demo mode has no such flow.
9. **WhatsApp templates** must be pre‑approved in the Meta Business console
   before production sending will succeed; until then production sends return
   `failed` (surfaced in the Outbox with the provider status code).

## Residual risks / deploy checklist

1. **Rotate `.env` secrets** and set a real `ADMIN_PASSWORD_HASH` before any
   non‑local deployment (the committed dev values are known).
2. **Database** is managed Postgres over TLS. Rotate the Neon password if the
   connection string is ever exposed.
3. **Rate limiting is in‑memory / single‑instance.** Behind more than one
   instance, back `lib/rate-limit.ts` with Redis (same interface).
4. **`isSameOrigin` requires an `Origin` or `Referer` header** on POST. Browsers
   send `Origin` on all cross‑origin *and* same‑origin POSTs, but a user behind
   a header‑stripping proxy would see form submissions rejected with `403`. This
   is an intentional CSRF trade‑off; loosen only if it becomes a real problem.
5. **CSP still allows `'unsafe-inline'`** for scripts/styles (Next's inline
   bootstrap + the hero's inline styles). There is no injection sink that
   produces inline script, but a nonce‑based CSP via middleware is the next
   hardening step.
6. **No human penetration test has been done.** As the source guide says: for
   anything handling real patient data at scale, get one.
