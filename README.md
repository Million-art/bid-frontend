# Carra Market — Frontend

Next.js Mini App / web client for Carra Market lowest-unique-bid auctions.

**Project docs:** [../docs/README.md](../docs/README.md) (architecture, payments, local setup, deploy).

## Stack

- Next.js 16 (App Router) + React 19
- TypeScript, Tailwind CSS, Framer Motion
- TanStack Query, Zod
- Auth: Telegram WebApp / widget, Google OAuth, email/password
- Analytics: PostHog (`posthog-js`)
- Errors: Sentry

## Setup

```bash
cp .env.example .env
npm ci
npm run dev
```

App defaults to [http://localhost:3000](http://localhost:3000). Point `NEXT_PUBLIC_API_URL` at the backend (used server-side / proxy; browser traffic goes through same-origin `/api`).

### Key env vars

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend base URL (server / proxy) |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | Telegram Login Widget |
| `GOOGLE_CLIENT_ID` / `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google Sign-In (prefer runtime `GOOGLE_CLIENT_ID`) |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | PostHog project token (blank = off) |
| `NEXT_PUBLIC_POSTHOG_HOST` | e.g. `https://us.i.posthog.com` |
| `NEXT_PUBLIC_SENTRY_DSN` | Client error tracking |

See `.env.example` for the full list.

### PostHog (runtime, not Docker-baked)

`NEXT_PUBLIC_*` values are **not** baked into the production image. The client loads public config from `GET /api/public-config` at runtime. Set PostHog (and other) vars on the container / compose `env_file`, then restart — no rebuild required for token changes.

Tracked events include page views, Mini App open, login/signup, contact/channel prompts, and payment start/verify.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local development |
| `npm run build` | Production build (standalone output for Docker) |
| `npm run start` | Run production server |
| `npm run test` | Vitest |
| `npx tsc --noEmit` | Typecheck |

## Auction cards (UI)

Public auction cards currently show:

- Title, entry fee pill, optional retail “Worth …”
- **First sentence** of the auction description (truncated if very long)
- Countdown / CTA

Hidden for now (commented in `AuctionCard` / `BidPanel`):

- Players joined count
- Entrants progress bar
- Total bids count on the bid panel

## Docker / deploy

- Multi-stage `Dockerfile` (Next.js standalone)
- CI builds **`linux/arm64`** on `ubuntu-24.04-arm` for AWS Graviton (QEMU amd64→arm64 breaks Next.js/SWC)
- Image is env-agnostic; configure runtime env on the host

## Related

- Backend: `../bid-backend`
