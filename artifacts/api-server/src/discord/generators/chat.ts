import type { WebhookPayload } from "../poster";
import { renderUrl } from "../poster";
import { COLORS, pick, randFloat, randInt } from "../data";
import { loadConfig } from "../config";

const PERSONAS = [
  { name: "ZaneSnipes", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=zane" },
  { name: "Mira_DEX", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=mira" },
  { name: "blocknomad", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=block" },
  { name: "0xSerum", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=serum" },
  { name: "DegenLatte", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=latte" },
  { name: "frenchaped", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=french" },
  { name: "tinybag",   avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=tiny" },
  { name: "rugproof",  avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=rug" },
  { name: "sleeplessG", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=sleep" },
  { name: "ChainsawSol", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=chain" },
  { name: "octogem",  avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=octo" },
  { name: "dailyalpha", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=daily" },
];

const GENERAL_LINES = [
  "gm degens, who's printing today",
  "yall see that last call? clean entry",
  "i swear this server is the only one that posts BEFORE the pump",
  "my wife asked why im up at 3am again",
  "lmao someone pls tell newcomers to read the rules first",
  "dca'd into the last free call, already green",
  "anyone else holding from yesterday's pick?",
  "the proof channel is making me jealous fr",
  "first time in a server where calls actually hit lol",
  "still mad i faded the chsn call",
  "vip ppl be eating different",
  "moderators here actually answer, w server",
  "should i sell or hold? im up 4x already",
  "fomo'd into a green candle. pain.",
  "trading on my phone at work, dont judge",
  "anyone tracking the new narrative? feels early",
  "the discord call rooms when the alert drops are wild",
  "lurking pays off, just got my first 10x off these calls",
  "stop asking for refunds you didnt buy anything",
  "alpha rooms popping rn",
];

const MARKET_LINES = [
  () => `BTC sitting at ~$${randInt(58, 92)}k, range bound. waiting on a reclaim of $${randInt(60, 95)}k for confirmation.`,
  () => `SOL printing again, +${randFloat(2, 12, 1)}% on the day. sol micro-caps about to wake up.`,
  () => `eth/sol ratio still bleeding. degens know where the money is going.`,
  () => `funding flipped negative on majors. squeeze incoming if we hold.`,
  () => `total market cap +${randFloat(0.5, 6, 1)}% — alts leading. classic risk-on day.`,
  () => `dxy rolling over. risk assets like that.`,
  () => `volatility crushed. expect a big move within 24-48h.`,
  () => `liquidations cleared the leverage. healthier setup now.`,
  () => `narrative of the day: ${pick(["AI agents", "memecoins", "DePIN", "L1 rotation", "RWA", "gaming", "rune season"])}.`,
  () => `careful with low-liq longs over the weekend. mm games incoming.`,
];

export async function generalChatPost(): Promise<WebhookPayload> {
  const p = pick(PERSONAS);
  return {
    username: p.name,
    avatar_url: p.avatar,
    content: pick(GENERAL_LINES),
  };
}

export async function marketChatPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const p = pick(PERSONAS);
  const take = pick(MARKET_LINES)();
  const trend = take.includes("bleeding") || take.includes("negative") || take.includes("careful") ? "down" : "up";
  const img = await renderUrl("market", { take, trend, server: cfg.serverName });
  return {
    username: p.name,
    avatar_url: p.avatar,
    embeds: [
      {
        color: COLORS.dark,
        description: take,
        image: { url: img },
        footer: { text: `${cfg.serverName} • market take` },
      },
    ],
  };
}

export async function trendingCoinsPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const top = [
    `${pick(["DEGEN", "PEPE2", "WIF2", "MOODENG2"])}:+${randFloat(40, 320, 1)}`,
    `${pick(["BONK2", "CHILL", "GIGA", "TURBO"])}:+${randFloat(25, 220, 1)}`,
    `${pick(["PNUT", "MEW2", "POPCAT", "FROG"])}:+${randFloat(15, 180, 1)}`,
  ];
  const img = await renderUrl("trending", { items: top.join(","), server: cfg.serverName });
  return {
    username: `${cfg.serverName} Trending`,
    embeds: [
      {
        color: COLORS.orange,
        title: "🔥 Trending right now",
        description: "Top movers in the last 24h.",
        fields: top.map((t, i) => {
          const [sym, ch] = t.split(":");
          return { name: `${i + 1}.`, value: `$${sym} • ${ch}%`, inline: true };
        }),
        image: { url: img },
        footer: { text: "data refreshed every 5m" },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}
