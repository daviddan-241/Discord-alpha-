# Discord Alpha Bot

Auto-poster for the **Apex Alpha** crypto-call Discord server. Drives 19 channels
on a schedule with realistic-looking calls, proofs, whale tracking, alerts, VIP
sales pushes, market chat, gas/price tickers, alpha lounge briefs and more.

Every post embeds a **freshly rendered, unique image** generated server-side
with `@napi-rs/canvas` — no static assets, every receipt is one-of-one.

---

## How it works

1. You run this server (locally, on Render, anywhere).
2. You open the dashboard at `/api/` and paste your Discord webhook URLs (one
   per channel) + your VIP DM handle (`@you`) + the public base URL.
3. The scheduler ticks every minute and decides whether each channel should
   post based on its cadence.
4. For each post the generator:
   - Builds a randomized embed (text, fields, footer, etc).
   - Builds a `image: { url: "${PUBLIC_BASE_URL}/api/render/<type>.png?…&seed=…" }`
     URL.
   - Sends it to your Discord webhook.
5. Discord fetches that URL, hits this server, the canvas renderer paints a
   one-time PNG, sends it back. Discord caches it forever.

Result: no two posts ever share an image, and there is **no manual content work**
once webhooks are pasted.

---

## Channels covered (19)

Calls / Proofs:
- `📊 free-calls`, `🏆 proof-results`, `💎 vip-snipes`, `🚀 early-access`,
  `📈 live-trades`

Market trackers:
- `🐋 whale-tracker`, `📊 price-bot`, `⛽ gas-tracker`, `🔥 trending-coins`

Alerts / Sales:
- `📡 alerts`, `💎 join-apex-vip`, `📢 apex-announcements`

Alpha + chat:
- `🧠 alpha-lounge`, `💬 general-chat`, `📈 market-chat`

Info (one-shot on first run):
- `👋 welcome`, `📜 rules`, `✅ get-verified`, `🤖 bot-commands`

---

## Local dev

```bash
pnpm install
pnpm --filter @workspace/api-server build
pnpm --filter @workspace/api-server start
```

Then open `http://localhost:8081/api/` (or whichever port the workspace assigns).

---

## Deploy to Render

1. Push this repo to GitHub.
2. On render.com → **New → Blueprint** → point at this repo.
3. Render reads `render.yaml`, creates the web service, builds it.
4. Once live, set the env var **`PUBLIC_BASE_URL`** to your render URL,
   e.g. `https://discord-alpha-bot.onrender.com`. (This is what gets
   embedded in image URLs sent to Discord.)
5. Open `https://<your-app>.onrender.com/api/` and paste:
   - Owner DM handle (e.g. `@apex_owner`)
   - Server name
   - One Discord webhook URL per channel (right-click the channel → Edit
     Channel → Integrations → Webhooks → New Webhook → Copy URL)
6. Toggle **Auto-post** on. The scheduler will start posting on its cadence.

### Keep it warm

Render free tier sleeps after 15 min of inactivity. Use
[UptimeRobot](https://uptimerobot.com) (free) → **New Monitor → HTTP(s)** →
URL = `https://<your-app>.onrender.com/api/ping` → 5 min interval. The bot
will never sleep.

---

## Endpoints

| Path | What it does |
|---|---|
| `GET  /api/`                       | Admin dashboard (paste webhooks + toggle auto-post) |
| `GET  /api/ping`                   | UptimeRobot keepalive |
| `GET  /api/healthz`                | JSON health |
| `GET  /api/render/:type.png`       | Dynamic PNG renderer (called by Discord) |
| `POST /api/discord/test/:channel`  | Force-post a single channel right now |
| `POST /api/discord/post-all`       | Force-post one of every channel |
| `GET/PUT /api/discord/config`      | Read / save config (webhooks, handle…) |

Render template types: `proof, call, vip, alert, whale, trade, trending,
price, gas, announce, snipe, alpha, market, chat, early, info`.

---

## Disclaimer

This is a content-automation tool. Calls, receipts, trades and whale moves
are randomized fictional content for entertainment / community-building
purposes. Don't sell the output as financial advice.
