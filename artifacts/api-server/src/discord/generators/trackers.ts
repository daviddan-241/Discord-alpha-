import type { WebhookPayload } from "../poster";
import { renderUrl, maybeAnimatedRenderUrl } from "../poster";

import { COLORS, pick, randFloat, randInt } from "../data";
import { loadConfig, dmTarget } from "../config";
import {
  pickTrending,
  topByGain1h,
  topByGain24h,
  fetchMajorPrices,
  fetchGas,
  baseGasGwei,
  solanaAvgFee,
  fmtUsd,
  shortAddr,
  explorerUrl,
} from "../marketdata";

const WHALE_NAMES   = ["WhaleBot", "OnChainBot", "WalletAlert", "DeepScan", "TrackBot"];
const PRICE_NAMES   = ["PriceOracle", "SpotBot", "MarketBot", "PriceTrack", "LivePrices"];
const GAS_NAMES     = ["GasOracle", "FeeBot", "GasTrack", "NetBot", "ChainFees"];
const ALERT_NAMES   = ["AlertBot", "BreakingBot", "SignalAlert", "ScanAlert", "RadarAlert"];
const TRENDING_NAMES = ["TrendBot", "HotList", "DexScan", "MoverBot", "TopGains"];

const WHALE_TAGS = [
  "Smart Money #1",
  "Solana Sniper Wallet",
  "Insider 0x42",
  "Top1 PnL (7d)",
  "Memecoin OG",
  "MEV bundler",
  "Cabal wallet",
  "Anon Whale 🐋",
  "Top Trader of the day",
];

function randomWallet(chain: string): string {
  const isSol = chain === "Solana";
  const chars = isSol
    ? "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789"
    : "0123456789abcdef";
  const len = isSol ? 44 : 40;
  let out = isSol ? "" : "0x";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function whaleTrackerPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const t = await pickTrending({ minLiqUsd: 10_000 });
  const wallet = randomWallet(t.chain);
  const action = pick([
    "bought",
    "added",
    "rotated into",
    "took profit on",
    "fully exited",
  ] as const);
  const isExit = action === "fully exited" || action === "took profit on";
  const sizeUnit = t.chain === "Solana" ? "SOL" : "ETH";
  const size = sizeUnit === "SOL" ? randFloat(15, 800, 2) : randFloat(0.5, 40, 2);
  const usd = sizeUnit === "SOL"
    ? Math.round(size * randInt(140, 220))
    : Math.round(size * randInt(2400, 4400));
  const tag = pick(WHALE_TAGS);
  const img = await maybeAnimatedRenderUrl("whale", {
    action: action.toUpperCase(), ticker: t.symbol,
    wallet: shortAddr(wallet), size: `${size} ${sizeUnit}`,
    usd: `$${usd.toLocaleString()}`, tag, server: cfg.serverName,
  });
  return {
    username: pick(WHALE_NAMES),
    embeds: [{
      color: isExit ? COLORS.red : COLORS.green,
      title: `🐋 Whale ${action} $${t.symbol}`,
      url: t.url,
      description: `**${tag}** \`${shortAddr(wallet)}\` ${action} on ${t.chain}.`,
      fields: [
        { name: "Size", value: `${size} ${sizeUnit}  (~$${usd.toLocaleString()})`, inline: true },
        { name: "Token Mcap", value: fmtUsd(t.marketCap), inline: true },
        { name: "Token Liq", value: fmtUsd(t.liquidityUsd), inline: true },
        { name: "📜 CA", value: "```" + t.address + "```", inline: false },
        { name: "🔗 Chart", value: `[DexScreener](${t.url}) • [Explorer](${explorerUrl(t)})`, inline: false },
      ],
      image: { url: img },
      footer: { text: "tracking 1,200+ wallets" },
      timestamp: new Date().toISOString(),
    }],
  };
}

export async function priceBotPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const prices = await fetchMajorPrices();

  const get = (sym: string) => prices[sym];
  const btc = get("BTC");
  const eth = get("ETH");
  const sol = get("SOL");
  const bnb = get("BNB");
  const doge = get("DOGE");
  const xrp = get("XRP");

  const items = [
    btc && `BTC:${btc.usd.toFixed(0)}:${btc.change24h >= 0 ? "+" : ""}${btc.change24h.toFixed(2)}`,
    eth && `ETH:${eth.usd.toFixed(0)}:${eth.change24h >= 0 ? "+" : ""}${eth.change24h.toFixed(2)}`,
    sol && `SOL:${sol.usd.toFixed(2)}:${sol.change24h >= 0 ? "+" : ""}${sol.change24h.toFixed(2)}`,
    bnb && `BNB:${bnb.usd.toFixed(0)}:${bnb.change24h >= 0 ? "+" : ""}${bnb.change24h.toFixed(2)}`,
    doge && `DOGE:${doge.usd.toFixed(4)}:${doge.change24h >= 0 ? "+" : ""}${doge.change24h.toFixed(2)}`,
    xrp && `XRP:${xrp.usd.toFixed(3)}:${xrp.change24h >= 0 ? "+" : ""}${xrp.change24h.toFixed(2)}`,
  ].filter(Boolean).join(",");

  const fmtField = (p: { usd: number; change24h: number } | undefined, decimals: number) => {
    if (!p) return "—";
    const arrow = p.change24h >= 0 ? "🟢 +" : "🔴 ";
    return `$${p.usd.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}\n${arrow}${p.change24h.toFixed(2)}% 24h`;
  };

  const img = await maybeAnimatedRenderUrl("price", { items, server: cfg.serverName });
  return {
    username: pick(PRICE_NAMES),
    embeds: [{
      color: COLORS.blue,
      title: "📊 Live prices",
      description: "Spot prices from CoinGecko — refreshed every minute.",
      fields: [
        { name: "BTC", value: fmtField(btc, 0), inline: true },
        { name: "ETH", value: fmtField(eth, 0), inline: true },
        { name: "SOL", value: fmtField(sol, 2), inline: true },
        { name: "BNB", value: fmtField(bnb, 0), inline: true },
        { name: "DOGE", value: fmtField(doge, 4), inline: true },
        { name: "XRP", value: fmtField(xrp, 3), inline: true },
      ],
      image: { url: img },
      footer: { text: "live data • CoinGecko" },
      timestamp: new Date().toISOString(),
    }],
  };
}

