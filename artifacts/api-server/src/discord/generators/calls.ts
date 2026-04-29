import type { WebhookPayload } from "../poster";
import { maybeAnimatedRenderUrl } from "../poster";
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
  const img = await maybeAnimatedRenderUrl("call", {
    ticker: t.symbol, mc: t.marketCap, liq: t.liquidityUsd,
    chain: t.chain, dex: t.dexId, server: cfg.serverName,
  });
  const callerNote = pick([
    `Been watching this for days. Smart money has been silently accumulating — chart is coiling like a spring. This is exactly the setup I look for before a run.`,
    `Dev locked LP. No team wallet. Bundle scan completely clean. Liquidity building quietly. I'm in a full bag right now.`,
    `Fits the current narrative perfectly. Volume is building under the radar and the public hasn't found it yet. These are the calls that print the hardest.`,
    `Survived the first dump and held the exact level I needed. This is a textbook re-entry. I've already sized in — you're seeing it in real time.`,
    `On-chain confirms heavy accumulation by wallets I track. KOLs haven't posted yet. That's the window — right now — before the chart wakes up.`,
    `Risk/reward here is cleaner than anything I've posted in weeks. Small mcap, real liquidity, narrative tailwind. Not a meme flip — this is a calculated entry.`,
    `Three wallets I've been copying quietly all just loaded the same token in the last 2 hours. I'm following them in. First time I'm sharing this publicly.`,
  ]);
  const fields = [
    { name: "💎 Mcap", value: fmtUsd(t.marketCap), inline: true },
    { name: "💧 Liquidity", value: fmtUsd(t.liquidityUsd), inline: true },
    { name: "📊 24h Vol", value: fmtUsd(t.volume24h), inline: true },
    { name: "🔗 Chain", value: t.chain, inline: true },
    { name: "📡 DEX", value: t.dexId, inline: true },
    { name: "📈 24h", value: fmtChangeLine(t.priceChange24h), inline: true },
    { name: "💵 Price", value: fmtUsd(t.priceUsd), inline: true },
    { name: "⏱ Pair Age", value: t.ageMin > 0 ? humanAge(t.ageMin) : "—", inline: true },
    { name: "🎯 Entry", value: "Market now / scale on any dip", inline: true },
    { name: "📜 CA", value: "```" + t.address + "```", inline: false },
    { name: "🔗 Chart", value: `[DexScreener](${t.url}) • [Explorer](${explorerUrl(t)})`, inline: false },
  ];
  return {
    username: cfg.ownerHandle,
    embeds: [{
      color: COLORS.emerald,
      title: `🚨 CALL — $${t.symbol}`,
      url: t.url,
      description:
        `${callerNote}\n\n` +
        `${pick(VIP_TEASES)}\n\n` +
        `> 🔒 _VIP received this call **${randInt(12, 45)} minutes before** this post. They're already filled. DM ${dm} if you want to be on the next one from the entry — not after._`,
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
  const minsAgo = randInt(20, 65);
  const entryMult = randFloat(2.5, 9, 1);
  const vipMc = Math.max(1000, Math.round(t.marketCap / entryMult));
  const img = await maybeAnimatedRenderUrl("proof", {
    ticker: t.symbol, x: entryMult, entry: vipMc, server: cfg.serverName, handle: dm,
  });
  return {
    username: cfg.ownerHandle,
    embeds: [{
      color: COLORS.gold,
      title: `👀 Already running — $${t.symbol} (you missed the entry)`,
      url: t.url,
      description:
        `Posting this for free chat so you can see exactly what you walked past.\n\n` +
        `**VIP entry:** ${fmtUsd(vipMc)} mcap • sent **${minsAgo} minutes ago**\n` +
        `**Right now:** ${fmtUsd(t.marketCap)} mcap\n` +
        `**That's ${entryMult.toFixed(1)}x already — and we haven't even trimmed yet.**\n\n` +
        `**Chain:** ${t.chain}  •  **DEX:** ${t.dexId}\n\n` +
        `I'm showing you half the CA so you can verify this is real. Full address + exact entry timing — VIP only. That's the difference between watching and being in it.\n\n` +
        `This happens inside VIP **every single day.** The calls that move, before they move.\n\n` +
        `Stop watching from the outside. DM ${dm} right now.`,
      fields: [
        { name: "📜 CA (partial)", value: "```" + maskAddr(t.address) + "```", inline: false },
        { name: "📊 24h Change", value: fmtChangeLine(t.priceChange24h), inline: true },
        { name: "💧 Liquidity", value: fmtUsd(t.liquidityUsd), inline: true },
        { name: "🚪 Want the full CA next time?", value: `DM ${dm}`, inline: true },
        { name: "🔗 Chart", value: `[DexScreener](${t.url})`, inline: false },
      ],
      image: { url: img },
      footer: { text: `${cfg.serverName} • Called by ${dm} — this is what VIP gets every day` },
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
    ticker: t.symbol, mc: t.marketCap, handle: dm, server: cfg.serverName,
  });
  return {
    username: cfg.ownerHandle,
    embeds: [{
      color: COLORS.vipPurple,
      title: `🔒 VIP CALL — ${masked} [LOCKED for public]`,
      description:
        `**VIP members already filled this. You're seeing the wrapper.**\n\n` +
        `Why I don't post the full CA in public:\n` +
        `**→** Liquidity is thin. The second the CA goes public, slippage kills the fill.\n` +
        `**→** My members loaded before the chart woke up. That's the edge.\n` +
        `**→** The receipt drops in 🏆 proof-results the moment we trim — you can verify it then.\n\n` +
        `This is not a tease. This is exactly how VIP works.\n\n` +
        `Every. Single. Call. Before everyone else.\n` +
        `Full CA. Exact entry. My position size. No delays.\n\n` +
        `**One DM changes everything. DM ${dm} — right now.**`,
      fields: [
        { name: "🔗 Chain", value: t.chain, inline: true },
        { name: "💎 Entry MC", value: fmtUsd(t.marketCap), inline: true },
        { name: "🔓 Unlock VIP", value: `DM ${dm}`, inline: true },
      ],
      image: { url: img },
      footer: { text: `${cfg.serverName} • VIP only • DM ${dm} to change your position` },
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
  const pnlProfit = pnlOut - pnlInvested;
  const img = await maybeAnimatedRenderUrl("proof", {
    ticker: t.symbol, x, entry: entryMc, server: cfg.serverName, handle: dm,
  });
  return {
    username: cfg.ownerHandle,
    embeds: [{
      color: COLORS.gold,
      title: `🏆 RECEIPT — $${t.symbol} ${x}x ✅`,
      url: t.url,
      description:
        `**Called at ${fmtUsd(entryMc)} mcap. Sitting at ${fmtUsd(t.marketCap)} right now.**\n\n` +
        `My position: **$${pnlInvested.toLocaleString()} in → $${pnlOut.toLocaleString()} out** (+$${pnlProfit.toLocaleString()} profit)\n\n` +
        `${pick(HYPE_LINES)}\n\n` +
        `VIP members had the full CA and my exact entry price **before this chart even started moving.** They've been sitting in profit this entire time.\n\n` +
        `This isn't cherry-picked. Check the last 20 calls in proof-results. The consistency is the product.\n\n` +
        `> 📩 _Want to be on the next one from entry? DM ${dm} — don't wait for the next receipt post to remind you._`,
      fields: [
        { name: "📊 24h Performance", value: fmtChangeLine(t.priceChange24h), inline: true },
        { name: "💧 Liquidity", value: fmtUsd(t.liquidityUsd), inline: true },
        { name: "📜 CA", value: "```" + t.address + "```", inline: false },
        { name: "🔗 Chart", value: `[DexScreener](${t.url}) • [Explorer](${explorerUrl(t)})`, inline: false },
      ],
      image: { url: img },
      footer: { text: `${cfg.serverName} • Receipts posted by ${dm} every time` },
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
    ticker: t.symbol, mc: t.marketCap, handle: dm, server: cfg.serverName,
  });
  return {
    username: cfg.ownerHandle,
    embeds: [{
      color: COLORS.vipPurple,
      title: `💎 VIP SNIPE — Filled @ ${fmtUsd(t.marketCap)} mcap`,
      description:
        `**Just filled. VIP has the full CA. I'm in.**\n\n` +
        `> **CA:** \`${maskAddr(t.address)}\` *(full CA inside VIP — only members got this)*\n` +
        `> **Chain:** ${t.chain}\n` +
        `> **DEX:** ${t.dexId}\n` +
        `> **My fill:** ${fillSize} ${fillSizeUnit}\n` +
        `> **Ticker:** $${t.symbol.slice(0, 2)}•••\n\n` +
        `The receipt drops in 🏆 proof-results the second I trim. I've done this every single time — zero exceptions.\n\n` +
        `You're reading this from the outside right now. You don't have to be.\n\n` +
        `**DM ${dm}. One message. That's all it takes.**`,
      image: { url: img },
      footer: { text: `${cfg.serverName} • VIP snipes by ${dm} — join before the next one` },
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
  const lead = randInt(12, 55);
  const ageStr = t.ageMin > 0 ? humanAge(t.ageMin) : "brand new";
  const img = await maybeAnimatedRenderUrl("early", {
    ticker: t.symbol, lead, handle: dm, server: cfg.serverName,
  });
  return {
    username: cfg.ownerHandle,
    embeds: [{
      color: COLORS.cyan,
      title: `🚀 Early Radar — $${t.symbol} — ${lead}min head start`,
      url: t.url,
      description:
        `**This just hit my scanner ${lead} minutes before the public chart wakes up.**\n\n` +
        `Why this is on my radar:\n` +
        `→ Smart money cluster forming on ${t.chain} — I'm tracking the exact wallets\n` +
        `→ Pair is only ${ageStr} old — the kind of early where 10x is still on the table\n` +
        `→ Liq: ${fmtUsd(t.liquidityUsd)} — real, not fake. Volume: ${fmtUsd(t.volume24h)}\n` +
        `→ No KOL attention yet. This is the window. It closes fast.\n\n` +
        `${pick(VIP_TEASES)}\n\n` +
        `**Full CA + exact sizing goes to VIP right now.** Free chat sees it when it's already running.\n\n` +
        `You want to stop being free chat. DM ${dm}.`,
      fields: [
        { name: "💎 Mcap", value: fmtUsd(t.marketCap), inline: true },
        { name: "📈 1h", value: fmtChangeLine(t.priceChange1h), inline: true },
        { name: "📊 24h", value: fmtChangeLine(t.priceChange24h), inline: true },
      ],
      image: { url: img },
      footer: { text: `${cfg.serverName} • Early Access by ${dm} — VIP gets this first` },
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
  const actionLine = pick(
    direction === "BUY"
      ? [
          `My wallet just filled. First position. I'm watching this closely.`,
          `Added here. Conviction is high. Watch the level.`,
          `Fresh entry. Chart is setting up exactly as expected.`,
        ]
      : direction === "TRIM"
      ? [
          `Trimmed ${randInt(20, 40)}% at this level. Still holding the rest. Let it run.`,
          `Took some off the table. Still in profit-running mode.`,
        ]
      : [
          `Full exit. Locked profit. On to the next one.`,
          `Closed the position. Clean trade. Receipts incoming.`,
        ]
  );
  return {
    username: cfg.ownerHandle,
    embeds: [{
      color,
      title: `${emoji} ${direction} — $${t.symbol}`,
      url: t.url,
      description:
        `${actionLine}\n\n` +
        `Wallet \`${wallet}\` just moved on ${t.chain}.\n` +
        `**Size:** ${size} ${sizeUnit} (~$${usd.toLocaleString()})\n\n` +
        `VIP members saw the thesis and the CA before I pulled the trigger. Every time, no exceptions.`,
      fields: [
        { name: "💎 Mcap", value: fmtUsd(t.marketCap), inline: true },
        { name: "💧 Liq", value: fmtUsd(t.liquidityUsd), inline: true },
        { name: "📊 24h", value: fmtChangeLine(t.priceChange24h), inline: true },
        { name: "📜 CA", value: "```" + t.address + "```", inline: false },
        { name: "🔗 Chart", value: `[DexScreener](${t.url}) • [Explorer](${explorerUrl(t)})`, inline: false },
        { name: "🎯 Caller", value: dm, inline: true },
        { name: "📍 Move type", value: direction === "BUY" ? "fresh entry" : direction === "TRIM" ? "risk management" : "full exit", inline: true },
      ],
      image: { url: img },
      footer: { text: `${cfg.serverName} • Live Trades by ${dm} — DM to be in VIP before the next fill` },
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
