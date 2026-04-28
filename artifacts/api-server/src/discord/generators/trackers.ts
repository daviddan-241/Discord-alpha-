import type { WebhookPayload } from "../poster";
import { renderUrl } from "../poster";
import {
  CHAINS,
  COLORS,
  TOKEN_TICKERS,
  fmtMoney,
  pick,
  randFloat,
  randInt,
  randomEthAddr,
  randomSolAddr,
  shortAddr,
} from "../data";
import { loadConfig, dmTarget } from "../config";

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

export async function whaleTrackerPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const chain = pick(CHAINS);
  const wallet = chain === "Solana" ? randomSolAddr() : randomEthAddr();
  const ticker = pick(TOKEN_TICKERS);
  const action = pick(["bought", "added", "rotated into", "took profit on", "fully exited"] as const);
  const isExit = action === "fully exited" || action === "took profit on";
  const sol = randFloat(15, 800, 2);
  const usd = Math.round(sol * randInt(140, 220));
  const tag = pick(WHALE_TAGS);
  const img = await renderUrl("whale", {
    action: action === "fully exited" ? "EXITED" : action === "took profit on" ? "TRIMMED" : "BOUGHT",
    ticker,
    wallet: shortAddr(wallet),
    size: `${sol} ${chain === "Solana" ? "SOL" : "ETH"}`,
    usd: `$${usd.toLocaleString()}`,
    tag,
    server: cfg.serverName,
  });
  return {
    username: `${cfg.serverName} Whales`,
    embeds: [
      {
        color: isExit ? COLORS.red : COLORS.green,
        title: `🐋 Whale ${action} $${ticker}`,
        description: `**${tag}** \`${shortAddr(wallet)}\` ${action} on ${chain}.`,
        fields: [
          { name: "Size", value: `${sol} ${chain === "Solana" ? "SOL" : "ETH"}  (~$${usd.toLocaleString()})`, inline: true },
          { name: "Token Mcap", value: fmtMoney(randInt(50, 4000) * 1000), inline: true },
          { name: "Holding", value: `${randInt(1, 96)}h`, inline: true },
        ],
        image: { url: img },
        footer: { text: "tracking 1,200+ wallets" },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export async function priceBotPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const btc = randFloat(58000, 95000, 0);
  const eth = randFloat(2400, 4400, 0);
  const sol = randFloat(120, 260, 1);
  const bnb = randFloat(450, 720, 0);
  const doge = randFloat(0.08, 0.34, 4);
  const wif = randFloat(0.6, 4.2, 3);
  const change = (n = 8) => `${randFloat(-n, n, 2) >= 0 ? "🟢 +" : "🔴 "}${randFloat(-n, n, 2)}%`;
  const items = [
    `BTC:${btc}:${randFloat(-4, 4, 2)}`,
    `ETH:${eth}:${randFloat(-6, 6, 2)}`,
    `SOL:${sol}:${randFloat(-9, 9, 2)}`,
    `BNB:${bnb}:${randFloat(-5, 5, 2)}`,
    `DOGE:${doge}:${randFloat(-12, 12, 2)}`,
    `WIF:${wif}:${randFloat(-18, 18, 2)}`,
  ].join(",");
  const img = await renderUrl("price", { items, server: cfg.serverName });
  return {
    username: `${cfg.serverName} Price Bot`,
    embeds: [
      {
        color: COLORS.blue,
        title: "📊 Live prices",
        fields: [
          { name: "BTC", value: `$${btc.toLocaleString()}\n${change(4)} 24h`, inline: true },
          { name: "ETH", value: `$${eth.toLocaleString()}\n${change(6)} 24h`, inline: true },
          { name: "SOL", value: `$${sol}\n${change(9)} 24h`, inline: true },
          { name: "BNB", value: `$${bnb}\n${change(5)} 24h`, inline: true },
          { name: "DOGE", value: `$${doge}\n${change(12)} 24h`, inline: true },
          { name: "WIF", value: `$${wif}\n${change(18)} 24h`, inline: true },
        ],
        image: { url: img },
        footer: { text: "updated every ~15m" },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export async function gasTrackerPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const ethGwei = randFloat(4, 90, 1);
  const solFee = randFloat(0.000005, 0.0008, 6);
  const baseGwei = randFloat(0.01, 1.2, 3);
  const tag =
    ethGwei < 12 ? "🟢 dirt cheap" : ethGwei < 35 ? "🟡 normal" : "🔴 expensive";
  const img = await renderUrl("gas", {
    eth: `${ethGwei} gwei`,
    base: `${baseGwei} gwei`,
    sol: `${solFee.toFixed(6)} SOL`,
    server: cfg.serverName,
  });
  return {
    username: `${cfg.serverName} Gas`,
    embeds: [
      {
        color: ethGwei < 12 ? COLORS.green : ethGwei < 35 ? COLORS.gold : COLORS.red,
        title: "⛽ Gas tracker",
        fields: [
          { name: "Ethereum", value: `${ethGwei} gwei\n${tag}`, inline: true },
          { name: "Base", value: `${baseGwei} gwei\n🟢 cheap`, inline: true },
          { name: "Solana", value: `${solFee.toFixed(6)} SOL avg\n🟢 spammable`, inline: true },
        ],
        image: { url: img },
        footer: { text: "good moment to ape" },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export async function alertsPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  const variants = [
    {
      title: "📡 ALERT — Whale cluster forming",
      desc:
        `Multiple top wallets just rotated into the same low-cap on ${pick(CHAINS)}.\n` +
        `Pattern matches ${randInt(2, 6)} previous winners.\n\n` +
        `Public chart will catch up in ~${randInt(15, 90)} minutes. VIP got the CA already.\n\n` +
        `Want it now? DM ${dm}.`,
      color: COLORS.pink,
    },
    {
      title: "📡 ALERT — Liquidity unlock incoming",
      desc:
        `Token we've been watching unlocks ~$${randInt(40, 800)}K of liquidity in <1h.\n` +
        `Either rocket or rug — VIP is positioned either way.`,
      color: COLORS.orange,
    },
    {
      title: "📡 ALERT — Stop bleeding",
      desc:
        `If you're sitting in red bags, post in 💬 general-chat. Mods will look at the chart.\n` +
        `Don't average down on dying coins. Rotate to the live calls.`,
      color: COLORS.red,
    },
    {
      title: "📡 ALERT — VIP just got fed",
      desc:
        `New VIP-only call just dropped. Public preview in 💎 vip-snipes.\n` +
        `${randInt(8, 22)} VIP members already filled.\n\n` +
        `DM ${dm} to be on the next one in time.`,
      color: COLORS.vipPurple,
    },
  ];
  const v = pick(variants);
  const img = await renderUrl("alert", {
    title: v.title.replace(/^📡 ALERT — /, ""),
    body: v.desc.split("\n")[0] ?? "Something is moving.",
    server: cfg.serverName,
  });
  return {
    username: `${cfg.serverName} Alerts`,
    embeds: [
      {
        color: v.color,
        title: v.title,
        description: v.desc,
        image: { url: img },
        footer: { text: `${cfg.serverName} • Alerts` },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}
