import type { WebhookPayload } from "../poster";
import { maybeAnimatedRenderUrl } from "../poster";
import {
  COLORS,
  pick,
  randFloat,
  randInt,
} from "../data";
import { loadConfig, dmTarget } from "../config";
import {
  pickTrending,
  topByGain24h,
  fmtUsd,
  explorerUrl,
  type RealToken,
} from "../marketdata";

/* ── Mature text pools ─────────────────────────────────────────────────────── */

const PRINTING_LINES = [
  "Still running. VIP still holding. Public just catching up.",
  "From the original call to now — this is what patience looks like.",
  "They said it was dead. Look at the chart.",
  "10x and climbing. VIP members already took profit on half.",
  "The ones who loaded at entry are printing. The ones who waited are watching.",
  "This is the difference between being first and being late.",
  "Another cycle, same result. VIP first, public later.",
  "Receipts speak louder than promises.",
];

const CHAT_QUOTES = [
  "Patience is the only edge that matters in this game.",
  "The market doesn't care about your feelings. Trade the chart.",
  "Position size yourself properly and you'll survive long enough to win.",
  "The best trades are the ones you don't take.",
  "Risk management first. Everything else follows.",
  "If you can't sleep at night, you're over-positioned.",
  "The crowd is always late. That's the entire edge.",
  "Conviction comes from research, not hopium.",
  "Stop trading based on FOMO. Start trading based on data.",
  "The chart tells you everything. Listen to it.",
  "Most people lose because they trade emotions, not setups.",
  "Wait for the setup. The market will always give you another chance.",
];

const MARKET_TAKES = [
  "Market's choppy right now. Wait for confirmation before entering. Not every dip is a buy.",
  "BTC holding the level we called. If this breaks, altcoins get punished. Stay light until we get direction.",
  "Risk-off vibes today. Cash is a position. Don't force trades in a red market.",
  "Volume picking up on BTC. When majors move, alts follow. Get positioned before the rotation.",
  "Market structure is bullish on higher timeframes. Short-term chop doesn't change the thesis.",
  "Everyone's panicking over a 5% pullback. In this market, that's a Tuesday. Stay the course.",
  "Accumulation zone right now. The smart money is loading while retail is scared. That's the setup.",
];

const VIP_TEASES_MATURE = [
  "VIP got the CA 14 minutes before this post. They're already in profit.",
  "Free chat sees the result. VIP saw the entry. That's the product.",
  "Imagine being in before the chart moved. That's what VIP gets, every cycle.",
  "The calls that move — before they move. That's the difference.",
  "Stop watching from the outside. The entry window is always first.",
  "You're seeing the aftermath. VIP got the signal at 8k mcap.",
];

export async function announcementPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);

  const announcements = [
    {
      title: "📢 Server Update",
      body: `We just added new verification channels. Make sure you're verified to access all channels. DM ${dm} if you need help.`,
    },
    {
      title: "📢 VIP Channel Update",
      body: `VIP members — we're rolling out a new format for calls. Full DexScreener cards with real-time data. You'll see the same info we see. DM ${dm} for access.`,
    },
    {
      title: "📢 Important Reminder",
      body: `This is not financial advice. Do your own research. Never invest more than you can afford to lose. We share setups and analysis — the final decision is always yours.`,
    },
    {
      title: "📢 Results Recap",
      body: `Last week's VIP calls: ${randInt(3, 8)} calls posted, ${randInt(2, 6)} hit 5x+, ${randInt(1, 3)} hit 20x+. Consistency is the product. DM ${dm} to join the next cycle.`,
    },
    {
      title: "📢 New Feature",
      body: `We're now posting wallet proof screenshots alongside every call receipt. Full transparency — you can verify every single trade on-chain.`,
    },
  ];

  const a = pick(announcements);
  const img = await maybeAnimatedRenderUrl("announce", {
    title: a.title.replace(/^📢 /, ""),
    body: a.body.slice(0, 120),
    server: cfg.serverName,
  });

  return {
    username: cfg.ownerHandle,
    embeds: [{
      color: COLORS.gold,
      title: a.title,
      description: a.body,
      image: { url: img },
      footer: { text: `${cfg.serverName} • Official Announcement` },
      timestamp: new Date().toISOString(),
    }],
  };
}

