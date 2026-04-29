import type { WebhookPayload } from "../poster";
import { renderUrl, maybeAnimatedRenderUrl } from "../poster";
import { COLORS, pick, randFloat, randInt } from "../data";
import { loadConfig } from "../config";
import { fetchMajorPrices, topByGain24h, topByVolume, fmtUsd } from "../marketdata";

const PERSONAS = [
  { name: "ZaneSnipes", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=zane" },
  { name: "Mira_DEX", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=mira" },
  { name: "blocknomad", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=block" },
  { name: "0xSerum", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=serum" },
  { name: "DegenLatte", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=latte" },
  { name: "frenchaped", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=french" },
  { name: "tinybag", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=tiny" },
  { name: "rugproof", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=rug" },
  { name: "sleeplessG", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=sleep" },
  { name: "ChainsawSol", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=chain" },
  { name: "octogem", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=octo" },
  { name: "dailyalpha", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=daily" },
];

const GENERAL_LINES = [
  "gm degens, who's printing today",
  "yall see that last call? clean entry",
  "i swear this server is the only one that posts BEFORE the pump",
  "my wife asked why im up at 3am again",
  "lmao someone pls tell newcomers to read the rules first",
  "dca'd into the last free call, already green",
  "anyone else holding from yesterday's pick?",
  "the proof channel is making me jealous fr",
  "first time in a server where calls actually hit lol",
  "still mad i faded the chsn call",
  "vip ppl be eating different",
  "moderators here actually answer, w server",
  "should i sell or hold? im up 4x already",
  "fomo'd into a green candle. pain.",
  "trading on my phone at work, dont judge",
  "anyone tracking the new narrative? feels early",
  "the discord call rooms when the alert drops are wild",
  "lurking pays off, just got my first 10x off these calls",
  "stop asking for refunds you didnt buy anything",
  "alpha rooms popping rn",
];

export async function generalChatPost(): Promise<WebhookPayload> {
  const p = pick(PERSONAS);
  return {
    username: p.name,
    avatar_url: p.avatar,
    content: pick(GENERAL_LINES),
  };
}

/**
 * Real market commentary — pulls live BTC/ETH/SOL from CoinGecko and the top
 * mover from DexScreener, then wraps it in a casual "trader take".
 */
export async function marketChatPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const p = pick(PERSONAS);

  let take = "";
  let trend: "up" | "down" = "up";

  try {
    const prices = await fetchMajorPrices();
    const btc = prices["BTC"];
    const eth = prices["ETH"];
    const sol = prices["SOL"];
    let movers: Awaited<ReturnType<typeof topByGain24h>> = [];
    try { movers = await topByGain24h(1, { minLiqUsd: 25_000 }); } catch { /* ok */ }
    const lead = movers[0];

    const candidates: Array<{ trend: "up" | "down"; line: string }> = [];
    if (btc) {
      candidates.push({
        trend: btc.change24h >= 0 ? "up" : "down",
        line: `BTC at $${btc.usd.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${signed(btc.change24h)}% 24h). ${btc.change24h >= 1 ? "Bid is back, alts about to wake up." : btc.change24h <= -1 ? "Watch your leverage — chop continues." : "Range bound, waiting on a reclaim."}`,
      });
    }
    if (eth && sol) {
      const ethSol = eth.usd / sol.usd;
      candidates.push({
        trend: sol.change24h >= eth.change24h ? "up" : "down",
        line: `eth/sol ratio at ${ethSol.toFixed(1)} — SOL ${signed(sol.change24h)}% vs ETH ${signed(eth.change24h)}% on the day. degens know where the money is going.`,
      });
    }
    if (sol) {
      candidates.push({
        trend: sol.change24h >= 0 ? "up" : "down",
        line: `SOL ${sol.change24h >= 0 ? "printing" : "bleeding"} — ${signed(sol.change24h)}% on the day, sitting at $${sol.usd.toFixed(2)}. sol micro-caps about to ${sol.change24h >= 0 ? "wake up" : "follow"}.`,
      });
    }
    if (lead) {
      candidates.push({
        trend: "up",
        line: `top mover on the radar: $${lead.symbol} on ${lead.chain}, +${lead.priceChange24h.toFixed(0)}% in 24h, sitting at ${fmtUsd(lead.marketCap)} mcap. liq ${fmtUsd(lead.liquidityUsd)}.`,
      });
    }
    if (candidates.length > 0) {
      const c = pick(candidates);
      take = c.line;
      trend = c.trend;
    }
  } catch {
    // fall through to fallback
  }

  if (!take) {
    take = `volatility crushed across majors. expect a big move within 24-48h. narrative of the day: ${pick(["AI agents", "memecoins", "DePIN", "L1 rotation", "RWA", "gaming"])}.`;
    trend = "up";
  }

  const img = await maybeAnimatedRenderUrl("market", { take, trend, server: cfg.serverName });
  return {
    username: p.name,
    avatar_url: p.avatar,
    embeds: [
      {
        color: COLORS.dark,
        description: take,
        image: { url: img },
        footer: { text: `${cfg.serverName} • market take` },
      },
    ],
  };
}

export async function trendingCoinsPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  // Real top movers — split between volume leaders and 24h gainers.
  const byVol = await topByVolume(3, { minLiqUsd: 15_000 });
  const byGain = await topByGain24h(3, { minLiqUsd: 15_000 });
  const seen = new Set<string>();
  const merged: typeof byVol = [];
  for (const t of [...byGain, ...byVol]) {
    if (seen.has(t.address)) continue;
    seen.add(t.address);
    merged.push(t);
    if (merged.length === 3) break;
  }
  const top = merged.length ? merged : byVol;

  const items = top
    .map((t) => `${t.symbol}:${(t.priceChange24h ?? 0).toFixed(1)}`)
    .join(",");
  const img = await maybeAnimatedRenderUrl("trending", { items, server: cfg.serverName });

  return {
    username: `${cfg.serverName} Trending`,
    embeds: [
      {
        color: COLORS.orange,
        title: "🔥 Trending right now",
        description: "Top movers in the last 24h across DexScreener.",
        fields: top.flatMap((t, i) => [
          {
            name: `${i + 1}. $${t.symbol}`,
            value: `${signed(t.priceChange24h)}% 24h • ${fmtUsd(t.marketCap)} mcap • ${t.chain}\n[Chart](${t.url})`,
            inline: false,
          },
        ]),
        image: { url: img },
        footer: { text: "data refreshed every 3m • DexScreener" },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

function signed(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}`;
}

// Suppress unused warnings — kept for potential future variants.
void randInt;
void randFloat;
