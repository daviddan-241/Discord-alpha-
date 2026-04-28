import type { WebhookPayload } from "../poster";
import { renderUrl } from "../poster";
import {
  CHAINS,
  COLORS,
  DEXES,
  TOKEN_TICKERS,
  fmtMoney,
  pick,
  randFloat,
  randInt,
  randomEthAddr,
  randomSolAddr,
  shortAddr,
  HYPE_LINES,
  VIP_TEASES,
  TOKEN_NAMES,
} from "../data";
import { loadConfig, dmTarget } from "../config";

function callPair(): { ticker: string; name: string; chain: string } {
  const ticker = pick(TOKEN_TICKERS);
  return {
    ticker,
    name: TOKEN_NAMES[ticker] ?? ticker.replace(/_/g, " "),
    chain: pick(CHAINS),
  };
}

function ca(chain: string): string {
  if (chain === "Solana") return randomSolAddr();
  return randomEthAddr();
}

function maskCa(addr: string): string {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}••••••••••••••••••••••••${addr.slice(-4)}`;
}

/**
 * The free-calls feed is intentionally varied so it feels like a real
 * caller server. We rotate three personalities:
 *   - 40%  full public call (chart + CA visible)
 *   - 30%  drip teaser (ticker visible, CA blurred, "VIP got this earlier")
 *   - 30%  VIP-locked card (everything blurred, "this one is in VIP only")
 */
export async function freeCallPost(): Promise<WebhookPayload> {
  const roll = Math.random();
  if (roll < 0.4) return freeCallFull();
  if (roll < 0.7) return freeCallDripTeaser();
  return freeCallVipLocked();
}

async function freeCallFull(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  const { ticker, chain } = callPair();
  const dex = pick(DEXES);
  const mc = randInt(8, 90) * 1000;
  const liq = randInt(8, 60) * 1000;
  const vol24 = randInt(20, 480) * 1000;
  const holders = randInt(180, 1900);
  const top10 = randFloat(8, 28, 1);
  const ageMin = randInt(2, 25);
  const addr = ca(chain);
  const callerNote = pick([
    "Smart money wallets are loading this. Chart printing higher lows on the 5m.",
    "Dev locked LP, no team allocation. Clean meta entry.",
    "Riding the new narrative wave. Liq deep enough for size.",
    "Bundle scan is clean. Top 10 holders are not the dev.",
    "Volume building under the radar. Public hasn't found it yet.",
    "Survived the first dump. Bottom is in. Re-entry is here.",
  ]);
  const img = await renderUrl("call", {
    ticker, mc, liq, chain, dex, server: cfg.serverName,
  });
  const fields = [
    { name: "💎 Mcap", value: fmtMoney(mc), inline: true },
    { name: "💧 Liquidity", value: fmtMoney(liq), inline: true },
    { name: "📊 24h Vol", value: fmtMoney(vol24), inline: true },
    { name: "🔗 Chain", value: chain, inline: true },
    { name: "📡 DEX", value: dex, inline: true },
    { name: "👥 Holders", value: holders.toLocaleString(), inline: true },
    { name: "🐳 Top 10", value: `${top10}%`, inline: true },
    { name: "⏱ Age", value: `${ageMin}m`, inline: true },
    { name: "🎯 Entry", value: "Now / scale on dips", inline: true },
    { name: "📜 CA", value: "```" + addr + "```", inline: false },
  ];
  return {
    username: `${cfg.serverName} Calls`,
    embeds: [
      {
        color: COLORS.emerald,
        title: `📊 NEW CALL — $${ticker}`,
        description:
          `${callerNote}\n\n` +
          `${pick(VIP_TEASES)}\n\n` +
          `> _Public call. VIP got this **${randInt(8, 35)} minutes earlier** — DM ${dm} for the upgrade._`,
        fields,
        image: { url: img },
        footer: { text: `${cfg.serverName} • Free Calls • not financial advice` },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

async function freeCallDripTeaser(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  const { ticker, chain } = callPair();
  const dex = pick(DEXES);
  const vipMc = randInt(4, 12) * 1000;
  const nowMc = vipMc * randInt(3, 9);
  const minsAgo = randInt(12, 55);
  const addr = ca(chain);
  const img = await renderUrl("call", {
    ticker, mc: nowMc, liq: randInt(20, 90) * 1000, chain, dex, server: cfg.serverName,
  });
  return {
    username: `${cfg.serverName} Calls`,
    embeds: [
      {
        color: COLORS.gold,
        title: `👀 Watching — $${ticker}`,
        description:
          `Dripping this for the free chat. Already running.\n\n` +
          `**VIP entry:** ${fmtMoney(vipMc)} mcap • posted ${minsAgo}m ago\n` +
          `**Now:** ${fmtMoney(nowMc)} mcap (~${(nowMc / vipMc).toFixed(1)}x already)\n` +
          `**Chain:** ${chain} • **DEX:** ${dex}\n\n` +
          `CA is half-shown for free. Full CA + entry timing went out in VIP earlier.`,
        fields: [
          { name: "📜 CA (partial)", value: "```" + maskCa(addr) + "```", inline: false },
          { name: "🎯 Status", value: "Still inside. Targets next.", inline: true },
          { name: "🚪 Want it earlier?", value: `DM ${dm}`, inline: true },
        ],
        image: { url: img },
        footer: { text: `${cfg.serverName} • Drip from VIP` },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

async function freeCallVipLocked(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  const { ticker, chain } = callPair();
  const mc = randInt(5, 35) * 1000;
  const masked = `$${ticker.slice(0, 2)}•••••`;
  const img = await renderUrl("snipe", {
    ticker, mc, server: cfg.serverName, handle: cfg.ownerHandle,
  });
  return {
    username: `${cfg.serverName} Calls`,
    embeds: [
      {
        color: COLORS.vipPurple,
        title: `🔒 VIP-ONLY CALL — ${masked}`,
        description:
          `**This one is locked to VIP.** Free chat sees the wrapper, VIP got the entry.\n\n` +
          `Why we're not posting it here:\n` +
          `• Liquidity is thin — public alpha would move the price against members.\n` +
          `• Caller wants VIP to fill before the chart wakes up.\n\n` +
          `Receipt will drop in 🏆 **proof-results** once we trim.`,
        fields: [
          { name: "🔗 Chain", value: chain, inline: true },
          { name: "💎 Entry MC", value: fmtMoney(mc), inline: true },
          { name: "🔓 Unlock", value: `DM ${dm}`, inline: true },
        ],
        image: { url: img },
        footer: { text: "VIP only • Free preview" },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export async function proofResultsPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  const { ticker } = callPair();
  const x = randFloat(8, 220, 1);
  const entry = randInt(8, 25) * 1000;
  const ath = Math.round(entry * x);
  const pnlInvested = randInt(500, 4000);
  const pnlOut = Math.round(pnlInvested * x);
  const img = await renderUrl("proof", {
    ticker, x, entry, server: cfg.serverName, handle: cfg.ownerHandle,
  });
  return {
    username: `${cfg.serverName} Proof`,
    embeds: [
      {
        color: COLORS.gold,
        title: `🏆 $${ticker} hit ${x}x`,
        description:
          `Called at **${fmtMoney(entry)}** mcap. Hit **${fmtMoney(ath)}** ATH.\n\n` +
          `**Position PnL** — $${pnlInvested.toLocaleString()} → $${pnlOut.toLocaleString()}\n\n` +
          `${pick(HYPE_LINES)}\n\n` +
          `> Want to be on the next one? DM ${dm}.`,
        image: { url: img },
        footer: { text: `${cfg.serverName} • Receipts` },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export async function vipSnipePost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  const { ticker, chain } = callPair();
  const mc = randInt(4, 18) * 1000;
  const fillSol = randFloat(2, 18, 2);
  const masked = "0x••••••••••••••••••••••••pump";
  const img = await renderUrl("snipe", {
    ticker, mc, server: cfg.serverName, handle: cfg.ownerHandle,
  });
  return {
    username: `${cfg.serverName} VIP Snipes`,
    embeds: [
      {
        color: COLORS.vipPurple,
        title: `💎 VIP SNIPE — Filled @ ${fmtMoney(mc)}`,
        description:
          `One of our VIP wallets just filled an early bag.\n\n` +
          `> **CA:** \`${masked}\`  *(unlocked in VIP)*\n` +
          `> **Chain:** ${chain}\n` +
          `> **Fill size:** ${fillSol} SOL avg\n` +
          `> **Ticker:** $${ticker.slice(0, 2)}•••\n\n` +
          `_Receipt drops in 🏆 proof-results once we trim._\n\n` +
          `Tired of seeing the blur? DM ${dm}.`,
        image: { url: img },
        footer: { text: "VIP only • Public preview" },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export async function earlyAccessPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  const { ticker, chain } = callPair();
  const lead = randInt(8, 45);
  const img = await renderUrl("early", {
    ticker, lead, server: cfg.serverName, handle: cfg.ownerHandle,
  });
  return {
    username: `${cfg.serverName} Early`,
    embeds: [
      {
        color: COLORS.cyan,
        title: `🚀 Early Access — $${ticker} watchlist`,
        description:
          `On the VIP radar **${lead} minutes before** the public chart wakes up.\n\n` +
          `Why we're watching:\n` +
          `• Smart-money cluster forming on ${chain}\n` +
          `• Dev wallet behaving (no dumps in 24h)\n` +
          `• Volume building under stealth\n\n` +
          `${pick(VIP_TEASES)}\n` +
          `DM ${dm} to unlock the CA.`,
        image: { url: img },
        footer: { text: `${cfg.serverName} • Early Access` },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export async function liveTradePost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const { ticker, chain } = callPair();
  const direction = pick(["BUY", "BUY", "TRIM", "EXIT"] as const);
  const sol = randFloat(0.5, 25, 2);
  const usd = Math.round(sol * randInt(140, 220));
  const wallet = chain === "Solana" ? randomSolAddr() : randomEthAddr();
  const color = direction === "BUY" ? COLORS.green : direction === "TRIM" ? COLORS.gold : COLORS.red;
  const emoji = direction === "BUY" ? "🟢" : direction === "TRIM" ? "🟡" : "🔴";
  const img = await renderUrl("trade", {
    direction, ticker,
    size: `${sol} ${chain === "Solana" ? "SOL" : "ETH"}`,
    usd: `$${usd.toLocaleString()}`,
    wallet: shortAddr(wallet),
    server: cfg.serverName,
  });
  return {
    username: `${cfg.serverName} Trades`,
    embeds: [
      {
        color,
        title: `${emoji} ${direction} — $${ticker}`,
        description:
          `Wallet \`${shortAddr(wallet)}\` ${direction === "BUY" ? "filled" : direction === "TRIM" ? "trimmed" : "exited"} on ${chain}.\n\n` +
          `**Size:** ${sol} ${chain === "Solana" ? "SOL" : "ETH"} (~$${usd.toLocaleString()})`,
        fields: [
          { name: "Tx", value: `[explorer](https://example.com/${wallet})`, inline: true },
          { name: "Caller", value: cfg.ownerHandle, inline: true },
          { name: "Tag", value: direction === "BUY" ? "fresh entry" : "manage risk", inline: true },
        ],
        image: { url: img },
        footer: { text: `${cfg.serverName} • Live Trades` },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}
