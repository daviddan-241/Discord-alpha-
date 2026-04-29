import type { WebhookPayload } from "../poster";
import { maybeAnimatedRenderUrl } from "../poster";
import { COLORS, pick, randInt } from "../data";
import { loadConfig, dmTarget } from "../config";
import { topByGain24h, topByVolume, fmtUsd } from "../marketdata";

const ALPHA_NAMES    = ["Alpha Desk 🧠", "Thesis", "Narrative Desk", "Deep Alpha", "Intel 🔍"];

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
  "Most of the chat is fading this. That's the trade.",
  "Quietly, while everyone watches majors, this rotation is starting:",
  "Don't sleep on this — early movers will be very rewarded:",
  "Quick read on what we're positioned in:",
  "Public attention is wrong rn. Real flow is going here:",
  "Smart money is already in. Public hasn't noticed yet.",
  "The next narrative wave is setting up right now:",
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
    `• Top wallets accumulating quietly across ${randInt(3, 9)} tickers in this sector`,
    `• Liquidity on the leaders is up ${randInt(20, 180)}% week-over-week`,
    `• Devs from the ${pick(["last cycle", "previous narrative", "old gaming season"])} are launching here`,
    `• KOLs haven't started shilling yet — that's the early window`,
    `• Risk: low. Catalysts: ${randInt(2, 5)} confirmed in the next 14 days`,
  ];
  const picks = bullets.sort(() => Math.random() - 0.5).slice(0, 3);

  const img = await maybeAnimatedRenderUrl("alpha", {
    narrative: bucket.name, server: cfg.serverName,
  });

  return {
    username: pick(ALPHA_NAMES),
    embeds: [{
      color: COLORS.purple,
      title: `🧠 Alpha Lounge — ${bucket.name}`,
      description:
        `${opener}\n\n` +
        `**Narrative:** ${bucket.name}\n` +
        `**Why now:**\n${picks.join("\n")}\n\n` +
        `**On our radar right now:**\n${exampleLines || "_(scanner refreshing — check back in a few minutes)_"}\n\n` +
        `Specific entries + sizing posted in **VIP**.\n` +
        `DM ${dm} to upgrade.`,
      image: { url: img },
      footer: { text: `${cfg.serverName} • Alpha Lounge` },
      timestamp: new Date().toISOString(),
    }],
  };
}

function signed(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}`;
}
