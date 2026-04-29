# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Currently hosts the **Baldwin Calls Auto-Poster** —
a Discord webhook auto-posting bot for the Baldwin Calls server (crypto-call style),
served by the API server artifact at `/api/`. All call/snipe/trade/whale/proof/trending
posts use **real on-chain token data** (real CAs, real prices, real mcap/liquidity)
pulled live from DexScreener + CoinGecko + a public Ethereum RPC.

## What's built

- **API server** (`artifacts/api-server/`) — Express 5 backend that:
  - Serves a built-in admin dashboard at `/api/` (HTML + vanilla JS).
  - Posts to Discord channels via webhooks.
  - Runs a background scheduler (`src/discord/scheduler.ts`) that fires
    randomized-cadence posts per channel when `autoPost` is on.
  - Persists config + history to JSON files in `artifacts/api-server/data/`.
  - Serves static proof images from `artifacts/api-server/public/images/`
    at `/api/static/images/...` (copied into `dist/public/` at build time).

### Channels (23 total)
One-shot info channels (manual): `welcome`, `rules`, `get_verified`, `bot_commands`,
`how_to_join_vip`, `open_ticket`, `feedback`, `report_scams`.
Recurring auto-post channels: `announcements`, `join_vip`, `free_calls`,
`proof_results`, `market_chat`, `general_chat`, `trending_coins`, `vip_snipes`,
`early_access`, `whale_tracker`, `live_trades`, `alpha_lounge`, `price_bot`,
`gas_tracker`, `alerts`.

### Real market data
`src/discord/marketdata.ts` is the single source for live data:
- **DexScreener** (`token-boosts/top/v1` + `tokens/v1/{chain}/{addr}`) — trending
  tokens with real CAs, chains, mcap, FDV, liquidity, 24h volume, 1h/24h price
  change, pair age, DexScreener chart URL, and token icon. Cached 3 min.
- **CoinGecko `simple/price`** — BTC/ETH/SOL/BNB/DOGE/XRP spot prices and 24h
  change. Cached 1 min.
- **Public Ethereum RPC** (publicnode → drpc → 1rpc fallback) — live `eth_gasPrice`
  for the gas tracker. Cached 1 min.

All generators in `src/discord/generators/` (`calls`, `trackers`, `chat`, `alpha`)
import from `marketdata.ts` so embeds carry real CAs, real DexScreener chart links,
real explorer links, and the token's own icon as the embed thumbnail.

### Key files
- `src/discord/config.ts` — channel registry, config + history persistence.
- `src/discord/marketdata.ts` — live token / price / gas data with caching.
- `src/discord/poster.ts` — webhook send + image URL helper.
- `src/discord/scheduler.ts` — per-channel jittered timers.
- `src/discord/generators/` — one file per channel family
  (`info`, `calls`, `announcements`, `chat`, `trackers`, `alpha`).
- `src/discord/data.ts` — color palette, hype/teaser pools, format helpers.
- `src/discord/verify-bot.ts` — react-to-verify bot (gives @Verified role on ✅
  reaction). Needs `DISCORD_BOT_TOKEN` (set), plus `DISCORD_GUILD_ID`,
  `DISCORD_VERIFIED_ROLE_ID`, `DISCORD_VERIFY_CHANNEL_ID` to fully connect.
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
