import type { WebhookPayload } from "../poster";
import { maybeAnimatedRenderUrl } from "../poster";
import {
  COLORS,
  pick,
  randFloat,
  randInt,
} from "../data";
import { loadConfig, dmTarget, pingContent } from "../config";
import {
  pickTrending,
  topByGain24h,
  explorerUrl,
  fmtUsd,
  maskAddr,
  type RealToken,
} from "../marketdata";

/* ── Human, mature text pools ──────────────────────────────────────────────── */

const CALL_THESES = [
  `This setup is clean. Dev locked LP, no team wallet, clean bundle scan. Liquidity building under the radar while public attention is locked elsewhere.`,
  `I've been tracking this narrative for days. The on-chain data confirms smart money is accumulating quietly. Chart is coiling — these are the ones that move hardest.`,
  `Survived the first dump and held the exact level. This is textbook re-entry. Already sized in and adding on any weakness.`,
  `Three wallets I track just loaded the same position in the last 2 hours. I'm following. First time I'm sharing this publicly.`,
  `Risk/reward is cleaner than anything I've posted in weeks. Small mcap, real liquidity, narrative tailwind. Not gambling — this is calculated.`,
  `Fits the current meta perfectly. Volume building quietly, no KOL posts yet. The window between now and public discovery is where the money is.`,
  `On-chain confirms heavy accumulation by wallets that have a 70%+ strike rate this cycle. I'm positioned. You're seeing this in real time.`,
];

const PROOF_CAPTIONS = [
  "Another one. We don't miss.",
  "VIP got fed first. Always.",
  "Receipts don't lie.",
  "Public didn't even see this one coming.",
  "This is why you tap in early.",
  "Consistency is the product. Not one hit.",
  "If you faded, that's on you.",
  "We eat good in here.",
  "Another W for the books.",
  "Locked in. Stay ready.",
];

const PRINTING_LINES = [
  "Still running. VIP still holding. Public just catching up.",
  "From the original call to now — this is what patience looks like.",
  "They said it was dead. Look at the chart.",
  "10x and climbing. VIP members already took profit on half.",
  "The ones who loaded at entry are printing. The ones who waited are watching.",
  "This is the difference between being first and being late.",
];

const VIP_TEASES_MATURE = [
  `VIP got the CA ${randInt(12, 45)} minutes before this post. They're already in profit.`,
  `Free chat sees the result. VIP saw the entry. That's the product.`,
  `Imagine being in before the chart moved. That's what VIP gets, every cycle.`,
  `The calls that move — before they move. That's the difference.`,
  `Stop watching from the outside. The entry window is always first.`,
  `You're seeing the aftermath. VIP got the signal at ${randInt(8, 22)}k mcap.`,
];

export async function freeCallPost(): Promise<WebhookPayload> {
  const roll = Math.random();
  if (roll < 0.35) return freeCallFull();
  if (roll < 0.65) return freeCallDripTeaser();
  return freeCallVipLocked();
}

/** Free-chat post re-using a token VIP already got — DexScreener-style card. */
export async function freeCallLinkedTeaserFor(
  t: RealToken,
  vipLeadMin: number,
): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  const entryMult = randFloat(1.4, 2.6, 1);
  const vipMc = Math.max(1000, Math.round(t.marketCap / entryMult));

  // DexScreener-style image
  const img = await maybeAnimatedRenderUrl("dexCard", {
    ticker: t.symbol,
    symbol: t.symbol,
    chain: t.chain,
    dex: t.dexId,
    priceUsd: String(t.priceUsd),
    priceSol: String(t.priceUsd / 180),
    mcap: String(t.marketCap),
    liquidity: String(t.liquidityUsd),
    volume: String(t.volume24h),
    age: t.ageMin < 60 ? `${t.ageMin} minutes` : `${Math.round(t.ageMin / 60)} hours`,
    change24h: String(t.priceChange24h),
    change24hStr: `${t.priceChange24h >= 0 ? "+" : ""}${t.priceChange24h.toFixed(2)}%`,
    server: cfg.serverName,
  });

  return {
    username: cfg.ownerHandle,
    content: pingContent(cfg),
    allowed_mentions: { parse: ["everyone"] },
    embeds: [{
      color: COLORS.gold,
      title: `👀 VIP just filled — $${t.symbol} (${vipLeadMin}m head start)`,
      url: t.url,
      description:
        `Posting this for free chat **${vipLeadMin} minutes after VIP got the full CA.**\n\n` +
        `**VIP entry:** ${fmtUsd(vipMc)} mcap • **${vipLeadMin}m ago**\n` +
        `**Right now:** ${fmtUsd(t.marketCap)} mcap (already +${entryMult.toFixed(1)}x for members)\n\n` +
        `**Chain:** ${t.chain}  •  **DEX:** ${t.dexId}\n\n` +
        `I'm showing you half the CA so you can verify this is real on-chain. Full address + my exact entry price + size — VIP got it first. That's the entire point.\n\n` +
        `This happens **every single call.** VIP first. Free chat sees the receipt.\n\n` +
        `Stop watching from the outside. DM ${dm} right now.`,
      fields: [
        { name: "📜 CA (partial)", value: "```" + maskAddr(t.address) + "```", inline: false },
        { name: "📊 24h Change", value: fmtChangeLine(t.priceChange24h), inline: true },
        { name: "💧 Liquidity", value: fmtUsd(t.liquidityUsd), inline: true },
        { name: "🚪 Want the full CA next time?", value: `DM ${dm}`, inline: true },
        { name: "🔗 Chart", value: `[DexScreener](${t.url})`, inline: false },
      ],
      image: { url: img },
      footer: { text: `${cfg.serverName} • VIP got this ${vipLeadMin} min before this post` },
      timestamp: new Date().toISOString(),
    }],
  };
}

