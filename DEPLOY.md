# Deploy to Vercel — public URL

Result: a permanent `https://<project>.vercel.app` anyone can open. ~15 minutes.
Everything free (Neon free tier + Vercel Hobby).

The app was converted from SQLite to **PostgreSQL** for this (Vercel's filesystem
is ephemeral). Nothing else changed.

---

## 1 · Create the database (Neon)

1. Sign up at <https://neon.tech> → **New Project** (any name, any region).
2. On the dashboard, the **Connection string** box has a **"Pooled connection"** toggle:
   - toggle **ON**  → copy → this is `DATABASE_URL` (host has `-pooler`)
   - toggle **OFF** → copy → this is `DIRECT_URL` (host has no `-pooler`)

## 2 · Point the app at it and load the schema (run locally)

```bash
cd D:\anaverse-hospital

# in .env, set both lines:
#   DATABASE_URL="postgresql://...-pooler....neon.tech/neondb?sslmode=require"
#   DIRECT_URL="postgresql://...(no -pooler)....neon.tech/neondb?sslmode=require"

npm run db:push      # creates all tables in Neon (uses DIRECT_URL)
npm run db:seed      # loads specialties, doctors, FAQ
npm run build        # sanity check — must end "Compiled successfully"
```

## 3 · Generate the production secrets

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # → AUTH_SECRET
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"   # → IP_HASH_SALT
npm run admin:hash -- 'a-strong-admin-password'                            # → ADMIN_PASSWORD_HASH
```

Keep these four values handy:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Neon **pooled** string (step 1) |
| `DIRECT_URL` | Neon **direct** string (step 1) |
| `AUTH_SECRET` | the 96-char hex from above |
| `IP_HASH_SALT` | the 48-char hex from above |
| `ADMIN_PASSWORD_HASH` | the `scrypt:...` line from `admin:hash` (paste only the value after `=`) |

## 4 · Deploy

```bash
npx vercel login          # opens the browser, use your email

npx vercel                # first run: creates the project + a preview build
                          #   "Set up and deploy?" → yes
                          #   "Which directory?" → ./
                          #   framework detected: Next.js → accept defaults
                          # (the preview URL's API will error until step 4b — that's expected)

# 4b · add the environment variables (paste each value; pick "Production")
npx vercel env add DATABASE_URL production
npx vercel env add DIRECT_URL production
npx vercel env add AUTH_SECRET production
npx vercel env add IP_HASH_SALT production
npx vercel env add ADMIN_PASSWORD_HASH production

# optional — the AI receptionist stays in demo mode without these
npx vercel env add OPENAI_API_KEY production        # or ANTHROPIC_API_KEY
npx vercel env add WHATSAPP_TOKEN production        # + WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ADMIN_NUMBER

npx vercel --prod         # builds with the env vars → prints the public URL
```

Your link is the printed **Production** URL, e.g.
`https://anaverse-hospital.vercel.app`.

## 5 · Verify

- Open the URL → homepage loads, chat launcher bottom-right, chat replies.
- `‹URL›/admin` → sign in with the password you hashed in step 3.
- Submit an appointment via chat → it appears in the admin **Appointments** tab and
  a `NEW APPOINTMENT REQUEST` shows in **WhatsApp Outbox** (simulated).

---

## Notes

- **Prefer GitHub auto-deploy?** `git` is already initialised here. Create an empty
  GitHub repo, then:
  ```bash
  git remote add origin https://github.com/<you>/anaverse-hospital.git
  git push -u origin main
  ```
  Then <https://vercel.com/new> → Import → add the same env vars in the UI →
  Deploy. Every `git push` redeploys.
- **`.env` is never uploaded** (it's gitignored and Vercel ignores it too) — the
  secrets only come from `vercel env`.
- **Schema changes later:** edit `prisma/schema.prisma`, then `npm run db:push`
  against the Neon `DATABASE_URL`, then redeploy.
- **Rate limiting** is in-memory, so on Vercel it is per-serverless-instance, not
  global. Fine for a demo; back `lib/rate-limit.ts` with Upstash Redis for real
  traffic (see SECURITY.md).
- **Custom domain:** Vercel project → Settings → Domains. Then set
  `NEXT_PUBLIC_SITE_URL=https://yourdomain.com` as an env var so OG/social tags
  use it.
