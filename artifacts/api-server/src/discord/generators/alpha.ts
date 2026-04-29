import type { WebhookPayload } from "../poster";
import { COLORS, pick, randInt } from "../data";
import { loadConfig, dmTarget } from "../config";
import { topByGain24h, topByVolume, fmtUsd } from "../marketdata";


const NARRATIVE_BUCKETS: Array<{ name: string; chains: string[] }> = [
  { name: "Solana memecoin season", chains: ["Solana"] },
  { name: "Base micro-caps", chains: ["Base"] },
  { name: "ETH alt rotation", chains: ["Ethereum"] },
  { name: "BSC degen plays", chains: ["BSC"] },
  { name: "AI x crypto convergence", chains: ["Solana", "Ethereum", "Base"] },
  { name: "L1 rotation", chains: ["Ethereum", "Solana", "Base", "BSC", "Arbitrum"] },
  { name: "DePIN infrastructure", chains: ["Solana", "Ethereum"] },
  { name: "RWA tokenisation", chains: ["Ethereum", "Base"] },
  { name: "GameFi revival", chains: ["Solana", "BSC", "Ethereum"] },
];

const THESIS_OPENERS = [
  `Everyone in main chat is fading this. That tells me everything. When the crowd is wrong — that's the trade.`,
  `While public attention is locked on majors, smart money is rotating quietly into this. I've been watching it for days.`,
  `This is the narrative that prints next. Early movers right now get the life-changing multiples. Late movers get the dump.`,
  `Quick read on exactly what I'm positioned in and why. This is the unfiltered version — VIP gets the tickers.`,
  `Public attention is in the wrong place right now. The real flow — the wallet flow I track — is going here.`,
  `Smart money finished loading. Public hasn't noticed yet. That gap is where the money is made.`,
  `The next narrative wave is setting up right now. I've seen this pattern ${randInt(4, 9)} times. It plays the same every time.`,
  `I don't post this kind of thesis publicly often. Pay attention.`,
];

export async function alphaLoungePost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  const bucket = pick(NARRATIVE_BUCKETS);
  const opener = pick(THESIS_OPENERS);

  const allMovers = await topByGain24h(15);
  const matching = allMovers.filter((t) => bucket.chains.includes(t.chain));
  const pool = matching.length >= 2 ? matching : await topByVolume(8);
  const examples = pool.slice(0, 3);

  const exampleLines = examples
    .map((t) => `• **$${t.symbol}** on ${t.chain} — ${fmtUsd(t.marketCap)} mcap, ${signed(t.priceChange24h)}% 24h`)
    .join("\n");

  const bullets = [
    `• Top wallets I track are accumulating quietly across ${randInt(3, 9)} tickers in this sector — no public announcement yet`,
    `• Liquidity on the leaders is up ${randInt(20, 180)}% week-over-week — capital is arriving`,
    `• Devs from the ${pick(["last cycle", "previous narrative", "old gaming run"])} are all building here now`,
    `• KOLs haven't started posting yet — the early window is still open but it closes fast`,
    `• ${randInt(2, 5)} confirmed catalysts in the next 14 days — low risk, high conviction`,
    `• On-chain data shows distribution from majors into this sector starting 48 hours ago`,
  ];
  const picks = bullets.sort(() => Math.random() - 0.5).slice(0, 3);

  return {
    username: cfg.ownerHandle,
    embeds: [{
      color: COLORS.purple,
      title: `🧠 Alpha Lounge — ${bucket.name}`,
      description:
        `${opener}\n\n` +
        `**Narrative I'm watching: ${bucket.name}**\n\n` +
        `**Why I'm positioned here right now:**\n${picks.join("\n")}\n\n` +
        `**Tokens on my radar in this sector:**\n` +
        `${exampleLines || "_(scanner refreshing — back in a few minutes)_"}\n\n` +
        `**The full play — specific tickers, entry sizes, and price targets — is inside VIP.**\n\n` +
        `By the time this becomes public news, VIP will have already been in it for hours.\n\n` +
        `DM ${dm} to be inside the next one before the chart moves.`,
      footer: { text: `${cfg.serverName} • Alpha Lounge — VIP gets the full list` },
      timestamp: new Date().toISOString(),
    }],
  };
}

function signed(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}`;
}
