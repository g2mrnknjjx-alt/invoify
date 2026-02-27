# Invoify

Invoify is a local-first invoice and quote generator built with Next.js App Router, TypeScript, React, and Shadcn UI. It helps users create, save, export, and send documents with optional cloud sync.

![Invoify Website image](/public/assets/img/invoify-web-app.png)

## Table of Contents

- [Invoify](#invoify)
  - [Table of Contents](#table-of-contents)
  - [Technologies](#technologies)
  - [Feature Highlights](#feature-highlights)
  - [Architecture](#architecture)
  - [Deployment and Environments](#deployment-and-environments)
  - [Vercel Environment Checklist](#vercel-environment-checklist)
  - [Sync Behavior](#sync-behavior)
  - [Storage and Migration Notes](#storage-and-migration-notes)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
  - [Quality Checks](#quality-checks)
  - [Test Matrix](#test-matrix)
  - [Release and Branching](#release-and-branching)
  - [Supabase Free-Plan Guardrails](#supabase-free-plan-guardrails)
  - [Supabase Setup (Authenticated Sync)](#supabase-setup-authenticated-sync)
  - [Troubleshooting](#troubleshooting)
  - [Known Limits](#known-limits)
  - [License](#license)


## Technologies

- **Next.js 15 (App Router):** SSR + client navigation.
- **TypeScript:** JavaScript superset with static typing.
- **React + React Hook Form + Zod:** Form state and validation.
- **Shadcn UI + Tailwind CSS:** UI primitives and styling.
- **Puppeteer / Chromium:** Server-side PDF rendering.
- **Nodemailer:** Email delivery for generated PDFs.
- **Vitest + Playwright:** Unit/integration and end-to-end testing.

## Feature Highlights

- Create either **Invoices** or **Quotes** from the same form flow.
- Convert a quote to an invoice with one click (with invoice-number prefix handling).
- Generate PDFs with template support and browser-side PDF caching.
- Send PDFs over SMTP with editable subject/body/footer.
- Save, duplicate, search, filter, and export invoice records.
- Track lifecycle status (`draft`, `sent`, `paid`, `accepted`, `declined`, `expired`) and payment progress.
- View saved-invoice insights (outstanding total, overdue count, sent-but-unpaid count).
- Persist user defaults (currency, template, locale) and auto-apply them on new invoices.
- Optional authenticated Supabase sync with conflict handling.

## Architecture

- `contexts/InvoiceContext.tsx`: top-level invoice orchestration (PDF actions, saved invoices, sync, export/email).
- `lib/storage/*`: browser persistence adapters with versioned envelopes and migration/corruption recovery paths.
- `app/api/invoice/*`: API route layer with shared request validation and normalized error payloads.
- `services/invoice/server/*`: route-independent business logic for PDF generation/export/email.
- `lib/sync/*`: optional cloud snapshot merge/push/pull logic and conflict resolution.

## Deployment and Environments

- Vercel Production is tracked from `master`.
- Preview deployments are generated for pull requests and non-production branches (including `codex/beta` when used as a beta branch).
- Required CI checks before merge: `lint`, `unit`, `build`, `e2e`.
- `NEXT_PUBLIC_*` variables are build-time client variables. Any change requires a redeploy of the environment you are testing.
- Sentry environment mapping:
  - local development: `development`
  - beta branch/deployments: `beta`
  - production (`master`): `production`
- Dev DX note: `next.config.js` includes `allowedDevOrigins` for localhost loopback hosts to avoid cross-origin dev warnings.

## Vercel Environment Checklist

When cloud auth/sync appears off in deployed environments, verify this checklist:

1. Set these values in Vercel for both `Preview` and `Production` (unless intentionally disabled in one):
   - `NEXT_PUBLIC_INVOICE_SYNC_PROVIDER=supabase-rest`
   - `NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>`
2. Confirm the values are not placeholders (for example, not `YOUR_SECRET_VALUE_GOES_HERE`).
3. Redeploy the same environment you are testing after any `NEXT_PUBLIC_*` change.
4. Test the correct URL:
   - Production domain for production config
   - Preview URL for preview config
5. If auth still shows off, hard-refresh the browser (`Cmd+Shift+R`) and re-check deployment logs.

## Sync Behavior

- Local-first by default (`NEXT_PUBLIC_INVOICE_SYNC_PROVIDER=local`).
- Cloud sync is optional and auth-gated (for cloud providers).
- Sync snapshots are capped by record counts and payload size to reduce failures.
- Merge strategy is deterministic by `updatedAt` with conflict records surfaced in-app.

## Storage and Migration Notes

- Draft envelope: `invoify:invoiceDraft:v2` (legacy `invoify:invoiceDraft` auto-migrates).
- Saved invoices envelope: `invoify:savedInvoices:v3` (legacy `invoify:savedInvoices:v2` and `savedInvoices` auto-migrate).
- Customer templates envelope: `invoify:customerTemplates:v2` (legacy `invoify:customerTemplates:v1` auto-migrates).
- User preferences: `invoify:userPreferences:v1`.
- Migration/corruption telemetry events are emitted client-side.
- On unrecoverable JSON/shape corruption, the app stores a backup key (`invoify:backup:*`) and resets safely.

## Getting Started

Follow these instructions to get Invoify up and running on your local machine.

### Prerequisites

- Node.js and npm installed on your system.

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/g2mrnknjjx-alt/invoify.git
   cd invoify
   ```
2. Install dependencies
   
   ```bash
   npm install
   ```
3. Create an `.env.local` file with this content (required only for "Send PDF to Email"):
   ```env
   # Option A: full SMTP URL
   SMTP_URL=
   # Option B: explicit SMTP settings
   SMTP_HOST=
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=
   SMTP_PASS=
   SMTP_FROM="Invoify <no-reply@example.com>"
   SMTP_FROM_NAME=
   SMTP_FROM_EMAIL=
   NEXT_PUBLIC_INVOICE_SYNC_PROVIDER=local
   NEXT_PUBLIC_SYNC_DEBOUNCE_MS=5000
   NEXT_PUBLIC_SYNC_MAX_INVOICES=250
   NEXT_PUBLIC_SYNC_MAX_TEMPLATES=100
   NEXT_PUBLIC_SYNC_MAX_PAYLOAD_BYTES=524288
   NEXT_PUBLIC_SYNC_RETRY_MAX_ATTEMPTS=3
   NEXT_PUBLIC_SYNC_RETRY_BASE_DELAY_MS=1000
   NEXT_PUBLIC_SENTRY_DSN=
   SENTRY_DSN=
   NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
   SENTRY_TRACES_SAMPLE_RATE=0.1
   # development locally, beta for beta deployments, production for production
   NEXT_PUBLIC_SENTRY_ENVIRONMENT=development
   SENTRY_ENVIRONMENT=development
   # optional release identifier in Sentry
   SENTRY_RELEASE=
   ```
   Use either `SMTP_URL` or `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`.
   `SMTP_FROM` is optional. You can also set `SMTP_FROM_NAME` + `SMTP_FROM_EMAIL`.
   PDF caching is browser-side only and does not require any environment variables.
   `NEXT_PUBLIC_INVOICE_SYNC_PROVIDER` is optional (`local` default, `noop-cloud` and `supabase-rest` supported).
   For `supabase-rest`, also set:
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   For Sentry source map uploads, also set:
   `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT`.
   Recommended Sentry environment mapping:
   local `.env.local` => `development`,
   beta deployment => `beta`,
   production deployment => `production`.
4. Start development server

    ```bash
    npm run dev
    ```
5. Open your web browser and access the application at [http://localhost:3010](http://localhost:3010)

`npm run dev` now safely reuses port `3010` by stopping stale listeners first (prevents `EADDRINUSE` loops).  
If you want raw Next.js behavior without that safety wrapper, run:

```bash
npm run dev:raw
```

### Quality Checks

Run unit/lint/build/e2e locally:

```bash
npm run test:unit
npm run lint
npm run build
npm run test:e2e
```

SMTP verification (optional):

```bash
npm run test:smtp
# or send a real test email when SMTP env vars are configured
npm run test:smtp:send
```

Optional cloud-sync e2e test credentials:

```bash
E2E_SUPABASE_EMAIL=your_test_user@example.com
E2E_SUPABASE_PASSWORD=your_test_user_password
```

Before first e2e run, install Playwright browser binaries:

```bash
npx playwright install --with-deps chromium
```

### Test Matrix

- `npm run test:unit`
  - Storage migration/corruption recovery (draft, saved invoices, templates)
  - API contract validation and normalized error payloads
  - PDF filename sanitization/meta helpers
  - Sync merge/conflict default behavior
- `npm run lint`
  - ESLint checks for TS/React codebase
- `npm run build`
  - Next.js production build validation
- `npm run test:e2e`
  - Core user workflows and browser integration checks
  - Corrupted draft recovery boot path
  - Send/export API error messaging flows
  - Saved invoice insights and preference reset flows

## Release and Branching

- Versioned releases are published using Git tags and GitHub Releases.
- Use the GitHub Releases page for version-specific changelogs:
  - [https://github.com/g2mrnknjjx-alt/invoify/releases](https://github.com/g2mrnknjjx-alt/invoify/releases)
- Recommended branch flow:
  - feature work on `codex/*` branches
  - PR merge into `master`
  - optional `master -> codex/beta` sync PR when beta should mirror production

## Supabase Free-Plan Guardrails

- Keep `NEXT_PUBLIC_SYNC_DEBOUNCE_MS` at `5000` or higher.
- Keep retry conservative:
  - `NEXT_PUBLIC_SYNC_RETRY_MAX_ATTEMPTS=3`
  - `NEXT_PUBLIC_SYNC_RETRY_BASE_DELAY_MS=1000`
- Keep snapshot caps conservative:
  - `NEXT_PUBLIC_SYNC_MAX_INVOICES=250`
  - `NEXT_PUBLIC_SYNC_MAX_TEMPLATES=100`
- Keep payload guard enabled:
  - `NEXT_PUBLIC_SYNC_MAX_PAYLOAD_BYTES=524288` (512 KB)
- PDFs are not part of cloud snapshots; they remain browser-cached locally.
- If payload exceeds guard limit, sync is skipped and logged to telemetry instead of spamming failed writes.

## Supabase Setup (Authenticated Sync)

1. Install Supabase CLI (if needed) and login:
   - `brew install supabase/tap/supabase`
   - `supabase login`
2. Initialize/local-link project:
   - `supabase init`
   - `supabase link --project-ref <your-project-ref>`
3. Apply migration:
   - `supabase db push`
4. Configure app env:
   - `NEXT_PUBLIC_INVOICE_SYNC_PROVIDER=supabase-rest`
   - `NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>`
5. Important behavior:
   - Sync only runs for authenticated users.
   - Sync writes directly to `public.invoice_sync_snapshots` through Supabase RLS.
   - Unauthenticated users stay fully local and sync attempts are skipped (telemetry event only).
   - Use the top-right `Sign In` button in the app navbar to authenticate with Supabase Auth.

## Troubleshooting

- Clear only saved invoices:
  - Open browser devtools console and run:
  - `localStorage.removeItem('invoify:savedInvoices:v3')`
- Clear customer templates:
  - `localStorage.removeItem('invoify:customerTemplates:v2')`
- Clear draft form:
  - `localStorage.removeItem('invoify:invoiceDraft:v2')`
- Clear user preferences:
  - `localStorage.removeItem('invoify:userPreferences:v1')`
- Clear legacy invoices key:
  - `localStorage.removeItem('savedInvoices')`
- Clear PDF cache:
  - In devtools Application tab, delete IndexedDB `invoify-client-cache-v1`.
- Clear telemetry events:
  - `localStorage.removeItem('invoify:telemetry:v1')`
- Full local reset:
  - Clear all related localStorage keys above and remove the IndexedDB database.
- Sentry disabled unexpectedly:
  - Verify `NEXT_PUBLIC_SENTRY_DSN` (browser) and/or `SENTRY_DSN` (server) are set.
  - Rebuild after changing env variables (`npm run build`).
- `Auth Off` in a deployed environment:
  - Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set for the same Vercel environment (`Preview` or `Production`) as the URL being tested.
  - Verify `NEXT_PUBLIC_INVOICE_SYNC_PROVIDER=supabase-rest`.
  - Redeploy after changing any `NEXT_PUBLIC_*` variable.

## Known Limits

- The app is local-first; cloud sync is optional and currently snapshot-based.
- PDF cache is browser-local (IndexedDB) and is not synced to cloud providers.
- Email delivery requires valid SMTP configuration (`SMTP_URL` or host/port/user/pass).
- Aggregated saved-invoice insights are numeric totals and do not currently split by currency.
- Vercel password protection is plan-dependent and may require an upgraded plan for direct password-based gates.

<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.
