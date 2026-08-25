# LSCNR Store

Headless Tebex storefront for **Los Santos Cops and Robbers**, hosted on Vercel at `store.lscnr.net`.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (LSCNR red/blue design tokens)
- Tebex Headless API + Tebex.js checkout
- Zustand cart persistence
- Vercel Postgres + Drizzle (order history via webhooks)

## Local development

1. Copy `.env.example` to `.env.local` and fill in Tebex API keys.
2. Install and run:

```bash
npm install
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Environment variables

See `.env.example` for the full list. Minimum for catalog + cart:

- `NEXT_PUBLIC_TEBEX_PUBLIC_TOKEN`
- `TEBEX_PRIVATE_KEY`
- `NEXT_PUBLIC_SITE_URL`

For order history:

- `POSTGRES_URL`
- `TEBEX_WEBHOOK_SECRET` (optional signature verification)
- Configure Tebex webhook → `https://store.lscnr.net/api/tebex/webhook`

For the admin panel (`/admin`):

- `TEBEX_SECRET_KEY` — your **game server secret key** from the Tebex Creator panel (game server integration). This uses the Tebex **Plugin API**, which is separate from the Headless keys.
- `ADMIN_PASSWORD` — set any password to enable `/admin`; leave blank to disable the panel entirely.

## Admin panel

Visit `/admin` and sign in with `ADMIN_PASSWORD`. The panel drives the Tebex Plugin API and supports:

- **Coupons** — list, create, delete
- **Gift cards** — list, create, top-up, void
- **Shop items** — edit existing package name/price and enable/disable
- **Sales** — view active sales (read-only via API)
- **Payments** — view recent transactions
- **Bans** — list and create player/IP bans

> Note: Tebex's API cannot **create** brand-new packages or sales — those are made in the [Tebex Creator panel](https://creator.tebex.io). The admin panel edits existing items and manages everything else the API allows. The secret key is only ever used server-side (`/api/admin/*`), never exposed to the browser.

## Deploy to Vercel

1. Import this repo into Vercel.
2. Set environment variables from `.env.example`.
3. Add custom domain `store.lscnr.net`.
4. In Tebex Creator: enable Headless API, set webhook URL, configure basket return URLs.

## Tebex setup checklist

- [ ] API keys in Vercel env
- [ ] Webhook pointing to `/api/tebex/webhook`
- [ ] `complete_url` / `cancel_url` handled by `/checkout/complete` and `/checkout/cancel`
- [ ] FiveM + Discord auth enabled in Tebex store settings
