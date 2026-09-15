# Warechhiya

**Dress Your Story** — a premium fashion ecommerce storefront for the Bangladesh market. Next.js 14
(App Router) + TypeScript + Prisma + MySQL + Tailwind CSS.

This is a real, working full-stack application: every page is connected to a live database, not a
mockup. Product variants (color × size), cart, checkout, order lifecycle, inventory, and a full
admin panel are all functional end to end.

---

## 1. Tech stack

- **Framework**: Next.js 14 (App Router), TypeScript
- **Database**: MySQL 8 only — the schema targets `provider = "mysql"` in
  `prisma/schema.prisma`. A different engine (PostgreSQL/SQLite) is not supported without changing
  the schema yourself and re-testing every query — in particular, every long-text/JSON field is
  explicitly annotated `@db.Text`/`@db.VarChar(n)` for MySQL's default `VARCHAR(191)` string length
  (unbounded `TEXT` on PostgreSQL), and search filters rely on MySQL's default case-insensitive
  collation rather than Prisma's `mode: "insensitive"` (PostgreSQL/MongoDB only).
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **State**: Zustand (cart, compare — persisted to `localStorage`)
- **Auth**: JWT (access + refresh, httpOnly cookies), bcrypt password hashing
- **Email**: Resend (transactional email — welcome, verification, password reset, order
  confirmation/status updates, newsletter, abandoned cart, contact form)
- **Images**: Cloudinary for admin-uploaded product photos (falls back to `public/uploads` locally
  with no credentials)
- **Payments**: bKash, Nagad, SSLCommerz (also routes Visa/Mastercard/Amex/Rocket), ShurjoPay — real
  integration code, inert until credentials are supplied; Cash on Delivery works with zero setup
- **Testing**: Vitest (unit/integration), Playwright (browser E2E)

---

## 2. Quick start (local development)

**Requirements:** Node.js 20+, npm, a local MySQL 8 instance (or a free hosted one — see §8).

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template and fill in your local database URL + fresh secrets
cp .env.example .env
```

Edit `.env`:
- `DATABASE_URL` — point at your MySQL instance, e.g.
  `mysql://jjclothing_app:yourpassword@localhost:3306/jj_clothing_db`. Use a dedicated,
  non-root MySQL user for this — never point the app at your root account. Create one:
  ```sql
  CREATE DATABASE jj_clothing_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
  CREATE USER 'jjclothing_app'@'localhost' IDENTIFIED BY 'yourpassword';
  GRANT ALL PRIVILEGES ON jj_clothing_db.* TO 'jjclothing_app'@'localhost';
  FLUSH PRIVILEGES;
  ```
- `JWT_SECRET` / `JWT_REFRESH_SECRET` / `CRON_SECRET` — generate fresh random values, e.g.
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` (run three times)
- Everything else can stay blank for local development — the app degrades gracefully (emails log
  to console, payments fall back to "pending", uploads fall back to `public/uploads`).

```bash
# 3. Generate the Prisma client and create the schema
npx prisma generate
npx prisma migrate deploy

# 4. Seed the database — categories, collections, sample clothing products with
#    color/size variants, and a temporary admin account
npm run db:seed