async function freeCallFull(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  const t = await pickTrending({ minLiqUsd: 15_000, maxMcUsd: 50_000_000 });

  // DexScreener-style card image
  const img = await maybeAnimatedRenderUrl("dexCard", {
    ticker: t.symbol,
    symbol: t.symbol,
    chain: t.chain,
    dex: t.dexId,
    priceUsd: String(t.priceUsd),
    priceSol: String(t.priceUsd / 180),
    mcap: String(t.marketCap),
    liquidity: String(t.liquidityUsd),
    volume: String(t.volume24h),
    age: t.ageMin < 60 ? `${t.ageMin} minutes` : `${Math.round(t.ageMin / 60)} hours`,
    change24h: String(t.priceChange24h),
    change24hStr: `${t.priceChange24h >= 0 ? "+" : ""}${t.priceChange24h.toFixed(2)}%`,
    server: cfg.serverName,
  });

  const callerNote = pick(CALL_THESES);

  return {
    username: cfg.ownerHandle,
    content: pingContent(cfg),
    allowed_mentions: { parse: ["everyone"] },
    embeds: [{
      color: COLORS.emerald,
      title: `🚨 CALL — $${t.symbol}`,
      url: t.url,
      description:
        `${callerNote}\n\n` +
        `${pick(VIP_TEASES_MATURE)}\n\n` +
        `> 🔒 _VIP received this call **${randInt(12, 45)} minutes before** this post. They're already filled. DM ${dm} if you want to be on the next one from the entry — not after._`,
      fields: [
        { name: "💎 Mcap", value: fmtUsd(t.marketCap), inline: true },
        { name: "💧 Liquidity", value: fmtUsd(t.liquidityUsd), inline: true },
        { name: "📊 24h Vol", value: fmtUsd(t.volume24h), inline: true },
        { name: "🔗 Chain", value: t.chain, inline: true },
        { name: "📡 DEX", value: t.dexId, inline: true },
        { name: "📈 24h", value: fmtChangeLine(t.priceChange24h), inline: true },
        { name: "💵 Price", value: fmtUsd(t.priceUsd), inline: true },
        { name: "⏱ Pair Age", value: humanAge(t.ageMin), inline: true },
        { name: "🎯 Entry", value: "Market now / scale on any dip", inline: true },
        { name: "📜 CA", value: "```" + t.address + "```", inline: false },
        { name: "🔗 Chart", value: `[DexScreener](${t.url}) • [Explorer](${explorerUrl(t)})`, inline: false },
      ],
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

  // DexScreener-style card
  const img = await maybeAnimatedRenderUrl("dexCard", {
    ticker: t.symbol,
    symbol: t.symbol,
    chain: t.chain,
    dex: t.dexId,
    priceUsd: String(t.priceUsd),
    priceSol: String(t.priceUsd / 180),
    mcap: String(t.marketCap),
    liquidity: String(t.liquidityUsd),
    volume: String(t.volume24h),
    age: t.ageMin < 60 ? `${t.ageMin} minutes` : `${Math.round(t.ageMin / 60)} hours`,
    change24h: String(t.priceChange24h),
    change24hStr: `${t.priceChange24h >= 0 ? "+" : ""}${t.priceChange24h.toFixed(2)}%`,
    server: cfg.serverName,
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
    ticker: t.symbol, mc: String(t.marketCap), handle: dm, server: cfg.serverName,
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

  // Wallet proof screenshot style image
  const img = await maybeAnimatedRenderUrl("walletProof", {
    tokenName: t.symbol,
    tokenAmount: `${(Math.random() * 10000 + 100).toFixed(4)}`,
    tokenUsd: `$${pnlOut.toLocaleString()}`,
    tokenGain: `+$${pnlProfit.toLocaleString()}`,
    tokenGainPct: `+${((pnlProfit / pnlInvested) * 100).toFixed(2)}%`,
    solAmount: `${(Math.random() * 5).toFixed(5)}`,
    solUsd: `$${(Math.random() * 10).toFixed(2)}`,
    solGain: `+$${(Math.random() * 2).toFixed(2)}`,
    totalValue: `$${pnlOut.toLocaleString()}`,
    totalGain: `+$${pnlProfit.toLocaleString()}`,
    totalGainPct: `+${((pnlProfit / pnlInvested) * 100).toFixed(2)}%`,
    server: cfg.serverName,
  });

  return {
    username: cfg.ownerHandle,
    content: pingContent(cfg),
    allowed_mentions: { parse: ["everyone"] },
    embeds: [{
      color: COLORS.gold,
      title: `🏆 RECEIPT — $${t.symbol} ${x}x ✅`,
      url: t.url,
      description:
        `**Called at ${fmtUsd(entryMc)} mcap. Sitting at ${fmtUsd(t.marketCap)} right now.**\n\n` +
        `My position: **$${pnlInvested.toLocaleString()} in → $${pnlOut.toLocaleString()} out** (+$${pnlProfit.toLocaleString()} profit)\n\n` +
        `${pick(PROOF_CAPTIONS)}\n\n` +
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
  const t = await pickTrending({ minLiqUsd: 8_000, maxMcUsd: 8_000_000 });
  return vipSnipePostFor(t);
}

export async function vipSnipePostFor(t: RealToken): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  const fillSizeUnit = t.chain === "Solana" ? "SOL" : t.chain === "Ethereum" ? "ETH" : "tokens";
  const fillSize = t.chain === "Solana" ? randFloat(2, 18, 2) : randFloat(0.2, 4, 2);

  const img = await maybeAnimatedRenderUrl("dexCard", {
    ticker: t.symbol,
    symbol: t.symbol,
    chain: t.chain,
    dex: t.dexId,
    priceUsd: String(t.priceUsd),
    priceSol: String(t.priceUsd / 180),
    mcap: String(t.marketCap),
    liquidity: String(t.liquidityUsd),
    volume: String(t.volume24h),
    age: t.ageMin < 60 ? `${t.ageMin} minutes` : `${Math.round(t.ageMin / 60)} hours`,
    change24h: String(t.priceChange24h),
    change24hStr: `${t.priceChange24h >= 0 ? "+" : ""}${t.priceChange24h.toFixed(2)}%`,
    server: cfg.serverName,
  });

  return {
    username: cfg.ownerHandle,
    content: pingContent(cfg),
    allowed_mentions: { parse: ["everyone"] },
    embeds: [{
      color: COLORS.vipPurple,
      title: `💎 VIP SNIPE — $${t.symbol} filled @ ${fmtUsd(t.marketCap)} mcap`,
      description:
        `**VIP ONLY — full CA below. Sent to members first. Free chat will see a teaser later.**\n\n` +
        `> **Ticker:** $${t.symbol}\n` +
        `> **Chain:** ${t.chain}\n` +
        `> **DEX:** ${t.dexId}\n` +
        `> **Entry mcap:** ${fmtUsd(t.marketCap)}\n` +
        `> **Liquidity:** ${fmtUsd(t.liquidityUsd)}\n` +
        `> **My fill:** ${fillSize} ${fillSizeUnit}\n\n` +
        `**Full CA (VIP only — do NOT share):**\n` +
        `\`\`\`${t.address}\`\`\`\n` +
        `[Open chart](${t.url}) • [Explorer](${explorerUrl(t)})\n\n` +
        `Same setup, every cycle: VIP fills first → I post in free chat ~10–25 min later with the masked CA → receipt drops when I trim. Zero exceptions.`,
      image: { url: img },
      footer: { text: `${cfg.serverName} • VIP first • Sniped by ${dm}` },
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

  const img = await maybeAnimatedRenderUrl("dexCard", {
    ticker: t.symbol,
    symbol: t.symbol,
    chain: t.chain,
    dex: t.dexId,
    priceUsd: String(t.priceUsd),
    priceSol: String(t.priceUsd / 180),
    mcap: String(t.marketCap),
    liquidity: String(t.liquidityUsd),
    volume: String(t.volume24h),
    age: ageStr,
    change24h: String(t.priceChange24h),
    change24hStr: `${t.priceChange24h >= 0 ? "+" : ""}${t.priceChange24h.toFixed(2)}%`,
    server: cfg.serverName,
  });

  return {
    username: cfg.ownerHandle,
    content: pingContent(cfg),
    allowed_mentions: { parse: ["everyone"] },
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
        `${pick(VIP_TEASES_MATURE)}\n\n` +
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
  const color = direction === "BUY" ? COLORS.green : direction === "TRIM" ? COLORS.gold : COLORS.red;
  const emoji = direction === "BUY" ? "🟢" : direction === "TRIM" ? "🟡" : "🔴";

  const img = await maybeAnimatedRenderUrl("trade", {
    ticker: t.symbol, direction,
    size: `${size} ${sizeUnit}`, usd: `$${usd.toLocaleString()}`,
    wallet, server: cfg.serverName,
  });

  const actionLine = pick(
    direction === "BUY"
      ? [
          `Wallet just moved. Watching this one.`,
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
  const addr = `${head}${"0".repeat(isSol ? 36 : 32)}${tail}`;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}
