import { logger } from "../lib/logger";
import {
  appendHistory,
  loadConfig,
  telegramChatFor,
  tgDmTarget,
  type ChannelKey,
  CHANNEL_META,
} from "./config";
import type { WebhookPayload, Embed } from "./poster";

/**
 * Telegram Bot API base URL. Token is taken from env at call time
 * (so it can be rotated without restarting).
 */
function botBase(): string | null {
  const token = (process.env["TELEGRAM_BOT_TOKEN"] || "").trim();
  if (!token) return null;
  return `https://api.telegram.org/bot${token}`;
}

export type TgStatus = {
  enabled: boolean;
  hasToken: boolean;
  botUsername?: string;
  lastError?: string;
  sends: number;
  lastSendAt?: number;
};

const status: TgStatus = {
  enabled: true,
  hasToken: false,
  sends: 0,
};

let inFlightMe: Promise<void> | null = null;

export function getTelegramStatus(): TgStatus {
  status.hasToken = Boolean((process.env["TELEGRAM_BOT_TOKEN"] || "").trim());
  return { ...status };
}

/** Resolve the bot's @username (cached). Surfaces auth issues fast. */
export async function probeBot(force = false): Promise<TgStatus> {
  status.hasToken = Boolean((process.env["TELEGRAM_BOT_TOKEN"] || "").trim());
  if (!status.hasToken) {
    status.lastError = "TELEGRAM_BOT_TOKEN not set";
    return getTelegramStatus();
  }
  if (status.botUsername && !force) return getTelegramStatus();
  if (inFlightMe) {
    await inFlightMe;
    return getTelegramStatus();
  }
  inFlightMe = (async () => {
    try {
      const base = botBase();
      if (!base) return;
      const res = await fetch(`${base}/getMe`);
      const j = (await res.json()) as { ok: boolean; result?: { username?: string }; description?: string };
      if (!j.ok) {
        status.lastError = j.description || `HTTP ${res.status}`;
        status.botUsername = undefined;
      } else {
        status.botUsername = j.result?.username;
        status.lastError = undefined;
      }
    } catch (err) {
      status.lastError = (err as Error).message;
    } finally {
      inFlightMe = null;
    }
  })();
  await inFlightMe;
  return getTelegramStatus();
}

/** Escape HTML for Telegram parse_mode=HTML. */
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Convert a Discord <@id> mention into a clean string. Telegram can't ping
 * Discord users — replace with the configured Telegram DM handle so VIP CTAs
 * still point users somewhere useful.
 */
function rewriteMentions(text: string, tgHandle: string): string {
  return text.replace(/<@!?\d+>/g, tgHandle);
}

/**
 * Convert Markdown-style [label](url) into Telegram HTML <a href="url">label</a>.
 * Bare URLs are left untouched so Telegram auto-linkifies them.
 */
function renderLinks(text: string): string {
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label: string, url: string) => {
    const safeUrl = url.replace(/"/g, "%22");
    return `<a href="${safeUrl}">${esc(label)}</a>`;
  });
}

/**
 * Extract a raw address from a Discord markdown code block like ```address```
 * or inline `address`. Returns null if not a code block value.
 */
function extractCodeBlock(val: string): string | null {
  // Triple backtick: ```address```
  const triple = val.match(/^```([^`]+)```$/);
  if (triple) return triple[1]!.trim();
  // Single backtick: `address`
  const single = val.match(/^`([^`]+)`$/);
  if (single) return single[1]!.trim();
  return null;
}

/**
 * Escape free text for Telegram HTML (preserving any backtick code spans
 * by converting them to <code>) and render markdown links as <a> tags.
 */