# 5. Start the dev server
npm run dev
```

Open **http://localhost:3000**.

Or run steps 1, 3, and 4 in one go: `npm run setup` (still create/edit `.env` yourself first).

### Demo / seed accounts

The seed script creates one admin account. Its email/password come from `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD` in your `.env` if set, otherwise a random password is **generated and printed
once** to the terminal — watch the output of `npm run db:seed` and save it. No password is ever
hardcoded in the repository.

The seed refuses to run when `NODE_ENV=production`, because it deletes existing orders, reviews,
and users before inserting demo data.

**Change the admin password immediately** after first login, via **Account → Profile**
(`/account/profile`), or:

```bash
npm run admin:password admin@example.com              # generates and prints a new password
npm run admin:password admin@example.com 'YourNewPass' # or set one explicitly
```

### Changing an account's email

```bash
npm run user:email old@example.com new@example.com
```

Refuses an address already in use; marks the new one verified. Deliberately not exposed in the
profile UI — changing a sign-in address is an account-recovery action, not a routine edit.

Visit `/admin` after logging in as the admin account for the dashboard, product/variant manager,
inventory, orders, coupons, affiliates, support tickets, reports, and homepage builder.

---

## 3. What's implemented

**Working end-to-end:**
- Product catalog with **color × size variants** — every product has one or more `ProductVariant`
  rows (color, size, SKU, stock, optional price override); no product exists without at least one.
  Cart/checkout/orders/inventory all key on `(productId, variantId)`.
- Shop page with gender/color/size/category/collection filters, sorting, live search-as-you-type
- Product detail pages: color/size selector with stock-aware disabling, quantity clamped to the
  selected variant's real stock, size guide (per-category chart), material/fit/care details,
  related products, reviews
- Cart (persisted client-side, keyed by variant) + full checkout: shipping form, coupon codes,
  Dhaka/outside-Dhaka shipping rules, server-side price re-validation (never trusts client-submitted
  prices)
- Authentication: register/login/logout with JWT access + refresh tokens, bcrypt hashing,
  role-based access (`ADMIN`/`MANAGER`/`STAFF`/`CUSTOMER`), email verification, password reset
- Admin panel: dashboard stats, product + variant CRUD (with a color/size combination generator),
  variant-level inventory (stock adjustment with an audit trail), order management (manual order
  entry, status transitions, stock deduction/restoration), coupons, affiliate/commission overview,
  support tickets, reports (with print/export), homepage builder, blog CMS — all protected by
  `middleware.ts` and per-route role checks
- Customer account dashboard: order history, order detail, saved addresses, profile, wishlist,
  compare, referral/affiliate dashboard, notifications, support tickets
- **Bilingual storefront: English + Bangla**, switchable live, cookie-persisted
- Collections (seasonal/thematic groupings) with story pages
- Affiliate/referral program: unique referral codes, `?ref=` link tracking, automatic commission
  crediting, customer + admin dashboards
- Abandoned cart recovery via a cron-callable endpoint (see §6)
- SEO: dynamic metadata, Open Graph, JSON-LD (Organization + Product availability), sitemap.xml,
  robots.txt
- Security hardening: rate limiting, CSRF origin checks, security headers, stateless action tokens
  (see §10)
- Automated tests: Vitest (293 tests — cart logic, pricing, payment-provider config detection,
  coupon math, and more) + a Playwright E2E suite (see §7)

**Built with real integration code, but needs your own credentials to go live:**
- Payment gateways (bKash, Nagad, SSLCommerz, ShurjoPay) — see §9
- Transactional email (Resend) — see §5
- Cloudinary image uploads — see `.env.example`

**Placeholder, by design, until you supply the real thing:**
- Brand identity centralized in `src/config/brand.ts` — name, tagline, contact, colors. Swapping in
  a real name/tagline is a one-line change.
- The logo/favicon/app-icon files in `public/` are a generated "JJ" text-monogram placeholder
  (`tests/e2e/generate-icons.mjs` regenerates them from `tests/e2e/logo*-template.html` if you tweak
  the design) — replace with real artwork when you have it.
- Product photography is placehold.co placeholder imagery from the seed script.

---

## 4. Product variants (color × size)

Every product has at least one `ProductVariant` (color, size, SKU, stock, optional price override).
There is no legacy "flat stock" code path anywhere in the app — cart items, order line items,
inventory adjustments, invoices, packing slips, and shipping labels all carry the variant's
color/size/SKU through the entire flow, from add-to-cart to admin order view.

In the admin product form, use the color tag input + size chip picker, then **Generate
combinations** to create every color × size row at once (e.g. 2 colors × 3 sizes → 6 variants),
then set stock/SKU per row before saving.

---

## 5. Transactional email (Resend)

Email is sent through **[Resend](https://resend.com)** via its official SDK (`src/server/email/`).

1. Create a free account at **[resend.com/signup](https://resend.com/signup)** (3,000 emails/month,
   no card required).
2. **API Keys → Create API Key** (Sending access) — copy the value, shown once.
3. Add to `.env`:
   ```bash
   RESEND_API_KEY="re_your_key_here"
   EMAIL_FROM=""   # optional, see below
   ```

The default sender is Resend's shared `onboarding@resend.dev`, which can only deliver to the email
address that owns the Resend account — fine for testing, not for real customers. To email real
customers, verify a domain in **Resend → Domains**, then set
`EMAIL_FROM="Warechhiya <orders@yourdomain.com>"`.

With no `RESEND_API_KEY`, emails are logged to the console instead of sent, so a fresh clone works
with no mail account at all. Admin diagnostic: `GET`/`POST /api/admin/email-status` (requires an
`ADMIN`/`MANAGER` session).

---

## 6. Abandoned cart recovery

The cart is client-side, so recovery works by tracking **checkout sessions**: when a visitor
reaches checkout and enters an email, `POST /api/cart-session` snapshots their cart server-side.

Next.js has no built-in background job runner, so point an external scheduler at:
```
GET /api/cron/abandoned-carts
Header: Authorization: Bearer <CRON_SECRET>
```
[Vercel Cron](https://vercel.com/docs/cron-jobs), [cron-job.org](https://cron-job.org), or a GitHub
Actions scheduled workflow all work. Run it every 30–60 minutes.

---

## 7. Testing

```bash
npm test               # Vitest — run once
npm run test:watch     # Vitest — watch mode

