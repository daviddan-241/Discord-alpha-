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
 * Strip all hyperlinks from text — removes Markdown-style [text](url)
 * and bare https:// / http:// URLs so Telegram posts stay clean with
 * no clickable chart / explorer links.
 */
function stripLinks(text: string): string {
  return text
    .replace(/\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/ {2,}/g, " ")
    .trim();
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
 * Convert description text that may contain inline backtick blocks (like `address`)
 * to Telegram HTML where those become <code>address</code>.
 */
function convertInlineCode(text: string, tgHandle: string): string {
  const cleaned = stripLinks(rewriteMentions(text, tgHandle));
  // Replace inline `code` spans with <code>…</code>
  return cleaned.replace(/`([^`]+)`/g, (_m, inner: string) => `<code>${esc(inner.trim())}</code>`);
}

/** Convert one Discord-style embed to a clean Telegram HTML block (no links). */
function embedToHtml(e: Embed, tgHandle: string): string {
  const parts: string[] = [];
  if (e.author?.name) parts.push(`<i>${esc(e.author.name)}</i>`);
  if (e.title) {
    parts.push(`<b>${esc(stripLinks(rewriteMentions(e.title, tgHandle)))}</b>`);
  }
  if (e.description) {
    parts.push(convertInlineCode(e.description, tgHandle));
  }
  if (e.fields?.length) {
    for (const f of e.fields) {
      const raw = rewriteMentions(f.value, tgHandle).trim();
      // Check if the entire field value is a code block (e.g. a CA address)
      const codeAddr = extractCodeBlock(raw);
      if (codeAddr) {
        parts.push(`\n<b>${esc(f.name)}</b>\n<code>${esc(codeAddr)}</code>`);
        continue;
      }
      // Otherwise strip links and escape normally
      const val = stripLinks(raw).trim();
      if (!val) continue;
      parts.push(`\n<b>${esc(f.name)}</b>\n${esc(val)}`);
    }
  }
  if (e.footer?.text) parts.push(`\n<i>${esc(e.footer.text)}</i>`);
  return parts.join("\n");
}

/**
 * Convert a Discord WebhookPayload into plain Telegram HTML text.
 * Never includes photos or clickable URLs — clean text-only output.
 */
function payloadToTelegram(
  payload: WebhookPayload,
  tgHandle: string,
): { text: string } {
  const blocks: string[] = [];

  if (payload.username) {
    blocks.push(`<b>${esc(payload.username)}</b>`);
  }
  if (payload.content) {
    blocks.push(esc(stripLinks(rewriteMentions(payload.content, tgHandle))));
  }
  for (const e of payload.embeds ?? []) {
    blocks.push(embedToHtml(e, tgHandle));
  }
  let text = blocks.filter(Boolean).join("\n\n").trim();
  if (text.length > 4096) text = text.slice(0, 4093) + "…";
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
    let res: Response;
    if (imageUrl) {
      // Send as photo with caption (max 1024 chars for captions)
      const caption = text.slice(0, 1024);
      const body: Record<string, unknown> = {
        chat_id: chatId,
        photo: imageUrl,
        caption,
        parse_mode: "HTML",
      };
      res = await fetch(`${base}/sendPhoto`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      // If photo send fails (e.g. URL not yet cached), fall back to text
      const j2 = (await res.json().catch(() => ({}))) as { ok: boolean; description?: string; result?: { message_id?: number } };
      if (!j2.ok) {
        const textBody: Record<string, unknown> = {
          chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true,
        };
        const res2 = await fetch(`${base}/sendMessage`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(textBody),
        });
        const j3 = (await res2.json().catch(() => ({}))) as { ok: boolean; description?: string; result?: { message_id?: number } };
        if (!j3.ok) {
          status.lastError = j3.description || `HTTP ${res2.status}`;
          return { ok: false, status: res2.status, error: status.lastError };
        }
        status.sends++;
        status.lastSendAt = Date.now();
        status.lastError = undefined;
        return { ok: true, status: res2.status, messageId: j3.result?.message_id };
      }
      status.sends++;
      status.lastSendAt = Date.now();
      status.lastError = undefined;
      return { ok: true, status: res.status, messageId: j2.result?.message_id };
    }

    // Text-only send
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    };
    res = await fetch(`${base}/sendMessage`, {
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
