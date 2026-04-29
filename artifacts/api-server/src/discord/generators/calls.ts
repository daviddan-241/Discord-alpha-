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
    "Been watching this since the liq was thin. Smart money has been loading quietly — chart is coiling.",
    "Dev locked LP, no team wallet visible. Bundle scan clean. This is the kind of setup I like.",
    "Riding the current narrative. Volume building below the radar, public hasn't found it yet.",
    "Survived the first dump and held the level. Re-entry is right here — this is where I'm sized in.",
    "On-chain data confirms accumulation. KOLs haven't posted yet — that's the window.",
    "Risk/reward here is clean. I'm in. Not telling free chat to size heavy but this is a real one.",
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
    username: cfg.ownerHandle,
    embeds: [{
      color: COLORS.emerald,
      title: `📊 NEW CALL — $${t.symbol}`,
      url: t.url,
      description:
        `${callerNote}\n\n` +
        `${pick(VIP_TEASES)}\n\n` +
        `> 🔒 _VIP got the alert **${randInt(10, 40)} minutes before** this post. DM ${dm} if you want the early entry next time._`,
      fields,
      image: { url: img },
      footer: { text: `${cfg.serverName} • Called by ${dm} • not financial advice` },
      timestamp: new Date().toISOString(),
    }],
  };
}