export async function joinVipPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  const recentWin = await pickTrending({ minLiqUsd: 10_000 });
  const wins = [
    `${randInt(100, 900)}x on $${recentWin.symbol}`,
    `${randInt(50, 300)}x on ${pick(["$PEPE", "$WIF", "$BONK", "$FLOKI"])}`,
    `${randInt(200, 1500)}x on ${pick(["$DEGEN", "$MOG", "$TURBO", "$MEME"])}`,
  ];

  const img = await maybeAnimatedRenderUrl("vip", {
    handle: dm,
    wins: wins.join(","),
    server: cfg.serverName,
  });

  return {
    username: cfg.ownerHandle,
    embeds: [{
      color: COLORS.vipPurple,
      title: `💎 JOIN VIP — Stop watching. Start winning.`,
      description:
        `**Recent VIP wins:**\n` +
        `🏆 ${wins[0]}\n` +
        `🏆 ${wins[1]}\n` +
        `🏆 ${wins[2]}\n\n` +
        `**What you get:**\n` +
        `→ Full CA before the public chart opens\n` +
        `→ Tracked whale wallets for copy-trade\n` +
        `→ Live entries and exits in real time\n` +
        `→ Daily alpha and narrative briefing\n` +
        `→ Wallet proof screenshots for every trade\n` +
        `→ Private VIP-only channel access\n\n` +
        `${pick(PRINTING_LINES)}\n\n` +
        `**One DM changes everything. DM ${dm} right now.**`,
      image: { url: img },
      footer: { text: `${cfg.serverName} • VIP — Limited Seats • DM ${dm}` },
      timestamp: new Date().toISOString(),
    }],
  };
}

export async function generalChatPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const quote = pick(CHAT_QUOTES);

  const img = await maybeAnimatedRenderUrl("chat", {
    quote,
    persona: pick(["anon", "whale_watcher", "degen", "alpha_hunter", "chart_reader"]),
    server: cfg.serverName,
  });

  return {
    username: cfg.ownerHandle,
    embeds: [{
      color: COLORS.dark,
      title: `💬 ${pick(["Quick thought", "Real talk", "Food for thought", "Late night alpha"])}`,
      description: quote,
      image: { url: img },
      footer: { text: `${cfg.serverName} • general-chat` },
      timestamp: new Date().toISOString(),
    }],
  };
}

export async function marketChatPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const prices = await fetchMajorPrices().catch(() => ({}));
  const btc = prices["BTC"];
  const take = pick(MARKET_TAKES);

  const img = await maybeAnimatedRenderUrl("market", {
    take,
    trend: (btc?.change24h ?? 0) >= 0 ? "up" : "down",
    server: cfg.serverName,
  });

  const priceSummary = btc
    ? `BTC: ${fmtUsd(btc.usd)} (${btc.change24h >= 0 ? "+" : ""}${btc.change24h.toFixed(2)}%)`
    : "Market data loading…";

  return {
    username: cfg.ownerHandle,
    embeds: [{
      color: COLORS.blue,
      title: `📉 Market Take`,
      description: `${take}\n\n**${priceSummary}**`,
      image: { url: img },
      footer: { text: `${cfg.serverName} • Market Chat` },
      timestamp: new Date().toISOString(),
    }],
  };
}

export async function trendingCoinsPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const movers = await topByGain24h(5, { minLiqUsd: 10_000 });
  const items = movers.slice(0, 3)
    .map(m => `${m.symbol}:+${m.priceChange24h.toFixed(1)}`)
    .join(",");

  const img = await maybeAnimatedRenderUrl("trending", { items, server: cfg.serverName });

  return {
    username: cfg.ownerHandle,
    embeds: [{
      color: COLORS.orange,
      title: "🔥 Trending Coins — Top 3 (24h)",
      description: movers.slice(0, 3)
        .map((m, i) => `**#${i + 1}** $${m.symbol} on ${m.chain} — +${m.priceChange24h.toFixed(1)}% • ${fmtUsd(m.marketCap)} mcap`)
        .join("\n"),
      image: { url: img },
      footer: { text: `${cfg.serverName} • Updated every 5m` },
      timestamp: new Date().toISOString(),
    }],
  };
}

