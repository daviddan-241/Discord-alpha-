import type { WebhookPayload } from "../poster";
import { renderUrl, maybeAnimatedRenderUrl } from "../poster";
import {
  COLORS,
  pick,
  randFloat,
  randInt,
  HYPE_LINES,
  VIP_TEASES,
} from "../data";
import { loadConfig, dmTarget } from "../config";
import {
  pickTrending,
  topByGain24h,
  fmtUsd,
  maskAddr,
  shortAddr,
  explorerUrl,
  type RealToken,
} from "../marketdata";

const CALL_NAMES   = ["Tyler 📊", "Alex Calls", "Kyle", "Marcus Drop", "Jake Signal", "Dre 🎯"];
const PROOF_NAMES  = ["Liam 🏆", "Noah Prints", "Ethan", "Oliver Wins", "Mason Receipt", "Kai 💰"];
const SNIPE_NAMES  = ["VIP Tyler", "Elite Kyle", "Inner Circle", "Apex Jake", "Private Marcus"];
const EARLY_NAMES  = ["Jake Early", "Insider Liam", "Pre-Launch", "First In Marcus", "Radar Dre"];
const TRADE_NAMES  = ["Tyler Live", "Alex Fill", "Kyle Entry", "Jake TX", "Marcus Trade"];

export async function freeCallPost(): Promise<WebhookPayload> {
  const roll = Math.random();
  if (roll < 0.4) return freeCallFull();
  if (roll < 0.7) return freeCallDripTeaser();
  return freeCallVipLocked();
}

async function freeCallFull(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  const t = await pickTrending({ minLiqUsd: 15_000, maxMcUsd: 50_000_000 });
  const callerNote = pick([
    "Smart money wallets are loading this. Chart printing higher lows on the 5m.",
    "Dev locked LP, no team allocation visible. Clean meta entry.",
    "Riding the new narrative wave. Liq deep enough for size.",
    "Bundle scan looks clean. Top holders aren't the dev.",
    "Volume building under the radar. Public hasn't found it yet.",
    "Survived the first dump. Re-entry is here.",
  ]);
  const img = await maybeAnimatedRenderUrl("call", {
    ticker: t.symbol, mc: t.marketCap, liq: t.liquidityUsd,
    chain: t.chain, dex: t.dexId, server: cfg.serverName,
  });
  const fields = [
    { name: "💎 Mcap", value: fmtUsd(t.marketCap), inline: true },
    { name: "💧 Liquidity", value: fmtUsd(t.liquidityUsd), inline: true },
    { name: "📊 24h Vol", value: fmtUsd(t.volume24h), inline: true },
    { name: "🔗 Chain", value: t.chain, inline: true },
    { name: "📡 DEX", value: t.dexId, inline: true },
    { name: "📈 24h", value: fmtChangeLine(t.priceChange24h), inline: true },
    { name: "💵 Price", value: fmtUsd(t.priceUsd), inline: true },
    { name: "⏱ Pair Age", value: t.ageMin > 0 ? humanAge(t.ageMin) : "—", inline: true },
    { name: "🎯 Entry", value: "Now / scale on dips", inline: true },
    { name: "📜 CA", value: "```" + t.address + "```", inline: false },
    { name: "🔗 Chart", value: `[DexScreener](${t.url}) • [Explorer](${explorerUrl(t)})`, inline: false },
  ];
  return {
    username: pick(CALL_NAMES),
    embeds: [{
      color: COLORS.emerald,
      title: `📊 NEW CALL — $${t.symbol}`,
      url: t.url,
      description:
        `${callerNote}\n\n` +
        `${pick(VIP_TEASES)}\n\n` +
        `> _Public call. VIP got this **${randInt(8, 35)} minutes earlier** — DM ${dm} for the upgrade._`,
      fields,
      image: { url: img },
      footer: { text: `${cfg.serverName} • Free Calls • not financial advice` },
      timestamp: new Date().toISOString(),
    }],
  };
}

