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
import { loadConfig } from "../config";

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

export async function freeCallPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const { ticker, chain } = callPair();
  const dex = pick(DEXES);
  const mc = randInt(8, 90) * 1000;
  const liq = randInt(8, 60) * 1000;
  const ageMin = randInt(2, 25);
  const addr = ca(chain);
  const img = await renderUrl("call", {
    ticker, mc, liq, chain, dex, server: cfg.serverName,
  });
  const fields = [
    { name: "💎 Mcap", value: fmtMoney(mc), inline: true },
    { name: "💧 Liquidity", value: fmtMoney(liq), inline: true },
    { name: "⏱ Age", value: `${ageMin}m`, inline: true },
    { name: "🔗 Chain", value: chain, inline: true },
    { name: "📡 DEX", value: dex, inline: true },
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
          `Fresh entry. Low cap, decent liq, chart looks primed.\n` +
          `${pick(VIP_TEASES)}\n\n` +
          `> _Public call. VIP got this earlier — DM ${cfg.ownerHandle} for the upgrade._`,
        fields,
        image: { url: img },
        footer: { text: `${cfg.serverName} • Free Calls` },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export async function proofResultsPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
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
          `> Want to be on the next one? DM ${cfg.ownerHandle}.`,
        image: { url: img },
        footer: { text: `${cfg.serverName} • Receipts` },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export async function vipSnipePost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
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
          `Tired of seeing the blur? DM ${cfg.ownerHandle}.`,
        image: { url: img },
        footer: { text: "VIP only • Public preview" },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export async function earlyAccessPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
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
          `DM ${cfg.ownerHandle} to unlock the CA.`,
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
