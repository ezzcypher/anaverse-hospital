# Anaverse — Hospital & Surgical Centre

A single-page luxury hospital website **plus a small secure backend** with an
**AI virtual receptionist**. Next.js (App Router) · TypeScript · Tailwind CSS ·
shadcn/ui structure · Prisma + PostgreSQL.

**Deploy to a public URL:** see **[DEPLOY.md](DEPLOY.md)** (Vercel + free Neon
Postgres, ~15 min).

```bash
cp .env.example .env
# DATABASE_URL  -> a Postgres string (free from https://neon.tech; same URL works locally)
npm run admin:hash -- 'a-strong-admin-password'   # paste the scrypt line into .env
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # -> AUTH_SECRET
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"   # -> IP_HASH_SALT

npm install
npm run db:push          # creates the tables in your Postgres
npm run db:seed          # loads the starter knowledge base (specialties, doctors, FAQ)
npm run build && npm start   # http://localhost:3000  ·  admin at /admin
# (npm run dev also works; on Windows it can die on hot-reload — just re-run it)
```

A `.env` with **development** secrets is present but `DATABASE_URL` is a
placeholder — set a real Postgres URL. Regenerate every secret and set a real
admin password before deploying — see [DEPLOY.md](DEPLOY.md) and [SECURITY.md](SECURITY.md).

## The scroll-locked hero

The brief was to integrate `scroll-locked-video-hero.tsx` into a shadcn-style project.

| File | Role |
| --- | --- |
| `components/ui/scroll-locked-video-hero.tsx` | The component **exactly as supplied** — a locked scroll-scrub **video** hero. Kept intact so it can be dropped into any page with a `videoSrc`. |
| `components/ui/demo.tsx` | The supplied demo (`<MetroHero />`). |
| `components/ui/scroll-reveal-hero.tsx` | **What the homepage actually uses.** Same mechanism (body `position:fixed` scroll-lock, wheel/touch/key input drives a normalised `progress` forward *and* back, rAF lerp, progress bar, blur-focus title → tagline payoff) adapted to cross-dissolve a **still-image sequence** with a Ken-Burns push — so the hero runs offline on the local photos (`/hero/building-dusk.jpg` → `/hero/team-reveal.jpg`) instead of a hosted MP4. Adds `prefers-reduced-motion` handling, keyboard control and a visible **Skip intro** button. |

### Why `components/ui/`

`components.json` points shadcn's generator at `components/ui` (alias `@/components/ui`).
Keeping every primitive there means:

- `npx shadcn@latest add <component>` drops files in a predictable place and never
  collides with app-level components in `components/`;
- imports stay stable (`@/components/ui/button`), so generated and hand-written
  primitives are interchangeable;
- the app layer (`components/*.tsx`) is cleanly separated from the design-system layer.

## Project setup (from scratch)

Already wired here; for reference, an equivalent project is created with:

```bash
npx create-next-app@latest anaverse-hospital --typescript --tailwind --app --eslint
cd anaverse-hospital
npx shadcn@latest init          # style: new-york, CSS variables, base color: slate
npx shadcn@latest add button dialog input textarea
npm i lucide-react class-variance-authority clsx tailwind-merge tailwindcss-animate
```

## Backend

| Endpoint | Auth | Purpose |
| --- | --- | --- |
| `POST /api/appointments` | public | Appointment request → `Appointment` row, returns a reference code |
| `POST /api/contact` | public | Contact message → `ContactMessage` row |
| `GET  /api/health` | public | `{"ok":true}` — nothing else |
| `POST /api/admin/login` · `/logout` | password | Opaque 8-hour server session in a `__Host-` cookie |
| `GET  /api/admin/appointments` · `/messages` | session | Paginated, field-filtered lists |
| `PATCH/DELETE /api/admin/appointments/[id]` | session | Triage status / delete (data-deletion) |
| `DELETE /api/admin/messages/[id]` | session | Delete a message |

Every public POST is rate-limited (5/min + hourly cap per IP), origin-checked,
size-capped (16 KB), zod-validated with `.strict()`, and carries a honeypot.
Client IPs are SHA-256-hashed before they touch the database; raw IPs are never
stored or logged. The operator UI lives at `/admin` (login at `/admin/login`).

Full checklist walkthrough (Gitleaks / Bearer / ECC / Trail of Bits): **[SECURITY.md](SECURITY.md)**.

## AI Virtual Receptionist

A floating chat widget (bottom-right of the homepage only — nothing else on the
site changed) backed by `POST /api/chat`. It behaves like a friendly clinic
receptionist: answers questions from the knowledge base, helps a visitor find the
right specialty, runs a natural appointment-booking flow, captures leads, and
**remembers everything said earlier in the conversation** (name, phone, doctor /
specialty, preferred date & time, reason) so it never re-asks.

### Demo mode vs production mode