async function freeCallDripTeaser(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  const t = await pickTrending({ minLiqUsd: 10_000, maxMcUsd: 30_000_000 });
  const minsAgo = randInt(12, 55);
  const entryMult = randFloat(2, 6, 1);
  const vipMc = Math.max(1000, Math.round(t.marketCap / entryMult));
  const img = await maybeAnimatedRenderUrl("call", {
    ticker: t.symbol, mc: vipMc, liq: t.liquidityUsd,
    chain: t.chain, dex: t.dexId, server: cfg.serverName,
  });
  return {
    username: pick(CALL_NAMES),
    embeds: [{
      color: COLORS.gold,
      title: `👀 Watching — $${t.symbol}`,
      url: t.url,
      description:
        `Dripping this for the free chat. Already running on ${t.chain}.\n\n` +
        `**VIP entry:** ${fmtUsd(vipMc)} mcap • posted ${minsAgo}m ago\n` +
        `**Now:** ${fmtUsd(t.marketCap)} mcap (~${entryMult.toFixed(1)}x already)\n` +
        `**Chain:** ${t.chain} • **DEX:** ${t.dexId}\n\n` +
        `CA half-shown for free. Full CA + entry timing went out in VIP earlier.`,
      fields: [
        { name: "📜 CA (partial)", value: "```" + maskAddr(t.address) + "```", inline: false },
        { name: "📊 24h", value: fmtChangeLine(t.priceChange24h), inline: true },
        { name: "💧 Liq", value: fmtUsd(t.liquidityUsd), inline: true },
        { name: "🚪 Want it earlier?", value: `DM ${dm}`, inline: true },
        { name: "🔗 Chart", value: `[DexScreener](${t.url})`, inline: false },
      ],
      image: { url: img },
      footer: { text: `${cfg.serverName} • Drip from VIP` },
      timestamp: new Date().toISOString(),
    }],
  };
}

async function freeCallVipLocked(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  const t = await pickTrending({ minLiqUsd: 8_000, maxMcUsd: 5_000_000 });
  const masked = `$${t.symbol.slice(0, 2)}•••••`;
  const img = await maybeAnimatedRenderUrl("snipe", {
    ticker: t.symbol, mc: t.marketCap,
    handle: dmTarget(cfg), server: cfg.serverName,
  });
  return {
    username: pick(SNIPE_NAMES),
    embeds: [{
      color: COLORS.vipPurple,
      title: `🔒 VIP-ONLY CALL — ${masked}`,
      description:
        `**This one is locked to VIP.** Free chat sees the wrapper, VIP got the entry.\n\n` +
        `Why we're not posting it here:\n` +
        `• Liquidity is thin — public alpha would move the price against members.\n` +
        `• Caller wants VIP to fill before the chart wakes up.\n\n` +
        `Receipt will drop in 🏆 **proof-results** once we trim.`,
      fields: [
        { name: "🔗 Chain", value: t.chain, inline: true },
        { name: "💎 Entry MC", value: fmtUsd(t.marketCap), inline: true },
        { name: "🔓 Unlock", value: `DM ${dm}`, inline: true },
      ],
      image: { url: img },
      footer: { text: "VIP only • Free preview" },
      timestamp: new Date().toISOString(),
    }],
  };
}

