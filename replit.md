# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Currently hosts the **Baldwin Calls Auto-Poster** —
a Discord webhook auto-posting bot for the Baldwin Calls server (crypto-call style),
served by the API server artifact at `/api/`. All call/snipe/trade/whale/proof/trending
posts use **real on-chain token data** (real CAs, real prices, real mcap/liquidity)
pulled live from DexScreener + CoinGecko + a public Ethereum RPC.

## Recent changes (June 2026)
- **Dark cinematic image redesign**: All 16 card templates completely overhauled to a pure-black/silver/gold palette — no neon, no bright colors. Backgrounds use smoke particle wisps, heavy cinematic vignette, film grain, and a silver/gold edge frame. Candles use dark gold (up) and steel silver (down). Pushed to GitHub at `https://github.com/daviddan-241/Discord-alpha-`.
- **TEMPLATES registry**: Added named export `TEMPLATES` map to `templates.ts` so the render route can dynamically resolve all 16 slugs.
- **Reference image**: `artifacts/api-server/public/dark-bg.jpg` added — the dark statue/figure reference that inspired the color scheme.

## Previous changes (April 2026)
- **Premium card images**: All 16 Discord/Telegram card templates completely redesigned with premium dark atmospheric backgrounds, glowing hero typography, money-stack decorations, glowing orb mascot elements, accent lines, and film grain — inspired by TokenScan-style broadcast graphics.
- **Per-channel bot names**: Each channel now picks a unique name from its own pool (AlphaBot, SignalBot, ReceiptBot, WhaleBotent, etc.) instead of a single username.
- **Telegram photo sending**: Re-enabled — bot sends `sendPhoto` with caption when image URL is available, falls back to `sendMessage` if the photo URL fails.
- **New canvas helpers**: `drawGlowText`, `drawMoneyStacks`, `drawGlowOrb`, `drawPremiumBadge`, `drawAccentLine`, `drawHeaderBar`, improved `paintBackground` with vignette + stronger atmospheric glow.

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

### Telegram mirror
Every successful Discord webhook post is fanned out (best-effort, non-blocking)
to a configurable Telegram chat via the official Bot API:
- `src/discord/telegram-poster.ts` — converts a Discord `WebhookPayload` into
  a Telegram `sendPhoto` (with HTML caption) or `sendMessage` call. Rewrites
  `<@discordId>` mentions to the configured `telegramDmHandle` so the VIP CTA
  still points users somewhere useful.
- `src/routes/telegram.ts` — REST: `state`, `config`, `discover` (uses
  `getUpdates` to find chats the bot has been added to), `probe`, `test`,
  `post-all`.
- Token comes from `TELEGRAM_BOT_TOKEN` env var. The dashboard "🔍 Discover
  chats" button auto-fills the broadcast chat ID.

### Animated images (GIF)
`src/discord/render/animate.ts` re-runs each static template across N frames
with an animated overlay (pulsing rings, shimmer sweep, floating arrows, ticker
tape, heartbeat dot) and encodes to GIF using `gifenc`. Cached 5 min per query.
Roughly ~35–60% of high-impact embeds (proof / snipe / trending / vip / whale /
trade / alert) randomly use `.gif` instead of `.png` via `maybeAnimatedRenderUrl`
in `src/discord/poster.ts`.
- Endpoints: `GET /api/render/<template>.png` and `GET /api/render/<template>.gif`

### Key files
- `src/discord/config.ts` — channel registry, config + history persistence.
- `src/discord/marketdata.ts` — live token / price / gas data with caching.
- `src/discord/poster.ts` — webhook send + image URL helper, with
  `maybeAnimatedRenderUrl` for mixed PNG/GIF embeds and Telegram fan-out.
- `src/discord/telegram-poster.ts` — Telegram Bot API fan-out + chat discovery.
- `src/discord/render/animate.ts` — GIF encoder + overlay engine.
- `src/discord/scheduler.ts` — per-channel jittered timers.
- `src/discord/generators/` — one file per channel family
  (`info`, `calls`, `announcements`, `chat`, `trackers`, `alpha`).
- `src/discord/data.ts` — color palette, hype/teaser pools, format helpers.
- `src/discord/verify-bot.ts` — react-to-verify bot (gives @Verified role on ✅
  reaction). Needs `DISCORD_BOT_TOKEN` (set), plus `DISCORD_GUILD_ID`,
  `DISCORD_VERIFIED_ROLE_ID`, `DISCORD_VERIFY_CHANNEL_ID` to fully connect.
- `src/admin/dashboard.ts` — full admin UI (Telegram section included).
- `src/routes/discord.ts`, `src/routes/telegram.ts`, `src/routes/render.ts`,
  `src/routes/admin.ts` — REST endpoints + dashboard route.

### Required env / secrets
- `DISCORD_BOT_TOKEN` (secret) — verify bot.
- `TELEGRAM_BOT_TOKEN` (env) — Telegram mirror.
- `DISCORD_GUILD_ID`, `DISCORD_VERIFIED_ROLE_ID`, `DISCORD_VERIFY_CHANNEL_ID`
  (secrets) — only needed if the verify bot should auto-grant roles.

### Files NEVER commit (gitignored)
- `artifacts/data/` — contains `discord-config.json` (webhook URLs, telegram
  chat IDs) and `discord-history.json` (post log).

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
