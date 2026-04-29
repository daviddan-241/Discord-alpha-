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

/** Convert one Discord-style embed to a Telegram-friendly HTML caption block. */
function embedToHtml(e: Embed, tgHandle: string): string {
  const parts: string[] = [];
  if (e.author?.name) parts.push(`<i>${esc(e.author.name)}</i>`);
  if (e.title) {
    const t = `<b>${esc(rewriteMentions(e.title, tgHandle))}</b>`;
    parts.push(e.url ? `<a href="${esc(e.url)}">${t}</a>` : t);
  }
  if (e.description) parts.push(esc(rewriteMentions(e.description, tgHandle)));
  if (e.fields?.length) {
    for (const f of e.fields) {
      parts.push(`\n<b>${esc(f.name)}</b>\n${esc(rewriteMentions(f.value, tgHandle))}`);
    }
  }
  if (e.footer?.text) parts.push(`\n<i>${esc(e.footer.text)}</i>`);
  return parts.join("\n");
}

/**
 * Convert a Discord WebhookPayload into:
 *  - a single photo URL (if any embed has an image), used as `photo`
 *  - a caption string (HTML)
 * Falls back to a plain text message if no images.
 */
function payloadToTelegram(
  payload: WebhookPayload,
  tgHandle: string,
): { photo?: string; text: string } {
  let photo: string | undefined;
  const blocks: string[] = [];

  if (payload.username) {
    blocks.push(`<b>${esc(payload.username)}</b>`);
  }
  if (payload.content) {
    blocks.push(esc(rewriteMentions(payload.content, tgHandle)));
  }
  for (const e of payload.embeds ?? []) {
    if (!photo && e.image?.url) photo = e.image.url;
    blocks.push(embedToHtml(e, tgHandle));
  }
  let text = blocks.filter(Boolean).join("\n\n").trim();
  // Telegram caption max = 1024, message max = 4096
  const cap = photo ? 1024 : 4096;
  if (text.length > cap) text = text.slice(0, cap - 3) + "…";
  if (!text) text = "(no content)";
  return { photo, text };
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

/** Low-level: send a payload to a specific chat id. */
export async function sendToTelegram(
  chatId: string,
  payload: WebhookPayload,
): Promise<TgSendResult> {
  const base = botBase();
  if (!base) return { ok: false, error: "TELEGRAM_BOT_TOKEN not set" };
  const cfg = await loadConfig();
  const tgHandle = tgDmTarget(cfg);
  const { photo, text } = payloadToTelegram(payload, tgHandle);

  try {
    const endpoint = photo ? "sendPhoto" : "sendMessage";
    const body: Record<string, unknown> = photo
      ? { chat_id: chatId, photo, caption: text, parse_mode: "HTML" }
      : { chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: false };

    const res = await fetch(`${base}/${endpoint}`, {
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
      // If sendPhoto chokes on the URL (Telegram can't fetch it), retry as plain text
      if (photo && /wrong type|failed to get http url|PHOTO_INVALID/i.test(j.description || "")) {
        return sendToTelegram(chatId, { ...payload, embeds: payload.embeds?.map((e) => ({ ...e, image: undefined })) });
      }
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