export async function proofResultsPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  const winners = await topByGain24h(8, { minLiqUsd: 10_000 });
  const t = winners[Math.floor(Math.random() * Math.min(winners.length, 5))] ?? (await pickTrending());
  const pct = Math.max(40, t.priceChange24h);
  const x = Number((1 + pct / 100).toFixed(1));
  const entryMc = Math.max(8_000, Math.round(t.marketCap / x));
  const pnlInvested = randInt(500, 4000);
  const pnlOut = Math.round(pnlInvested * x);
  const img = await maybeAnimatedRenderUrl("proof", {
    ticker: t.symbol, x: x, entry: entryMc, server: cfg.serverName,
    handle: dmTarget(cfg),
  });
  return {
    username: pick(PROOF_NAMES),
    embeds: [{
      color: COLORS.gold,
      title: `🏆 $${t.symbol} hit ${x}x`,
      url: t.url,
      description:
        `Called at **${fmtUsd(entryMc)}** mcap. Now sitting at **${fmtUsd(t.marketCap)}** on ${t.chain}.\n\n` +
        `**Position PnL** — $${pnlInvested.toLocaleString()} → $${pnlOut.toLocaleString()}\n\n` +
        `${pick(HYPE_LINES)}\n\n` +
        `> Want to be on the next one? DM ${dm}.`,
      fields: [
        { name: "📊 24h", value: fmtChangeLine(t.priceChange24h), inline: true },
        { name: "💧 Liq", value: fmtUsd(t.liquidityUsd), inline: true },
        { name: "📜 CA", value: "```" + t.address + "```", inline: false },
        { name: "🔗 Chart", value: `[DexScreener](${t.url}) • [Explorer](${explorerUrl(t)})`, inline: false },
      ],
      image: { url: img },
      footer: { text: `${cfg.serverName} • Receipts` },
      timestamp: new Date().toISOString(),
    }],
  };
}

export async function vipSnipePost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  const t = await pickTrending({ minLiqUsd: 8_000, maxMcUsd: 8_000_000 });
  const fillSizeUnit = t.chain === "Solana" ? "SOL" : t.chain === "Ethereum" ? "ETH" : "tokens";
  const fillSize = t.chain === "Solana" ? randFloat(2, 18, 2) : randFloat(0.2, 4, 2);
  const img = await maybeAnimatedRenderUrl("snipe", {
    ticker: t.symbol, mc: t.marketCap,
    handle: dm, server: cfg.serverName,
  });
  return {
    username: pick(SNIPE_NAMES),
    embeds: [{
      color: COLORS.vipPurple,
      title: `💎 VIP SNIPE — Filled @ ${fmtUsd(t.marketCap)}`,
      description:
        `One of our VIP wallets just filled an early bag.\n\n` +
        `> **CA:** \`${maskAddr(t.address)}\`  *(unlocked in VIP)*\n` +
        `> **Chain:** ${t.chain}\n` +
        `> **DEX:** ${t.dexId}\n` +
        `> **Fill size:** ${fillSize} ${fillSizeUnit} avg\n` +
        `> **Ticker:** $${t.symbol.slice(0, 2)}•••\n\n` +
        `_Receipt drops in 🏆 proof-results once we trim._\n\n` +
        `Tired of seeing the blur? DM ${dm}.`,
      image: { url: img },
      footer: { text: "VIP only • Public preview" },
      timestamp: new Date().toISOString(),
    }],
  };
}

export async function earlyAccessPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  let t: RealToken;
  try {
    t = await pickTrending({ maxAgeMin: 60 * 24, minLiqUsd: 8_000, maxMcUsd: 5_000_000 });
  } catch {
    t = await pickTrending({ minLiqUsd: 8_000, maxMcUsd: 8_000_000 });
  }
  const lead = randInt(8, 45);
  const ageStr = t.ageMin > 0 ? humanAge(t.ageMin) : "fresh";
  const img = await maybeAnimatedRenderUrl("early", {
    ticker: t.symbol, lead: lead, handle: dm, server: cfg.serverName,
  });
  return {
    username: pick(EARLY_NAMES),
    embeds: [{
      color: COLORS.cyan,
      title: `🚀 Early Access — $${t.symbol} watchlist`,
      url: t.url,
      description:
        `On the VIP radar **${lead} minutes before** the public chart wakes up.\n\n` +
        `Why we're watching:\n` +
        `• Smart-money cluster forming on ${t.chain}\n` +
        `• Pair age: ${ageStr} — caller likes the entry timing\n` +
        `• Liq: ${fmtUsd(t.liquidityUsd)} • 24h vol: ${fmtUsd(t.volume24h)}\n\n` +
        `${pick(VIP_TEASES)}\n` +
        `DM ${dm} to unlock the CA.`,
      fields: [
        { name: "💎 Mcap", value: fmtUsd(t.marketCap), inline: true },
        { name: "📈 1h", value: fmtChangeLine(t.priceChange1h), inline: true },
        { name: "📊 24h", value: fmtChangeLine(t.priceChange24h), inline: true },
      ],
      image: { url: img },
      footer: { text: `${cfg.serverName} • Early Access` },
      timestamp: new Date().toISOString(),
    }],
  };
}