function richEscape(text: string, tgHandle: string): string {
  const withMentions = rewriteMentions(text, tgHandle);

  // Tokenize so we can escape free text while preserving code spans + links.
  const tokens: { kind: "text" | "code" | "link"; v1: string; v2?: string }[] = [];
  let i = 0;
  const re = /`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(withMentions)) !== null) {
    if (m.index > i) tokens.push({ kind: "text", v1: withMentions.slice(i, m.index) });
    if (m[1] !== undefined) tokens.push({ kind: "code", v1: m[1] });
    else if (m[2] !== undefined && m[3] !== undefined) tokens.push({ kind: "link", v1: m[2], v2: m[3] });
    i = m.index + m[0].length;
  }
  if (i < withMentions.length) tokens.push({ kind: "text", v1: withMentions.slice(i) });

  return tokens
    .map((t) => {
      if (t.kind === "code") return `<code>${esc(t.v1.trim())}</code>`;
      if (t.kind === "link") {
        const url = (t.v2 ?? "").replace(/"/g, "%22");
        return `<a href="${url}">${esc(t.v1)}</a>`;
      }
      // strip Discord markdown bold/italic markers so they don't show as raw asterisks
      const cleaned = t.v1.replace(/\*\*/g, "").replace(/__/g, "");
      return esc(cleaned);
    })
    .join("");
}

/**
 * Compact one Discord-style embed into a SHORT Telegram HTML block.
 * - Title (bold)
 * - First 1–2 sentences of description (max ~280 chars)
 * - CA (if present, as <code>)
 * - Chart link (first link found in fields, as <a>)
 * - DM CTA on its own line
 */
function embedToHtml(e: Embed, tgHandle: string): string {
  const parts: string[] = [];

  if (e.title) {
    parts.push(`<b>${richEscape(e.title, tgHandle)}</b>`);
  }

  if (e.description) {
    // Take first two non-empty paragraphs, capped to ~280 chars
    const paras = e.description.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    let summary = paras.slice(0, 2).join("\n\n");
    if (summary.length > 280) summary = summary.slice(0, 277) + "…";
    parts.push(richEscape(summary, tgHandle));
  }

  // Pull useful field bits: CA + chart link + key stats (price/mcap/24h)
  let ca: string | null = null;
  let chartLine: string | null = null;
  const stats: string[] = [];
  for (const f of e.fields ?? []) {
    const raw = rewriteMentions(f.value, tgHandle).trim();
    const code = extractCodeBlock(raw);
    if (code && !ca) {
      ca = code;
      continue;
    }
    if (/chart/i.test(f.name) && !chartLine) {
      chartLine = richEscape(raw, tgHandle);
      continue;
    }
    if (/(mcap|market|24h|liq|price|change|chain)/i.test(f.name) && stats.length < 3) {
      const val = richEscape(raw, tgHandle).replace(/\s+/g, " ").trim();
      if (val) stats.push(`${esc(f.name)}: ${val}`);
    }
  }

  if (stats.length) parts.push(stats.join(" • "));
  if (ca) parts.push(`CA: <code>${esc(ca)}</code>`);
  if (chartLine) parts.push(chartLine);

  return parts.filter(Boolean).join("\n");
}

/**
 * Convert a Discord WebhookPayload into a SHORT Telegram HTML message.
 * Telegram captions are capped at 1024 chars (vs 4096 for text), so we
 * keep the output compact and let the image carry the visual punch.
 */
function stripDiscordOnlyTokens(text: string): string {
  // @everyone / @here don't translate to Telegram, and the numeric mention
  // would render as plain "<@1234>" — drop both so captions stay clean.
  return text
    .replace(/@everyone/gi, "")
    .replace(/@here/gi, "")
    .replace(/<@!?\d+>/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function payloadToTelegram(
  payload: WebhookPayload,
  tgHandle: string,
): { text: string } {
  const blocks: string[] = [];

  if (payload.content) {
    const clean = stripDiscordOnlyTokens(payload.content);
    if (clean) blocks.push(richEscape(clean, tgHandle));
  }
  for (const e of payload.embeds ?? []) {
    blocks.push(embedToHtml(e, tgHandle));
  }
  let text = blocks.filter(Boolean).join("\n\n").trim();
  // Hard ceiling matching Telegram caption limit (sendPhoto = 1024)
  if (text.length > 1024) text = text.slice(0, 1021) + "…";
  if (!text) text = "(no content)";
  return { text };
}

export type TgSendResult = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  status?: number;
  error?: string;
  messageId?: number;
};

/**
 * Mirror a Discord webhook payload to the Telegram chat configured for `channel`.
 * No-op if telegram is disabled, has no token, or has no chat id mapped.
 */
export async function sendToTelegramForChannel(
  channel: ChannelKey,
  payload: WebhookPayload,
): Promise<TgSendResult> {
  const cfg = await loadConfig();
  if (!cfg.telegramEnabled) return { ok: false, skipped: true, reason: "disabled" };
  const base = botBase();
  if (!base) return { ok: false, skipped: true, reason: "no token" };
  const chatId = telegramChatFor(cfg, channel);
  if (!chatId) return { ok: false, skipped: true, reason: "no chat id" };

  return sendToTelegram(chatId, payload);
}

/** Low-level: send a payload to a specific chat id as plain text (no images, no links). */
export async function sendToTelegram(
  chatId: string,
  payload: WebhookPayload,
): Promise<TgSendResult> {
  const base = botBase();
  if (!base) return { ok: false, error: "TELEGRAM_BOT_TOKEN not set" };
  const cfg = await loadConfig();
  const tgHandle = tgDmTarget(cfg);
  const { text } = payloadToTelegram(payload, tgHandle);

  // Extract image URL from first embed (if any)
  const imageUrl = payload.embeds?.[0]?.image?.url;

  try {
    if (imageUrl) {
      // Send as photo with caption
      const caption = text.slice(0, 1024);
      const photoBody: Record<string, unknown> = {
        chat_id: chatId, photo: imageUrl, caption, parse_mode: "HTML",
      };
      const photoRes = await fetch(`${base}/sendPhoto`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(photoBody),
      });
      const j2 = (await photoRes.json().catch(() => ({}))) as { ok: boolean; description?: string; result?: { message_id?: number } };
      if (j2.ok) {
        status.sends++;
        status.lastSendAt = Date.now();
        status.lastError = undefined;
        return { ok: true, status: photoRes.status, messageId: j2.result?.message_id };
      }
      // fall through to text if photo fails
    }

    // Text-only send (fallback or no image)
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    };
    const res = await fetch(`${base}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = (await res.json().catch(() => ({}))) as {
      ok: boolean;
      description?: string;
      result?: { message_id?: number };
    };
    if (!j.ok) {
      status.lastError = j.description || `HTTP ${res.status}`;
      return { ok: false, status: res.status, error: status.lastError };
    }
    status.sends++;
    status.lastSendAt = Date.now();
    status.lastError = undefined;
    return { ok: true, status: res.status, messageId: j.result?.message_id };
  } catch (err) {
    const msg = (err as Error).message;
    status.lastError = msg;
    return { ok: false, error: msg };
  }
}

