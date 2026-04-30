import type { WebhookPayload } from "../poster";
import { maybeAnimatedRenderUrl } from "../poster";

import { COLORS, pick, randFloat, randInt } from "../data";
import { loadConfig } from "../config";
import { fetchMajorPrices, topByGain24h, topByVolume, fmtUsd } from "../marketdata";

const PERSONAS = [
  { name: "ZaneSnipes", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=zane" },
  { name: "Mira_DEX", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=mira" },
  { name: "blocknomad", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=block" },
  { name: "0xSerum", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=serum" },
  { name: "DegenLatte", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=latte" },
  { name: "frenchaped", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=french" },
  { name: "tinybag", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=tiny" },
  { name: "rugproof", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=rug" },
  { name: "sleeplessG", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=sleep" },
  { name: "ChainsawSol", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=chain" },
  { name: "octogem", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=octo" },
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

const EDUCATIONAL_POSTS = [
  {
    title: "📚 Quick Lesson — Stop Loss",
    body: "A stop loss protects your capital. If price moves against you, you exit early instead of bleeding out.\n\n**Rule of thumb:** never risk more than 2-5% of your bag on a single trade.\n\nThe pros aren't the ones who win every trade. They're the ones who don't blow up when they're wrong.",
  },
  {
    title: "📚 Quick Lesson — Position Sizing",
    body: "Position size = how much you put into ONE trade.\n\nNew traders go full port on hype. Pros split into thirds:\n• 1/3 at entry\n• 1/3 if it dips into support\n• 1/3 once trend confirms\n\nYou can't get rugged by a coin you only put 2% into.",
  },
  {
    title: "📚 Quick Lesson — Liquidity Check",
    body: "Before aping, look at LIQUIDITY on DexScreener.\n\n• Under $10k liq → can rug instantly\n• $10k–$50k → playable but risky\n• $50k+ → safer, less slippage\n\nIf liq is locked + low % held by top wallets, that's the sweet spot.",
  },
  {
    title: "📚 Quick Lesson — Take Profit Like A Pro",
    body: "If you only sell at the top, you'll never sell.\n\nLadder out:\n• 25% at 2x\n• 25% at 5x\n• 25% at 10x\n• Let 25% ride to the moon\n\nThis way you've already won by 2x. Anything above is bonus.",
  },
];

const HYPE_POSTS = [
  "🌍 **Where you trading from?** Drop your country/timezone — let's see who's grinding when the US sleeps 👇",
  "🐂 or 🐻 right now? Drop your bias for the next 24h. No fence-sitters.",
  "🔥 **Best call you caught from this server so far?** Share it. Make the new members jealous.",
  "💬 **Quick poll** — what's the next narrative that runs?\n• AI agents 🤖\n• Solana memes 🐶\n• L2 tokens 🟪\n• DePIN 📡\n• Gaming 🎮\n\nReact with your pick.",
  "👀 If you're new here, drop a 👋 below. Tell us how you found us.",
];

const FOMO_POSTS = [
  {
    title: "⚠️ Big move setup — VIP already in",
    body: "Watching a clean breakout setup right now. Liq is healthy, chart is coiled, narrative aligns.\n\n**VIP got the CA 12 minutes ago.**\n\nFree chat will see the masked teaser when I'm done filling. If you want it BEFORE the move — DM the handle in the footer.\n\n⏳ Don't be late this time.",
  },
  {
    title: "⚠️ This one's about to send",
    body: "I don't post FOMO unless I'm already positioned. I'm in.\n\nVIP got my entry, sizing, and stop. Free chat gets the post-pump screenshot in proof-results.\n\nThis is the gap. Closing it costs less than one bad trade.",
  },
];

const DM_HOOKS = [
  "💸 Honest question — if I gave you the right CA at the right time **right now**, could you act on it?\n\nMost people freeze. The ones who DM win.\n\nDM \"VIP\" to the handle in the footer.",
  "📩 If you had $500 to deploy this week, would you flip it or fade it?\n\nVIP members are flipping it. Free chat is reading about it after.\n\nWhich side you on?",
  "🎯 The difference between a 2x and a 20x is timing. VIP is the timing.\n\nDM \"START\" to claim a seat while they're open.",
];

const TESTIMONIALS = [
  "💬 **Member just dropped this in DMs:**\n\n_\"Joined VIP 6 days ago. Already up $480 from the snipes. Wish I'd done it months ago.\"_\n\nThis is what consistency looks like. 📈",
  "💬 **From a VIP member this morning:**\n\n_\"That last snipe paid for the whole month. First call already covered the fee.\"_\n\nOne good trade pays for the year. Most members recoup in week 1.",
  "💬 **Receipt from VIP earlier:**\n\n_\"Up 3.2x on the call from yesterday. Took half off, letting the rest ride.\"_\n\nThat's the play. Take profits, leave a runner. Compound.",
];

/**
 * General-chat post rotates between casual one-liners (community feel),
 * educational lessons (trust), hype questions (engagement), FOMO posts (conversion),
 * DM hooks (lead-gen), and testimonials (social proof). The mix is what makes
 * the server look alive instead of bot-spammed.
 */
export async function generalChatPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const p = pick(PERSONAS);

  // Weighted roll — mostly casual chatter, occasionally a "premium" template.
  const roll = Math.random();
  // 0.00–0.55 = casual one-liner
  // 0.55–0.70 = hype/community question
  // 0.70–0.82 = educational lesson
  // 0.82–0.92 = testimonial
  // 0.92–0.97 = DM hook
  // 0.97–1.00 = FOMO

  if (roll < 0.55) {
    return {
      username: cfg.ownerHandle,
      avatar_url: p.avatar,
      content: pick(GENERAL_LINES),
    };
  }

  if (roll < 0.70) {
    return {
      username: cfg.ownerHandle,
      avatar_url: p.avatar,
      content: pick(HYPE_POSTS),
    };
  }

  if (roll < 0.82) {
    const lesson = pick(EDUCATIONAL_POSTS);
    return {
      username: cfg.ownerHandle,
      avatar_url: p.avatar,
      embeds: [{
        color: COLORS.dark,
        title: lesson.title,
        description: lesson.body,
        footer: { text: `${cfg.serverName} • lesson of the day — more inside VIP` },
      }],
    };
  }

  if (roll < 0.92) {
    return {
      username: cfg.ownerHandle,
      avatar_url: p.avatar,
      embeds: [{
        color: COLORS.green,
        description: pick(TESTIMONIALS),
        footer: { text: `${cfg.serverName} • DM ${cfg.telegramDmHandle || "the handle"} to join VIP` },
      }],
    };
  }

  if (roll < 0.97) {
    return {
      username: cfg.ownerHandle,
      avatar_url: p.avatar,
      embeds: [{
        color: COLORS.vipPurple,
        description: pick(DM_HOOKS),
        footer: { text: `${cfg.serverName} • DM the handle in profile to join VIP` },
      }],
    };
  }

  const fomo = pick(FOMO_POSTS);
  return {
    username: cfg.ownerHandle,
    avatar_url: p.avatar,
    content: "@everyone",
    allowed_mentions: { parse: ["everyone"] },
    embeds: [{
      color: COLORS.red,
      title: fomo.title,
      description: fomo.body,
      footer: { text: `${cfg.serverName} • DM to join VIP — seats fill fast` },
      timestamp: new Date().toISOString(),
    }],
  };
}

/**
 * Real market commentary — pulls live BTC/ETH/SOL from CoinGecko and the top
 * mover from DexScreener, then wraps it in a casual "trader take".
 */
export async function marketChatPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const p = pick(PERSONAS);

  let take = "";
  let trend: "up" | "down" = "up";

  try {
    const prices = await fetchMajorPrices();
    const btc = prices["BTC"];
    const eth = prices["ETH"];
    const sol = prices["SOL"];
    let movers: Awaited<ReturnType<typeof topByGain24h>> = [];
    try { movers = await topByGain24h(1, { minLiqUsd: 25_000 }); } catch { /* ok */ }
    const lead = movers[0];

    const candidates: Array<{ trend: "up" | "down"; line: string }> = [];
    if (btc) {
      candidates.push({
        trend: btc.change24h >= 0 ? "up" : "down",
        line: `BTC at $${btc.usd.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${signed(btc.change24h)}% 24h). ${btc.change24h >= 1 ? "Bid is back, alts about to wake up." : btc.change24h <= -1 ? "Watch your leverage — chop continues." : "Range bound, waiting on a reclaim."}`,
      });
    }
    if (eth && sol) {
      const ethSol = eth.usd / sol.usd;
      candidates.push({
        trend: sol.change24h >= eth.change24h ? "up" : "down",
        line: `eth/sol ratio at ${ethSol.toFixed(1)} — SOL ${signed(sol.change24h)}% vs ETH ${signed(eth.change24h)}% on the day. degens know where the money is going.`,
      });
    }
    if (sol) {
      candidates.push({
        trend: sol.change24h >= 0 ? "up" : "down",
        line: `SOL ${sol.change24h >= 0 ? "printing" : "bleeding"} — ${signed(sol.change24h)}% on the day, sitting at $${sol.usd.toFixed(2)}. sol micro-caps about to ${sol.change24h >= 0 ? "wake up" : "follow"}.`,
      });
    }
    if (lead) {
      candidates.push({
        trend: "up",
        line: `top mover on the radar: $${lead.symbol} on ${lead.chain}, +${lead.priceChange24h.toFixed(0)}% in 24h, sitting at ${fmtUsd(lead.marketCap)} mcap. liq ${fmtUsd(lead.liquidityUsd)}.`,
      });
    }
    if (candidates.length > 0) {
      const c = pick(candidates);
      take = c.line;
      trend = c.trend;
    }
  } catch {
    // fall through to fallback
  }

  if (!take) {
    take = `volatility crushed across majors. expect a big move within 24-48h. narrative of the day: ${pick(["AI agents", "memecoins", "DePIN", "L1 rotation", "RWA", "gaming"])}.`;
    trend = "up";
  }

  return {
    username: cfg.ownerHandle,
    avatar_url: p.avatar,
    embeds: [
      {
        color: COLORS.dark,
        description: take,
        footer: { text: `${cfg.serverName} • market take` },
      },
    ],
  };
}

export async function trendingCoinsPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  // Real top movers — split between volume leaders and 24h gainers.
  const byVol = await topByVolume(3, { minLiqUsd: 15_000 });
  const byGain = await topByGain24h(3, { minLiqUsd: 15_000 });
  const seen = new Set<string>();
  const merged: typeof byVol = [];
  for (const t of [...byGain, ...byVol]) {
    if (seen.has(t.address)) continue;
    seen.add(t.address);
    merged.push(t);
    if (merged.length === 3) break;
  }
  const top = merged.length ? merged : byVol;

  const items = top
    .map((t) => `${t.symbol}:+${Math.abs(t.priceChange24h ?? 0).toFixed(1)}`)
    .join(",");

  return {
    username: cfg.ownerHandle,
    embeds: [{
      color: COLORS.orange,
      title: "🔥 Trending right now",
      description: "Top movers in the last 24h across DexScreener.",
      fields: top.flatMap((t, i) => [
        {
          name: `${i + 1}. $${t.symbol}`,
          value: `${signed(t.priceChange24h)}% 24h • ${fmtUsd(t.marketCap)} mcap • ${t.chain}\n[Chart](${t.url})`,
          inline: false,
        },
      ]),
      image: { url: await maybeAnimatedRenderUrl("trending", { items, server: cfg.serverName }) },
      footer: { text: "data refreshed every 3m • DexScreener" },
      timestamp: new Date().toISOString(),
    }],
  };
}

function signed(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}`;
}

// Suppress unused warnings — kept for potential future variants.
void randInt;
void randFloat;