async function freeCallDripTeaser(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  const t = await pickTrending({ minLiqUsd: 10_000, maxMcUsd: 30_000_000 });
  const minsAgo = randInt(15, 60);
  const entryMult = randFloat(2.5, 8, 1);
  const vipMc = Math.max(1000, Math.round(t.marketCap / entryMult));
  const img = await maybeAnimatedRenderUrl("call", {
    ticker: t.symbol, mc: vipMc, liq: t.liquidityUsd,
    chain: t.chain, dex: t.dexId, server: cfg.serverName,
  });
  return {
    username: cfg.ownerHandle,
    embeds: [{
      color: COLORS.gold,
      title: `👀 Already running — $${t.symbol}`,
      url: t.url,
      description:
        `Dropping this for free chat so you can see what you missed.\n\n` +
        `**VIP entry:** ${fmtUsd(vipMc)} mcap • posted ${minsAgo}m ago\n` +
        `**Now:** ${fmtUsd(t.marketCap)} mcap — that's **${entryMult.toFixed(1)}x already**\n` +
        `**Chain:** ${t.chain} • **DEX:** ${t.dexId}\n\n` +
        `Full CA + exact entry timing went to VIP first. I'm showing you half the address so you can verify it's real.\n\n` +
        `This is what every single call looks like inside VIP — before it moves.`,
      fields: [
        { name: "📜 CA (partial)", value: "```" + maskAddr(t.address) + "```", inline: false },
        { name: "📊 24h", value: fmtChangeLine(t.priceChange24h), inline: true },
        { name: "💧 Liq", value: fmtUsd(t.liquidityUsd), inline: true },
        { name: "🚪 Want in early next time?", value: `DM ${dm}`, inline: true },
        { name: "🔗 Chart", value: `[DexScreener](${t.url})`, inline: false },
      ],
      image: { url: img },
      footer: { text: `${cfg.serverName} • Called by ${dm} — drip from VIP` },
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
    handle: dm, server: cfg.serverName,
  });
  return {
    username: cfg.ownerHandle,
    embeds: [{
      color: COLORS.vipPurple,
      title: `🔒 VIP CALL — ${masked} (locked)`,
      description:
        `**This call is VIP only. You're seeing the wrapper — members already filled.**\n\n` +
        `Why I'm not posting the full CA here:\n` +
        `• Liquidity is thin. Public alpha moves the price against my members.\n` +
        `• I sent this to VIP first so they could load before the chart wakes up.\n\n` +
        `The receipt will land in 🏆 **proof-results** once we trim.\n\n` +
        `**This is what VIP looks like.** Every call, every entry, before everyone else.\n` +
        `To get in → DM ${dm}`,
      fields: [
        { name: "🔗 Chain", value: t.chain, inline: true },
        { name: "💎 Entry MC", value: fmtUsd(t.marketCap), inline: true },
        { name: "🔓 Unlock access", value: `DM ${dm}`, inline: true },
      ],
      image: { url: img },
      footer: { text: `${cfg.serverName} • VIP only • Free preview` },
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
    handle: dm,
  });
  return {
    username: cfg.ownerHandle,
    embeds: [{
      color: COLORS.gold,
      title: `🏆 $${t.symbol} — ${x}x ✅`,
      url: t.url,
      description:
        `Called at **${fmtUsd(entryMc)}** mcap. Sitting at **${fmtUsd(t.marketCap)}** on ${t.chain} right now.\n\n` +
        `**My position:** $${pnlInvested.toLocaleString()} in → $${pnlOut.toLocaleString()} out\n\n` +
        `${pick(HYPE_LINES)}\n\n` +
        `VIP got this alert before the public chart even blinked. This is not luck — this is the process.\n\n` +
        `> If you want to be on the next one from the entry → DM ${dm}.`,
      fields: [
        { name: "📊 24h", value: fmtChangeLine(t.priceChange24h), inline: true },
        { name: "💧 Liq", value: fmtUsd(t.liquidityUsd), inline: true },
        { name: "📜 CA", value: "```" + t.address + "```", inline: false },
        { name: "🔗 Chart", value: `[DexScreener](${t.url}) • [Explorer](${explorerUrl(t)})`, inline: false },
      ],
      image: { url: img },
      footer: { text: `${cfg.serverName} • Receipts by ${dm}` },
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
    username: cfg.ownerHandle,
    embeds: [{
      color: COLORS.vipPurple,
      title: `💎 VIP SNIPE — Filled @ ${fmtUsd(t.marketCap)}`,
      description:
        `Just filled a bag. VIP got the full CA and I'm in.\n\n` +
        `> **CA:** \`${maskAddr(t.address)}\`  *(full CA inside VIP)*\n` +
        `> **Chain:** ${t.chain}\n` +
        `> **DEX:** ${t.dexId}\n` +
        `> **My fill:** ${fillSize} ${fillSizeUnit}\n` +
        `> **Ticker:** $${t.symbol.slice(0, 2)}•••\n\n` +
        `The receipt drops in 🏆 proof-results once I trim. Every single time.\n\n` +
        `You're still watching from the outside. DM ${dm} and that changes today.`,
      image: { url: img },
      footer: { text: `${cfg.serverName} • VIP snipes by ${dm}` },
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
  const lead = randInt(10, 50);
  const ageStr = t.ageMin > 0 ? humanAge(t.ageMin) : "brand new";
  const img = await maybeAnimatedRenderUrl("early", {
    ticker: t.symbol, lead: lead, handle: dm, server: cfg.serverName,
  });
  return {
    username: cfg.ownerHandle,
    embeds: [{
      color: COLORS.cyan,
      title: `🚀 Early Radar — $${t.symbol}`,
      url: t.url,
      description:
        `On my radar **${lead} minutes before** the public chart wakes up.\n\n` +
        `Why I'm watching this:\n` +
        `• Smart-money cluster forming on ${t.chain} — I'm tracking the wallets\n` +
        `• Pair is ${ageStr} old — early enough that the multiple is still there\n` +
        `• Liq: ${fmtUsd(t.liquidityUsd)} • 24h vol: ${fmtUsd(t.volume24h)}\n\n` +
        `${pick(VIP_TEASES)}\n\n` +
        `CA goes to VIP first. DM ${dm} to unlock.`,
      fields: [
        { name: "💎 Mcap", value: fmtUsd(t.marketCap), inline: true },
        { name: "📈 1h", value: fmtChangeLine(t.priceChange1h), inline: true },
        { name: "📊 24h", value: fmtChangeLine(t.priceChange24h), inline: true },
      ],
      image: { url: img },
      footer: { text: `${cfg.serverName} • Early Access by ${dm}` },
      timestamp: new Date().toISOString(),
    }],
  };
}

export async function liveTradePost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
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
    username: cfg.ownerHandle,
    embeds: [{
      color,
      title: `${emoji} ${direction} — $${t.symbol}`,
      url: t.url,
      description:
        `Wallet \`${wallet}\` just ${verb(direction)} on ${t.chain}.\n\n` +
        `**Size:** ${size} ${sizeUnit} (~$${usd.toLocaleString()})`,
      fields: [
        { name: "💎 Mcap", value: fmtUsd(t.marketCap), inline: true },
        { name: "💧 Liq", value: fmtUsd(t.liquidityUsd), inline: true },
        { name: "📊 24h", value: fmtChangeLine(t.priceChange24h), inline: true },
        { name: "📜 CA", value: "```" + t.address + "```", inline: false },
        { name: "🔗 Chart", value: `[DexScreener](${t.url}) • [Explorer](${explorerUrl(t)})`, inline: false },
        { name: "Caller", value: dm, inline: true },
        { name: "Tag", value: direction === "BUY" ? "fresh entry" : "manage risk", inline: true },
      ],
      image: { url: img },
      footer: { text: `${cfg.serverName} • Live Trades by ${dm}` },
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
