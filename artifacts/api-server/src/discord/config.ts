import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __moduleDir = path.dirname(__filename);

const DATA_DIR = path.resolve(__moduleDir, "../../data");
const CONFIG_PATH = path.join(DATA_DIR, "discord-config.json");
const HISTORY_PATH = path.join(DATA_DIR, "discord-history.json");

export type ChannelKey =
  | "welcome"
  | "rules"
  | "get_verified"
  | "how_to_join_vip"
  | "announcements"
  | "join_vip"
  | "free_calls"
  | "proof_results"
  | "market_chat"
  | "general_chat"
  | "trending_coins"
  | "vip_snipes"
  | "early_access"
  | "whale_tracker"
  | "live_trades"
  | "alpha_lounge"
  | "bot_commands"
  | "price_bot"
  | "gas_tracker"
  | "alerts"
  | "open_ticket"
  | "feedback"
  | "report_scams";

export const CHANNEL_KEYS: ChannelKey[] = [
  "welcome",
  "rules",
  "get_verified",
  "how_to_join_vip",
  "announcements",
  "join_vip",
  "free_calls",
  "proof_results",
  "market_chat",
  "general_chat",
  "trending_coins",
  "vip_snipes",
  "early_access",
  "whale_tracker",
  "live_trades",
  "alpha_lounge",
  "bot_commands",
  "price_bot",
  "gas_tracker",
  "alerts",
  "open_ticket",
  "feedback",
  "report_scams",
];

export type ChannelMeta = {
  key: ChannelKey;
  label: string;
  emoji: string;
  /** Posted manually only (one-shot info channels). */
  oneShot: boolean;
  /** Min minutes between auto posts. */
  minMinutes: number;
  /** Max minutes between auto posts. */
  maxMinutes: number;
  description: string;
};

export const CHANNEL_META: Record<ChannelKey, ChannelMeta> = {
  welcome: { key: "welcome", label: "welcome-to-baldwin-calls", emoji: "👋", oneShot: true, minMinutes: 0, maxMinutes: 0, description: "Server welcome message." },
  rules: { key: "rules", label: "rules", emoji: "📜", oneShot: true, minMinutes: 0, maxMinutes: 0, description: "Server rules." },
  get_verified: { key: "get_verified", label: "get-verified", emoji: "✅", oneShot: true, minMinutes: 0, maxMinutes: 0, description: "Verification instructions." },
  how_to_join_vip: { key: "how_to_join_vip", label: "how-to-join-vip", emoji: "📊", oneShot: true, minMinutes: 0, maxMinutes: 0, description: "Step-by-step VIP onboarding instructions." },
  bot_commands: { key: "bot_commands", label: "bot-terminal", emoji: "🤖", oneShot: true, minMinutes: 0, maxMinutes: 0, description: "List of bot commands." },
  open_ticket: { key: "open_ticket", label: "open-ticket", emoji: "🎟️", oneShot: true, minMinutes: 0, maxMinutes: 0, description: "How to open a support ticket." },
  feedback: { key: "feedback", label: "feedback", emoji: "💡", oneShot: true, minMinutes: 0, maxMinutes: 0, description: "How to leave feedback." },
  report_scams: { key: "report_scams", label: "report-scams", emoji: "🚨", oneShot: true, minMinutes: 0, maxMinutes: 0, description: "How to report scams / impersonators." },
  announcements: { key: "announcements", label: "apex-announcements", emoji: "📢", oneShot: false, minMinutes: 240, maxMinutes: 600, description: "Big server / VIP announcements." },
  join_vip: { key: "join_vip", label: "join-apex-vip", emoji: "💎", oneShot: false, minMinutes: 180, maxMinutes: 420, description: "VIP sales pitch with proof." },
  free_calls: { key: "free_calls", label: "free-calls", emoji: "📊", oneShot: false, minMinutes: 30, maxMinutes: 90, description: "Free trade calls." },
  proof_results: { key: "proof_results", label: "proof-results", emoji: "🏆", oneShot: false, minMinutes: 60, maxMinutes: 180, description: "Result screenshots & profits." },
  market_chat: { key: "market_chat", label: "market-chat", emoji: "📉", oneShot: false, minMinutes: 30, maxMinutes: 75, description: "Market commentary & vibes." },
  general_chat: { key: "general_chat", label: "general-chat", emoji: "💬", oneShot: false, minMinutes: 25, maxMinutes: 55, description: "Casual conversation." },
  trending_coins: { key: "trending_coins", label: "trending-coins", emoji: "🔥", oneShot: false, minMinutes: 25, maxMinutes: 60, description: "Trending coin updates." },
  vip_snipes: { key: "vip_snipes", label: "vip-snipes", emoji: "💎", oneShot: false, minMinutes: 60, maxMinutes: 150, description: "Blurred VIP snipe previews." },
  early_access: { key: "early_access", label: "early-access", emoji: "🚀", oneShot: false, minMinutes: 90, maxMinutes: 240, description: "Early access teases." },
  whale_tracker: { key: "whale_tracker", label: "whale-tracker", emoji: "🐋", oneShot: false, minMinutes: 15, maxMinutes: 45, description: "Whale wallet movements." },
  live_trades: { key: "live_trades", label: "live-trades", emoji: "📈", oneShot: false, minMinutes: 20, maxMinutes: 55, description: "Live trade entries / exits." },
  alpha_lounge: { key: "alpha_lounge", label: "alpha-lounge", emoji: "🧠", oneShot: false, minMinutes: 60, maxMinutes: 180, description: "Alpha analysis & narratives." },
  price_bot: { key: "price_bot", label: "price-bot", emoji: "📊", oneShot: false, minMinutes: 12, maxMinutes: 25, description: "Major coin price ticker." },
  gas_tracker: { key: "gas_tracker", label: "gas-tracker", emoji: "⛽", oneShot: false, minMinutes: 18, maxMinutes: 35, description: "Gas / network fees." },
  alerts: { key: "alerts", label: "alerts", emoji: "📡", oneShot: false, minMinutes: 60, maxMinutes: 180, description: "Urgent breaking alerts." },
};