| Channel | DEMO (default, no config) | LIVE / PRODUCTION (set env vars) |
| --- | --- | --- |
| **AI** | Rule-based mock receptionist — full booking flow, triage, FAQ, safety. No API calls, no cost. | `OPENAI_API_KEY` **or** `ANTHROPIC_API_KEY` → that model answers, with automatic fall-back to the mock on any error/timeout. |
| **WhatsApp** | Every message is rendered and stored with status `simulated`, visible only in the admin **WhatsApp Outbox** tab. | `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` (Meta Cloud API) or Twilio vars → messages are actually sent; status becomes `sent` / `failed`. |

The current mode is shown as a badge in the chat header and on the admin
dashboard. Switching is just adding keys to `.env` — no code change. See
`.env.example` for every variable.

### How a booking happens

1. Visitor chats. The receptionist collects **name, phone, doctor/specialty,
   date, time** one question at a time.
2. It shows a summary and asks *"Would you like me to submit this request?"* —
   nothing is submitted until the visitor confirms.
3. On confirm: an `Appointment` row is created (`source = "chatbot"`, status
   `pending`, with the conversation summary) and a structured
   **`NEW APPOINTMENT REQUEST`** WhatsApp message is queued to the administrator.
4. In the admin dashboard, setting that appointment to **Confirmed** automatically
   prepares the patient **Appointment Confirmation** WhatsApp message.
5. `reminder` and `follow-up` templates exist too (`lib/whatsapp/templates.ts`)
   and can be wired to a scheduler.

### Medical safety

The receptionist never diagnoses, prescribes, gives dosages, or claims to replace
a doctor. Symptom messages get a specialty suggestion framed as guidance. A
keyword safety-net (`lib/ai/emergency.ts`) runs on **every** message in **every**
mode — anything that reads as an emergency (chest pain, trouble breathing, stroke
signs, severe bleeding, self-harm…) short-circuits to *"call your local emergency
number / go to the nearest ED / Anaverse Emergency"* and does not triage or book.

### Editable knowledge base

`npm run db:seed` loads starter **specialties** (with triage keywords),
**doctors**, and **FAQ / policy / info** items. Everything is editable in the
admin dashboard (**Knowledge Base** and **Doctors & Specialties** tabs); edits
reach the receptionist within ~20 seconds (`lib/ai/knowledge.ts` cache).

### Admin dashboard (`/admin`)

Tabs: **Appointments** (source, reason, conversation summary, status →
`pending · confirmed · cancelled · completed`, confirm-prepares-WhatsApp) ·
**Leads** (chats that showed intent but didn't book) · **Conversations**
(full transcripts) · **Messages** (contact form) · **WhatsApp Outbox**
(every simulated/sent message, re-send) · **Knowledge Base** · **Doctors &
Specialties**.

## Structure

```
app/
  layout.tsx            Fraunces (display) + Inter (body), metadata
  page.tsx              section composition + <ChatWidget/>
  globals.css           blue design tokens (#90CAF9 / #BBDEFB washes, #1667E6 primary, navy ink)
  admin/                operator login + tabbed dashboard (noindex, session-gated)
  api/
    chat/               the receptionist endpoint (GET = greeting/mode, POST = a turn)
    appointments/ contact/ health/
    admin/              appointments · messages · leads · conversations · whatsapp
                        · knowledge · doctors · specialties
components/
  chat/chat-widget.tsx  the floating receptionist (client, mounted only on page.tsx)
  site-data.ts          marketing copy — unchanged
  appointment-dialog.tsx / contact-form.tsx   forms wired to the API (fetch)
  … (site-header, statement, departments, ambience, technology, doctors, pricing, contact, footer)
  ui/                  button, dialog, input, textarea, the two heroes, demo
lib/
  env.ts                validated server config (only reader of process.env; AI/WhatsApp keys too)
  config.ts             resolves AI_MODE / WHATSAPP_MODE from env-var presence
  clinic.ts             static clinic constants (name, address, phone, hours)
  chat-session.ts       av_chat cookie ↔ ChatSession
  ai/                   emergency · knowledge · prompt · mock · openai · anthropic · receptionist
  whatsapp/             templates · provider · index (queue / notify / prepare*)
  prisma auth password http rate-limit validations errors reference slug admin-select
middleware.ts           noindex/no-store for /api + /admin, cookie pre-check
prisma/
  schema.prisma         Appointment · ContactMessage · AdminSession · ChatSession · ChatMessage
                        · KnowledgeItem · Specialty · Doctor · WhatsappMessage
  seed.mjs              starter knowledge base (npm run db:seed)
public/
  hero/ ambience/ doctors/ tools/ footer/   local imagery
```

## Notes

- **Doctors** section: portraits carry an always-visible years-of-experience badge;
  the focus area, clinic fee and a booking link reveal on hover / keyboard focus.
  Mismatched studio backdrops are unified with a blue wash + greyscale→colour treatment.
- **Pricing**: a mixed four-card benefits row (one featured) plus an à-la-carte list —
  every consultant also carries their own clinic fee on their card.
- **Booking dialog / contact form** post to the API, surface field-level and
  rate-limit errors, and show the returned reference code on success.
- All imagery is illustrative. Anaverse is a fictional hospital.
