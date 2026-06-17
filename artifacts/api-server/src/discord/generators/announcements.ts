import type { WebhookPayload } from "../poster";
import { maybeAnimatedRenderUrl } from "../poster";
import {
  COLORS,
  pick,
  randFloat,
  randInt,
} from "../data";
import { loadConfig, dmTarget } from "../config";
import {
  pickTrending,
  topByGain24h,
  fmtUsd,
  explorerUrl,
  type RealToken,
} from "../marketdata";

/* ── Mature text pools ─────────────────────────────────────────────────────── */

const PRINTING_LINES = [
  "Still running. VIP still holding. Public just catching up.",
  "From the original call to now — this is what patience looks like.",
  "They said it was dead. Look at the chart.",
  "10x and climbing. VIP members already took profit on half.",
  "The ones who loaded at entry are printing. The ones who waited are watching.",
  "This is the difference between being first and being late.",
  "Another cycle, same result. VIP first, public later.",
  "Receipts speak louder than promises.",
];

const CHAT_QUOTES = [
  "Patience is the only edge that matters in this game.",
  "The market doesn't care about your feelings. Trade the chart.",
  "Position size yourself properly and you'll survive long enough to win.",
  "The best trades are the ones you don't take.",
  "Risk management first. Everything else follows.",
  "If you can't sleep at night, you're over-positioned.",
  "The crowd is always late. That's the entire edge.",
  "Conviction comes from research, not hopium.",
  "Stop trading based on FOMO. Start trading based on data.",
  "The chart tells you everything. Listen to it.",
  "Most people lose because they trade emotions, not setups.",
  "Wait for the setup. The market will always give you another chance.",
];

const MARKET_TAKES = [
  "Market's choppy right now. Wait for confirmation before entering. Not every dip is a buy.",
  "BTC holding the level we called. If this breaks, altcoins get punished. Stay light until we get direction.",
  "Risk-off vibes today. Cash is a position. Don't force trades in a red market.",
  "Volume picking up on BTC. When majors move, alts follow. Get positioned before the rotation.",
];

export async function announcementPost(): Promise<any> {
  return {
    username: "Announcement",
    content: "New announcement coming soon.",
    embeds: [],
  };
}

export async function joinVipPost(): Promise<any> {
  return {
    username: "Join VIP",
    content: "Join our VIP for exclusive alpha.",
    embeds: [],
  };
}

export async function dailyRecapPost(): Promise<any> {
  return {
    username: "Daily Recap",
    content: "Daily market recap coming soon.",
    embeds: [],
  };
}

<<<<<<< HEAD

export async function announcementPost(): Promise<any> {
  return {
    username: "Announcement",
    content: "New announcement coming soon.",
    embeds: [],
  };
}

export async function joinVipPost(): Promise<any> {
  return {
    username: "Join VIP",
    content: "Join our VIP for exclusive alpha.",
    embeds: [],
  };
}
=======
export { topByGain24h };
>>>>>>> 8ac21a1 (fix: replace corrupted announcements.ts file)
