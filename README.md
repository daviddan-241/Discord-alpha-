# Baldwin Calls Auto-Poster

Discord & Telegram auto-posting bot for a crypto-call server. Drives **23 channels** on a randomized cadence with premium generated card images — no manual content work once webhooks are pasted.

Every post includes a **uniquely rendered image card** (1024 × 576 PNG) generated server-side on the fly — dark atmospheric backgrounds, glowing hero numbers, money-stack decorations, per-post colour palettes. No two posts ever look the same.

---

## Features

- **23 Discord channels** — calls, proofs, whale tracking, VIP snipes, early access, alpha lounge, price bot, gas tracker, trending coins, live trades, alerts, announcements, market chat, general chat and 8 one-shot info channels
- **16 premium card templates** — all rendered live with `@napi-rs/canvas`
- **Unique bot names per channel** — AlphaBot, ReceiptBot, WhaleBot, SniperBot, RadarBot, etc. — a different name on every post
- **Telegram mirroring** — every Discord post is mirrored to Telegram with the card image (falls back to text if photo fails)
- **Real market data** — live prices, mcap, liquidity and volume pulled from DexScreener & CoinGecko
- **Built-in dashboard** at `/api/` — paste webhooks, toggle auto-post, test individual channels
- **Discord verify-bot** — optional ✅ reaction → role auto-grant
- **One-click Render deploy** via `render.yaml`

---

## Quick Start (local)

```bash
# 1. Install dependencies (run from repo root)
pnpm install

# 2. Build
pnpm --filter @workspace/api-server build

# 3. Start
PORT=5000 pnpm --filter @workspace/api-server start
```

Open `http://localhost:5000/api/` — this is the dashboard.

### Dev mode (build + start in one command)

```bash
PORT=5000 pnpm --filter @workspace/api-server dev
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | ✅ | Port the HTTP server listens on (e.g. `5000` locally, `10000` on Render) |
| `PUBLIC_BASE_URL` | ✅ after deploy | Full public URL (e.g. `https://discord-alpha-bot.onrender.com`) — embedded in Discord image URLs |
| `TELEGRAM_BOT_TOKEN` | optional | Token from [@BotFather](https://t.me/BotFather) — enables Telegram mirroring |
| `DISCORD_BOT_TOKEN` | optional | Bot token — enables the ✅ reaction → role auto-grant |
| `DISCORD_GUILD_ID` | optional | Your Discord server ID |
| `DISCORD_VERIFIED_ROLE_ID` | optional | Role to grant on ✅ reaction |
| `DISCORD_VERIFY_CHANNEL_ID` | optional | Channel to watch for ✅ reactions |

> Telegram mirroring and the verify-bot are fully optional. The webhook poster works without them.

---

## Deploy to Render (free tier)

1. **Push this repo to GitHub.**
2. Go to [render.com](https://render.com) → **New → Blueprint** → connect your repo.
3. Render reads `render.yaml`, creates the `discord-alpha-bot` web service, and builds it automatically.
4. Once live, set the **`PUBLIC_BASE_URL`** environment variable to your Render URL:
   ```
   https://discord-alpha-bot.onrender.com
   ```
5. Open `https://<your-app>.onrender.com/api/` and configure:
   - **Server name** — e.g. `Baldwin Calls`
   - **Your DM handle** — e.g. `@Baldwin`
   - **Discord user mention** — right-click your name → Copy User ID → paste as `<@THE_ID>`
   - **Webhook URLs** — one per channel (Discord channel → Edit → Integrations → Webhooks → New Webhook → Copy URL)
6. Toggle **Auto-post ON** — the scheduler starts posting immediately.

### Persist config across deploys

The free Render plan doesn't support disk mounts — your config resets on redeploy. To keep it:

- Upgrade to Render **Starter** ($7/mo) and uncomment the `disk:` block in `render.yaml`.
- Or manually re-paste your webhooks after each redeploy (takes ~2 minutes with the dashboard).

### Keep the service warm (free tier)

Render free tier sleeps after 15 min of inactivity. Add a free keepalive:

1. Sign up at [UptimeRobot](https://uptimerobot.com) (free).
2. **New Monitor → HTTP(s)** → URL = `https://<your-app>.onrender.com/api/ping` → Interval: 5 minutes.
3. The service stays awake 24/7.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/` | Admin dashboard |
| `GET` | `/api/ping` | Keepalive — returns `pong` |
| `GET` | `/api/healthz` | JSON health check |
| `GET` | `/api/render/:type.png?params` | Live card renderer |
| `GET/PUT` | `/api/discord/config` | Read / save config |
| `POST` | `/api/discord/test/:channel` | Force-post a single channel now |
| `POST` | `/api/discord/post-all` | Force-post all recurring channels |

### Card render templates

```
proof  call  vip  alert  whale  trade  trending
price  gas   announce  snipe  alpha  market  chat  early  info
```

Example: `GET /api/render/proof.png?ticker=DEGEN&x=37.8&entry=20600`

---

## Build commands (summary)

```bash
# Install all workspace deps
pnpm install

# Type-check only (no emit)
pnpm --filter @workspace/api-server typecheck

# Production build (outputs to artifacts/api-server/dist/)
pnpm --filter @workspace/api-server build

# Start production server
PORT=10000 pnpm --filter @workspace/api-server start

# Dev (build + start, hot for local testing)
PORT=5000 pnpm --filter @workspace/api-server dev
```

---

## Project Structure

```
/
├── render.yaml                        # Render Blueprint — one-click deploy
├── artifacts/
│   └── api-server/
│       ├── src/
│       │   ├── index.ts               # Server entrypoint
│       │   ├── app.ts                 # Express app
│       │   ├── admin/dashboard.ts     # Admin dashboard HTML
│       │   ├── discord/
│       │   │   ├── config.ts          # Config persistence (data/ dir)
│       │   │   ├── scheduler.ts       # Per-channel randomized timer
│       │   │   ├── poster.ts          # Discord webhook sender
│       │   │   ├── telegram-poster.ts # Telegram mirror (sendPhoto + fallback)
│       │   │   ├── verify-bot.ts      # Optional ✅-reaction role bot
│       │   │   ├── marketdata.ts      # DexScreener + CoinGecko + RPC
│       │   │   ├── generators/        # One generator per channel type
│       │   │   └── render/
│       │   │       ├── canvas.ts      # Drawing helpers (glow, orbs, stacks…)
│       │   │       └── templates.ts   # 16 premium card templates
│       │   └── routes/                # Express route handlers
│       ├── build.mjs                  # esbuild bundler script
│       └── data/                      # Runtime — config.json + history.json
└── README.md
```

---

## Disclaimer

This is a content-automation tool. Calls, receipts, trades and whale moves are randomised fictional content generated for community-building and entertainment purposes. Do not present the output as financial advice.