/** Discover chats the bot has been added to (via getUpdates). */
export type DiscoveredChat = {
  id: string;
  type: string;
  title: string;
  username?: string;
};

export async function discoverChats(): Promise<{ ok: boolean; chats: DiscoveredChat[]; error?: string }> {
  const base = botBase();
  if (!base) return { ok: false, chats: [], error: "TELEGRAM_BOT_TOKEN not set" };
  try {
    const res = await fetch(`${base}/getUpdates?timeout=0&limit=100`);
    const j = (await res.json()) as {
      ok: boolean;
      result?: Array<{
        message?: { chat?: { id: number; type: string; title?: string; username?: string; first_name?: string } };
        channel_post?: { chat?: { id: number; type: string; title?: string; username?: string } };
        my_chat_member?: { chat?: { id: number; type: string; title?: string; username?: string } };
      }>;
      description?: string;
    };
    if (!j.ok) return { ok: false, chats: [], error: j.description || `HTTP ${res.status}` };
    const seen = new Map<string, DiscoveredChat>();
    for (const upd of j.result ?? []) {
      const chat = upd.message?.chat ?? upd.channel_post?.chat ?? upd.my_chat_member?.chat;
      if (!chat) continue;
      const id = String(chat.id);
      if (seen.has(id)) continue;
      const title =
        chat.title ||
        ("first_name" in chat && (chat as { first_name?: string }).first_name) ||
        chat.username ||
        `chat ${id}`;
      seen.set(id, {
        id,
        type: chat.type,
        title: String(title),
        username: chat.username,
      });
    }
    return { ok: true, chats: Array.from(seen.values()) };
  } catch (err) {
    return { ok: false, chats: [], error: (err as Error).message };
  }
}

/** Convenience: write a TG send to the discord history feed so it shows in the UI. */
export async function logTelegramResult(channel: ChannelKey, result: TgSendResult): Promise<void> {
  const meta = CHANNEL_META[channel];
  if (result.skipped) return;
  if (result.ok) {
    logger.info({ channel }, `telegram: mirrored ${meta.label} (msg ${result.messageId})`);
    await appendHistory({
      ts: Date.now(),
      channel,
      ok: true,
      message: `→ telegram: ${meta.label} (msg ${result.messageId ?? "?"})`,
    });
  } else {
    logger.warn({ channel, err: result.error }, `telegram: failed ${meta.label}`);
    await appendHistory({
      ts: Date.now(),
      channel,
      ok: false,
      message: `→ telegram failed: ${result.error ?? "?"}`,
    });
  }
}