npm run test:e2e         # Playwright — full browser E2E suite (Chromium)
npm run test:e2e:headed  # same, with a visible browser window
npm run test:e2e:ui      # Playwright's interactive UI mode
npm run test:e2e:report  # open the HTML report from the last run
```

**Vitest** covers real logic: currency/discount formatting, coupon math, the cart store
(add/remove/quantity-clamping/subtotal, keyed by variant), search, JSON-LD, payment-provider
`isConfigured()` detection, and more. Test files live in `__tests__/` folders next to what they
test.

**Playwright** (`tests/e2e/smoke.spec.ts`) drives a real Chromium browser against your local dev
server — homepage, shop navigation, product page, add-to-cart, cart drawer, checkout, admin login,
admin dashboard. `playwright.config.ts` reuses an already-running `npm run dev` if one exists, or
starts one. Admin tests read credentials from `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` (falling back
to `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`) — never hardcoded — and skip automatically if neither
is set.

`tests/e2e/shot.mjs` and `shot-admin.mjs` are ad-hoc screenshot helpers for quick visual checks
during development (not part of the test suite): `node tests/e2e/shot.mjs /shop shop.png
[--mobile] [--viewport]`.

Next.js **dev mode** compiles each route on first request in a given server session — the very
first run against a cold server can be noticeably slower than subsequent ones. If E2E tests time out
on a cold server, hit the routes once with `curl` first, or just re-run.

---

## 8. Database

MySQL 8 only. Options for local development:
- Install MySQL 8 locally and create a dedicated database + non-root user (see §2's exact SQL).
- Or use a free hosted MySQL-compatible instance for zero local setup — e.g.
  [Railway](https://railway.app) or [Aiven](https://aiven.io)'s free tiers.

Use `utf8mb4` with a case-insensitive collation (`utf8mb4_0900_ai_ci` on MySQL 8, or
`utf8mb4_general_ci`) — the app relies on MySQL's default collation being case-insensitive for
search (see `src/app/api/products/__tests__/search-case.test.ts`), rather than Prisma's
`mode: "insensitive"` option, which only exists on PostgreSQL/MongoDB.

```bash
npm run db:generate         # regenerate the Prisma client after a schema change
npm run db:push             # push schema changes without a migration file (fast iteration)
npm run db:migrate:deploy   # apply committed migrations (use this in production)
npm run db:migrate:status   # what's pending, and against which database
npm run db:studio           # Prisma Studio — browse/edit data visually
npm run db:backup           # full JSON export to backups/ (gitignored)
```

`prisma/seed.ts` is destructive (it deletes existing orders/products/users before inserting demo
data) and refuses to run when `NODE_ENV=production`.

---

## 9. Activating real payments (Bangladesh gateways)

Every gateway integration in `src/server/payments/` makes real HTTP calls to that provider's
sandbox/production API. To go live:

1. Get merchant credentials (bKash Merchant/PGW, Nagad Merchant onboarding, SSLCommerz store,
   ShurjoPay account).
2. Add them to `.env` (every variable is documented in `.env.example`).
3. Redeploy — `provider.isConfigured()` detects the credentials automatically and switches from a
   "pending payment" fallback to a live gateway redirect.

Visa/Mastercard/Amex and Rocket route through **SSLCommerz** — no separate card integration needed.

**Payment verification**: every callback route performs the provider's own required
server-to-server verification (bKash's "execute payment", Nagad's "verify payment", SSLCommerz's
Order Validation API, ShurjoPay's verification endpoint) before ever marking an order paid. The
redirect status alone is never trusted, since a browser could replay or forge that URL.

---

## 10. Security

- **CSRF protection** (`src/middleware.ts`): every state-changing API request is checked against its
  `Origin`/`Referer` header, on top of `sameSite=lax` cookies. Payment-gateway callbacks and the
  cron endpoint are exempted and instead authenticate server-to-server / via a bearer secret.
- **Rate limiting** on login, registration, password reset, checkout, cart-session tracking, and
  newsletter signup — all keyed by IP. In-memory by default (fine for a single instance; swap in
  Redis/Upstash for multi-instance deployments).
- **Security headers**: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`, `Strict-Transport-Security`, and a `Content-Security-Policy` on every route.
- **Stateless action tokens**: email verification and password reset links are purpose-scoped JWTs —
  a verification link can never be replayed as a password-reset link.
- **Server-side price recalculation**: checkout never trusts client-submitted prices.
- **Admin API input hardening**: every `/api/admin/*` mutation validates its body against an
  explicit zod schema — none spread a raw request body into a Prisma `data` object.