export async function liveTradePost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const t = await pickTrending({ minLiqUsd: 10_000 });
  const direction = pick(["BUY", "BUY", "TRIM", "EXIT"] as const);
  const sizeUnit = t.chain === "Solana" ? "SOL" : t.chain === "Ethereum" ? "ETH" : "USD";
  const size = sizeUnit === "USD" ? randFloat(500, 8000, 0) : randFloat(0.5, 25, 2);
  const usd =
    sizeUnit === "SOL"
      ? Math.round(size * randInt(140, 220))
      : sizeUnit === "ETH"
      ? Math.round(size * randInt(2400, 4400))
      : Math.round(size);
  const wallet = randomWalletShort(t.chainId);
  const color =
    direction === "BUY" ? COLORS.green : direction === "TRIM" ? COLORS.gold : COLORS.red;
  const emoji = direction === "BUY" ? "🟢" : direction === "TRIM" ? "🟡" : "🔴";
  const img = await maybeAnimatedRenderUrl("trade", {
    ticker: t.symbol, direction,
    size: `${size} ${sizeUnit}`, usd: `$${usd.toLocaleString()}`,
    wallet, server: cfg.serverName,
  });
  return {
    username: pick(TRADE_NAMES),
    embeds: [{
      color,
      title: `${emoji} ${direction} — $${t.symbol}`,
      url: t.url,
      description:
        `Wallet \`${wallet}\` ${verb(direction)} on ${t.chain}.\n\n` +
        `**Size:** ${size} ${sizeUnit} (~$${usd.toLocaleString()})`,
      fields: [
        { name: "💎 Mcap", value: fmtUsd(t.marketCap), inline: true },
        { name: "💧 Liq", value: fmtUsd(t.liquidityUsd), inline: true },
        { name: "📊 24h", value: fmtChangeLine(t.priceChange24h), inline: true },
        { name: "📜 CA", value: "```" + t.address + "```", inline: false },
        { name: "🔗 Chart", value: `[DexScreener](${t.url}) • [Explorer](${explorerUrl(t)})`, inline: false },
        { name: "Caller", value: cfg.ownerHandle, inline: true },
        { name: "Tag", value: direction === "BUY" ? "fresh entry" : "manage risk", inline: true },
      ],
      image: { url: img },
      footer: { text: `${cfg.serverName} • Live Trades` },
      timestamp: new Date().toISOString(),
    }],
  };
}

function verb(d: "BUY" | "TRIM" | "EXIT"): string {
  if (d === "BUY") return "filled";
  if (d === "TRIM") return "trimmed";
  return "exited";
}

function fmtChangeLine(pct: number): string {
  if (!Number.isFinite(pct)) return "—";
  const sign = pct >= 0 ? "+" : "";
  const emoji = pct >= 0 ? "🟢" : "🔴";
  return `${emoji} ${sign}${pct.toFixed(2)}%`;
}

function humanAge(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.round(min / 60);
  if (h < 48) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

function randomWalletShort(chainId: string): string {
  const isSol = chainId.toLowerCase() === "solana";
  const chars = isSol
    ? "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789"
    : "0123456789abcdef";
  const len = isSol ? 4 : 4;
  let head = isSol ? "" : "0x";
  let tail = "";
  for (let i = 0; i < len; i++) head += chars[Math.floor(Math.random() * chars.length)];
  for (let i = 0; i < 4; i++) tail += chars[Math.floor(Math.random() * chars.length)];
  return shortAddr(`${head}${"0".repeat(isSol ? 36 : 32)}${tail}`);
}
