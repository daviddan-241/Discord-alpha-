import type { WebhookPayload } from "../poster";
import { renderUrl } from "../poster";
import { COLORS, pick, randInt } from "../data";
import { loadConfig, dmTarget } from "../config";

const NARRATIVES = [
  "AI agents",
  "Solana memecoin season 2",
  "Base micro-caps",
  "DePIN rotation",
  "BTC L2s",
  "RWA tokenization",
  "Gaming + token launches",
  "Stablecoin yield wars",
  "Restaking unlocks",
  "Rune season",
  "TON mini-apps",
  "AI x crypto convergence",
];

const THESIS_OPENERS = [
  "Most of the chat is fading this. That's the trade.",
  "Quietly, while everyone watches majors, this rotation is starting:",
  "Don't sleep on this — early movers will be very rewarded:",
  "Quick read on what we're positioned in:",
  "Public attention is wrong rn. Real flow is going here:",
];

export async function alphaLoungePost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  const n = pick(NARRATIVES);
  const opener = pick(THESIS_OPENERS);
  const bullets = [
    `• Top wallets accumulating quietly across ${randInt(3, 9)} tickers in this sector`,
    `• Liquidity on the leaders is up ${randInt(20, 180)}% week-over-week`,
    `• Devs from the ${pick(["last cycle", "previous narrative", "old gaming season"])} are launching here`,
    `• KOLs haven't started shilling yet — that's the early window`,
    `• Risk: low. Catalysts: ${randInt(2, 5)} confirmed in the next 14 days`,
  ];
  const picks = bullets.sort(() => Math.random() - 0.5).slice(0, 3);
  const img = await renderUrl("alpha", { narrative: n, server: cfg.serverName });

  return {
    username: `${cfg.serverName} Alpha`,
    embeds: [
      {
        color: COLORS.purple,
        title: `🧠 Alpha Lounge — ${n}`,
        description:
          `${opener}\n\n` +
          `**Narrative:** ${n}\n` +
          `**Why now:**\n${picks.join("\n")}\n\n` +
          `Specific tickers + entries posted in **VIP**.\n` +
          `DM ${dm} to upgrade.`,
        image: { url: img },
        footer: { text: `${cfg.serverName} • Alpha Lounge` },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}
