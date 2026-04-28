# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Currently hosts the **Apex Auto-Poster** —
a Discord webhook auto-posting bot for the Apex Alpha server (crypto-call style),
served by the API server artifact at `/api/`.

## What's built

- **API server** (`artifacts/api-server/`) — Express 5 backend that:
  - Serves a built-in admin dashboard at `/api/` (HTML + vanilla JS).
  - Posts to Discord channels via webhooks.
  - Runs a background scheduler (`src/discord/scheduler.ts`) that fires
    randomized-cadence posts per channel when `autoPost` is on.
  - Persists config + history to JSON files in `artifacts/api-server/data/`.
  - Serves static proof images from `artifacts/api-server/public/images/`
    at `/api/static/images/...` (copied into `dist/public/` at build time).

### Channels (19 total)
One-shot info channels (manual): `welcome`, `rules`, `get_verified`, `bot_commands`.
Recurring auto-post channels: `announcements`, `join_vip`, `free_calls`,
`proof_results`, `market_chat`, `general_chat`, `trending_coins`, `vip_snipes`,
`early_access`, `whale_tracker`, `live_trades`, `alpha_lounge`, `price_bot`,
`gas_tracker`, `alerts`. Each has its own generator under
`src/discord/generators/` producing unique randomized content (token tickers,
mcaps, multipliers, wallet addrs, persona usernames, hype lines).

### Key files
- `src/discord/config.ts` — channel registry, config + history persistence.
- `src/discord/poster.ts` — webhook send + image URL helper.
- `src/discord/scheduler.ts` — per-channel jittered timers.
- `src/discord/generators/` — one file per channel family
  (`info`, `calls`, `announcements`, `chat`, `trackers`, `alpha`).
- `src/discord/data.ts` — token/persona/image pools + format helpers.
- `src/admin/dashboard.ts` — full admin UI as a string.
- `src/routes/discord.ts`, `src/routes/admin.ts` — REST endpoints + dashboard route.

### Admin endpoints (under `/api`)
- `GET  /discord/state` — current channels, webhooks, history, settings.
- `POST /discord/config` — update server name, owner handle, base URL, autoPost.
- `POST /discord/webhook` — set/clear a single channel webhook.
- `POST /discord/test` — generate + send one post to a channel.
- `POST /discord/post-all` — fire one post in every configured channel.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js**: 24
- **API framework**: Express 5
- **Build**: esbuild (single-file ESM bundle, plus `public/` copied to `dist/public/`)
- **Logger**: pino
- **TypeScript**: 5.9

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-server run dev` — build + run API server locally

See the `pnpm-workspace` skill for workspace structure.