export type DiscordConfig = {
  webhooks: Record<string, string>;
  ownerHandle: string;
  /**
   * Discord user mention like `<@1035212407213133856>` — when set, posts use
   * this in CTAs so the owner gets a real ping. Falls back to `ownerHandle`.
   */
  ownerMention: string;
  serverName: string;
  autoPost: boolean;
  publicBaseUrl: string;
  /** Master switch for telegram fan-out. */
  telegramEnabled: boolean;
  /**
   * Default Telegram chat ID where every Discord post is mirrored
   * (e.g. `-1001234567890` for a channel/group, or a user ID).
   */
  telegramBroadcastChatId: string;
  /** Per-channel override map (channel key → telegram chat id). */
  telegramChats: Record<string, string>;
  /** Telegram username users DM for VIP access (e.g. `@Dave_211`). */
  telegramDmHandle: string;
};

const DEFAULT_CONFIG: DiscordConfig = {
  webhooks: {},
  ownerHandle: "@baldwin_owner",
  ownerMention: "<@1035212407213133856>",
  serverName: "Baldwin Calls",
  autoPost: true,
  publicBaseUrl: "",
  telegramEnabled: true,
  telegramBroadcastChatId: "",
  telegramChats: {},
  telegramDmHandle: "@Dave_211",
};

/**
 * The "DM CTA" string used in posts — prefers the real Discord mention
 * (which actually pings) and falls back to the readable handle.
 */
export function dmTarget(cfg: Pick<DiscordConfig, "ownerMention" | "ownerHandle">): string {
  return (cfg.ownerMention && cfg.ownerMention.trim()) || cfg.ownerHandle;
}

/** Telegram DM target for VIP CTAs. */
export function tgDmTarget(cfg: Pick<DiscordConfig, "telegramDmHandle">): string {
  return cfg.telegramDmHandle || "@Dave_211";
}

/** Pick the right telegram chat id for a channel — per-channel override or broadcast fallback. */
export function telegramChatFor(
  cfg: Pick<DiscordConfig, "telegramChats" | "telegramBroadcastChatId">,
  channel: string,
): string {
  return (cfg.telegramChats?.[channel] || "").trim() || (cfg.telegramBroadcastChatId || "").trim();
}

let cached: DiscordConfig | null = null;

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function loadConfig(): Promise<DiscordConfig> {
  if (cached) return cached;
  await ensureDataDir();
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<DiscordConfig>;
    cached = { ...DEFAULT_CONFIG, ...parsed, webhooks: { ...(parsed.webhooks ?? {}) } };
  } catch {
    cached = { ...DEFAULT_CONFIG, webhooks: {} };
    await saveConfig(cached);
  }
  return cached;
}

export async function saveConfig(cfg: DiscordConfig): Promise<void> {
  await ensureDataDir();
  cached = cfg;
  await fs.writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf8");
}

export async function updateConfig(patch: Partial<DiscordConfig>): Promise<DiscordConfig> {
  const cur = await loadConfig();
  const next: DiscordConfig = {
    ...cur,
    ...patch,
    webhooks: { ...cur.webhooks, ...(patch.webhooks ?? {}) },
  };
  await saveConfig(next);
  return next;
}

export type HistoryEntry = {
  ts: number;
  channel: ChannelKey;
  ok: boolean;
  message: string;
};

export async function loadHistory(): Promise<HistoryEntry[]> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(HISTORY_PATH, "utf8");
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

export async function appendHistory(entry: HistoryEntry): Promise<void> {
  const list = await loadHistory();
  list.unshift(entry);
  const trimmed = list.slice(0, 200);
  await fs.writeFile(HISTORY_PATH, JSON.stringify(trimmed, null, 2), "utf8");
}

export function publicBaseUrlFromEnv(): string {
  const dev = process.env["REPLIT_DEV_DOMAIN"];
  if (dev) return `https://${dev}`;
  const domains = process.env["REPLIT_DOMAINS"];
  if (domains) {
    const first = domains.split(",")[0]?.trim();
    if (first) return `https://${first}`;
  }
  return "";
}