/**
 * "Still Printing" update post — mimics the VIRTUAL CALLS style:
 * shows a token that was called earlier and is still pumping.
 * e.g. "$SPCTROLL SITTING ON 17M MCAP FROM $13K VIP CALL OUT 1600 VIP, 8X PUBLIC ACHIEVED"
 */
export async function stillPrintingPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  const t = await pickTrending({ minLiqUsd: 5_000 });

  // Entry was much earlier at a fraction of current mcap
  const entryMult = randFloat(1.5, 8, 1);
  const entryMc = Math.max(3_000, Math.round(t.marketCap / entryMult));
  const vipCount = randInt(300, 3000);
  const publicMult = Math.max(2, Math.floor(entryMult / 2));

  const img = await maybeAnimatedRenderUrl("printing", {
    ticker: t.symbol,
    mcap: String(t.marketCap),
    entryMcap: String(entryMc),
    mult: String(entryMult),
    liquidity: String(t.liquidityUsd),
    fdv: String(t.fdv || t.marketCap),
    change5m: `${(Math.random() * 10 + 1).toFixed(2)}`,
    change1h: `${(Math.random() * 50 + 5).toFixed(0)}`,
    change6h: `${(Math.random() * 200 + 50).toFixed(0)}`,
    change24h: `${(Math.random() * 2000 + 100).toFixed(0)}`,
    volume: fmtUsd(t.volume24h),
    txns: `${(10_000 + Math.floor(Math.random() * 90_000)).toLocaleString()}`,
    buyers: `${(3_000 + Math.floor(Math.random() * 15_000)).toLocaleString()}`,
    sellers: `${(500 + Math.floor(Math.random() * 5_000)).toLocaleString()}`,
    buyVol: `${(50_000 + Math.floor(Math.random() * 80_000)).toLocaleString()}`,
    sellVol: `${(5_000 + Math.floor(Math.random() * 20_000)).toLocaleString()}`,
    vipCount: String(vipCount),
    publicMult: `${publicMult}x`,
    chain: t.chain,
    dex: t.dexId,
    ca: t.address,
    server: cfg.serverName,
  });

  const caption = pick(PRINTING_LINES);

  return {
    username: cfg.ownerHandle,
    content: `@everyone`,
    allowed_mentions: { parse: ["everyone"] },
    embeds: [{
      color: COLORS.green,
      title: `🔥 STILL PRINTING — $${t.symbol}`,
      url: t.url,
      description:
        `${caption}\n\n` +
        `**Called at ${fmtUsd(entryMc)} mcap. Now sitting at ${fmtUsd(t.marketCap)}.**\n` +
        `**That's ${entryMult.toFixed(0)}x from entry. ${vipCount} VIP members, ${publicMult}x public achieved.**\n\n` +
        `VIP got the CA before anyone else. Public gets the update. That's how this works.\n\n` +
        `${pick(VIP_TEASES_MATURE)}`,
      fields: [
        { name: "📜 CA", value: "```" + t.address + "```", inline: false },
        { name: "🔗 Chart", value: `[DexScreener](${t.url})`, inline: true },
        { name: "🎯 Caller", value: dm, inline: true },
      ],
      image: { url: img },
      footer: { text: `${cfg.serverName} • VIP Printing • ${dm}` },
      timestamp: new Date().toISOString(),
    }],
  };
}

// Re-export topByGain24h for the index
export { topByGain24h };

async function fetchMajorPrices(): Promise<Record<string, { usd: number; change24h: number }>> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin,dogecoin,ripple&vs_currencies=usd&include_24hr_change=true",
    );
    if (!res.ok) return {};
    const json = await res.json();
    const map: Record<string, { usd: number; change24h: number }> = {};
    const idMap: Record<string, string> = { bitcoin: "BTC", ethereum: "ETH", solana: "SOL", binancecoin: "BNB", dogecoin: "DOGE", ripple: "XRP" };
    for (const [id, sym] of Object.entries(idMap)) {
      const v = json[id];
      if (v?.usd != null) map[sym] = { usd: v.usd, change24h: v.usd_24h_change ?? 0 };
    }
    return map;
  } catch {
    return {};
  }
}