- **Auth**: httpOnly, sameSite cookies; bcrypt hashing; role checks enforced in both
  `middleware.ts` (page-level) and every `/api/admin/*` route handler (API-level).
- Password reset requests never reveal whether an email exists in the system.
- No secrets are ever committed — see §12.

**Known gaps before real production traffic**: rate limiting is in-memory only (resets on redeploy,
doesn't share state across instances); no automated dependency scanning configured (run `npm audit`
periodically, or wire up Dependabot).

---

## 11. Docker

```bash
docker compose up --build
```

`docker-compose.yml` bundles a MySQL 8 container matching the schema — no changes needed to try
it locally. It ships with placeholder secrets (`change-this-to-a-long-random-string`); replace them
before using this setup for anything beyond a local trial.

---

## 12. Environment variables & secrets

See `.env.example` for the full documented list (database, JWT secrets, payment gateway
credentials, analytics IDs, contact info, seed admin). Copy it to `.env` and fill in real values —
**`.env` is gitignored and must never be committed.**

If you ever suspect a secret was committed: rotate it immediately (it's compromised the moment it
touches Git history, whether or not the repo is public), then remove it from history with a tool
like [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) or `git filter-repo` before
pushing again.

---

## 13. Project structure

```
prisma/
  schema.prisma       Database schema (User, Product, ProductVariant, Order, Collection, etc.)
  seed.ts             Seed script: categories, collections, sample clothing products with
                      color/size variants, demo admin account

src/
  server/             ── BACKEND-ONLY. Never imported by anything the browser runs. ──
    db.ts             Prisma client singleton
    auth.ts           JWT + password hashing + stateless action-token helpers
    orders.ts         Order creation, coupon resolution, stock verification
    inventory.ts      The single choke point for stock mutations (adjustStock)
    rate-limit.ts     In-memory rate limiter for auth/checkout endpoints
    email/            Resend client, HTML templates, and send functions
    payments/         Modular payment gateway integrations (one file per provider)

  app/                ── ROUTES. ──
    api/              Backend REST-style endpoints (auth, products, orders, payments, admin/*)
    admin/            Admin dashboard pages (protected by middleware.ts)
    account/          Customer dashboard pages
    (shop, product, cart, checkout, login, etc.) — customer-facing pages

  components/         ── FRONTEND. ──
    admin/            Admin-only components

  config/
    brand.ts          Centralized brand identity — name, tagline, colors, contact, social

  lib/                Shared code used by BOTH frontend and backend (pure functions, no secrets)
    i18n/             English/Bangla dictionaries + server & client locale helpers
    cart-store.ts     Zustand cart store (persisted to localStorage), keyed by (productId, variantId)

  middleware.ts       Protects /admin/** routes + CSRF origin-check for /api/**

tests/e2e/            Playwright browser E2E suite + ad-hoc screenshot helpers

public/
  logo.png            Brand logo (placeholder — see §3)
```

**Rule of thumb for editing**: changing how something *looks* → `src/components/` or a page file
under `src/app/`. Changing how something *works* (data, validation, payments, emails, auth) →
`src/server/` or the relevant `src/app/api/*/route.ts` file.

---

## 14. Build for production

```bash
npm run build
npm start
```

Don't run `npm run build` in one terminal while `npm run dev` is running in another — both write to
the same `.next` directory and will corrupt each other's state. Stop the dev server first.

---

## 15. Deploying (free-tier friendly)

This project has not been deployed anywhere yet — the steps below are for when you're ready.

A straightforward, free-tier-friendly stack:
- **Hosting**: [Vercel](https://vercel.com) (free tier) — first-class Next.js support, zero config
  for this project's build.
- **Database**: [Railway](https://railway.app) or [Aiven](https://aiven.io) (free tier MySQL).
- **Email**: [Resend](https://resend.com) (free tier, 3,000/month).
- **Images**: [Cloudinary](https://cloudinary.com) (free tier, ~25 GB).

General steps when you're ready:
1. Push this repository to GitHub (see the repo this README ships in).
2. Create a free MySQL database (Railway/Aiven), copy its connection string into `DATABASE_URL`.
3. Import the project into Vercel, add every variable from `.env.example` (with real values) under
   **Project → Settings → Environment Variables** for Production (and Preview if you want preview
   deployments to work too).
4. Set `NEXT_PUBLIC_SITE_URL` to your real domain, not a per-deployment preview URL — Vercel's
   `...-<hash>-<team>.vercel.app` names are frozen to one build, so canonical tags built from them
   would point search engines at a stale deployment after the next push.
5. Run migrations against the new database (`npx prisma migrate deploy`) and seed it
   (`npm run db:seed`) before or right after the first deploy.
6. Redeploy after adding environment variables — Vercel snapshots them into a deployment when it's
   created, so they don't retroactively apply to one already running.