export async function gasTrackerPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const ethGas = await fetchGas();
  const baseGwei = await baseGasGwei();
  const solFee = solanaAvgFee();
  const ethGwei = ethGas.standard;
  const tag =
    ethGwei < 12 ? "🟢 dirt cheap" : ethGwei < 35 ? "🟡 normal" : "🔴 expensive";
  const img = await maybeAnimatedRenderUrl("gas", {
    eth: `${ethGwei} gwei`, base: `${baseGwei} gwei`,
    sol: `${solFee.toFixed(6)} SOL`, server: cfg.serverName,
  });
  return {
    username: pick(GAS_NAMES),
    embeds: [{
      color: ethGwei < 12 ? COLORS.green : ethGwei < 35 ? COLORS.gold : COLORS.red,
      title: "⛽ Gas tracker",
      description: "Live ETH gas + Base + Solana fees.",
      fields: [
        {
          name: "Ethereum",
          value: `Slow: ${ethGas.slow} gwei\nStd: ${ethGas.standard} gwei\nFast: ${ethGas.fast} gwei\n${tag}`,
          inline: true,
        },
        { name: "Base", value: `${baseGwei} gwei\n🟢 cheap`, inline: true },
        { name: "Solana", value: `${solFee.toFixed(6)} SOL avg\n🟢 spammable`, inline: true },
      ],
      image: { url: img },
      footer: { text: "ethgas.watch • live" },
      timestamp: new Date().toISOString(),
    }],
  };
}

export async function alertsPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);

  const variants: Array<() => Promise<{ title: string; desc: string; color: number }>> = [
    async () => {
      const movers = await topByGain1h(3, { minLiqUsd: 15_000 });
      const top = movers[0];
      const lines = movers
        .map((m, i) => `**${i + 1}.** $${m.symbol} on ${m.chain} — ${signed(m.priceChange1h)}% (1h) • ${fmtUsd(m.marketCap)} mcap`)
        .join("\n");
      return {
        title: "📡 ALERT — Movers heating up (1h)",
        desc:
          `${lines || "Scanner just refreshed. Loading…"}\n\n` +
          (top ? `Public chart will catch up in ~${randInt(15, 90)} minutes.\n\n` : "") +
          `Want the entry before everyone else? DM ${dm}.`,
        color: COLORS.pink,
      };
    },
    async () => {
      const t = await pickTrending({ minLiqUsd: 8_000, maxMcUsd: 3_000_000 });
      return {
        title: "📡 ALERT — Liquidity unlock incoming",
        desc:
          `**$${t.symbol}** on ${t.chain} — sitting at ${fmtUsd(t.liquidityUsd)} liq, ${fmtUsd(t.marketCap)} mcap.\n\n` +
          `Either rocket or rug — VIP is positioned either way.`,
        color: COLORS.orange,
      };
    },
    async () => ({
      title: "📡 ALERT — Stop bleeding",
      desc:
        `If you're sitting in red bags, post in 💬 general-chat. Mods will look at the chart.\n` +
        `Don't average down on dying coins. Rotate to the live calls.`,
      color: COLORS.red,
    }),
    async () => {
      const t = await pickTrending({ minLiqUsd: 8_000, maxMcUsd: 6_000_000 });
      return {
        title: "📡 ALERT — VIP just got fed",
        desc:
          `New VIP-only call just dropped. Public preview in 💎 vip-snipes.\n` +
          `**Hint:** ${t.chain} • ${fmtUsd(t.marketCap)} mcap entry.\n` +
          `${randInt(8, 22)} VIP members already filled.\n\n` +
          `DM ${dm} to be on the next one in time.`,
        color: COLORS.vipPurple,
      };
    },
  ];

  const v = await pick(variants)();
  const img = await maybeAnimatedRenderUrl("alert", {
    title: v.title.replace(/^📡 ALERT — /, "").slice(0, 40),
    body: v.desc.slice(0, 120),
    server: cfg.serverName,
  });
  return {
    username: pick(ALERT_NAMES),
    embeds: [{
      color: v.color,
      title: v.title,
      description: v.desc,
      image: { url: img },
      footer: { text: `${cfg.serverName} • Alerts` },
      timestamp: new Date().toISOString(),
    }],
  };
}

export async function trendingPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const movers = await topByGain24h(5, { minLiqUsd: 10_000 });
  const items = movers.slice(0, 3)
    .map(m => `${m.symbol}:+${m.priceChange24h.toFixed(1)}`)
    .join(",");
  const img = await maybeAnimatedRenderUrl("trending", { items, server: cfg.serverName });
  return {
    username: pick(TRENDING_NAMES),
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

function signed(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}`;
}

export { topByGain24h };
