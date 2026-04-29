import { logger } from "../lib/logger";
import { appendHistory, loadConfig, type ChannelKey, CHANNEL_META, publicBaseUrlFromEnv } from "./config";
import { sendToTelegramForChannel, logTelegramResult } from "./telegram-poster";

export type Embed = {
  title?: string;
  description?: string;
  color?: number;
  url?: string;
  timestamp?: string;
  footer?: { text: string; icon_url?: string };
  thumbnail?: { url: string };
  image?: { url: string };
  author?: { name: string; icon_url?: string; url?: string };
  fields?: { name: string; value: string; inline?: boolean }[];
};

export type WebhookPayload = {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: Embed[];
  allowed_mentions?: { parse: string[] };
};

/**
 * Build a URL pointing at our dynamic image renderer
 * (e.g. `${base}/api/render/proof.png?ticker=...&x=...`).
 *
 * Discord caches embed images by URL forever, so include a `seed` query
 * param when you want every post to render a fresh, unique image.
 */
export async function renderUrl(
  template: string,
  params: Record<string, string | number | undefined> = {},
  format: "png" | "gif" = "png",
): Promise<string> {
  const cfg = await loadConfig();
  const base = cfg.publicBaseUrl || publicBaseUrlFromEnv();
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) sp.set(k, String(v));
  }
  if (!sp.has("seed")) {
    sp.set("seed", `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`);
  }
  return `${base}/api/render/${template}.${format}?${sp.toString()}`;
}

/**
 * Pick PNG or GIF for an embed image. We don't make every post animated —
 * roughly 1 in 3 (configurable) is a GIF so timelines feel "alive" but the
 * cheaper PNGs still dominate. Returns the same shape as `renderUrl`.
 */
export async function maybeAnimatedRenderUrl(
  template: string,
  params: Record<string, string | number | undefined> = {},
  options: { gifChance?: number; force?: "png" | "gif" } = {},
): Promise<string> {
  const force = options.force;
  if (force) return renderUrl(template, params, force);
  const chance = options.gifChance ?? 0.35;
  const fmt: "png" | "gif" = Math.random() < chance ? "gif" : "png";
  return renderUrl(template, params, fmt);
}

export async function sendToChannel(
  channel: ChannelKey,
  payload: WebhookPayload,
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const cfg = await loadConfig();
  const url = cfg.webhooks[channel];
  const meta = CHANNEL_META[channel];
  if (!url) {
    const msg = "no webhook configured";
    await appendHistory({ ts: Date.now(), channel, ok: false, message: msg });
    logger.warn({ channel }, `discord: skip ${meta.label} (${msg})`);
    return { ok: false, error: msg };
  }

  // Strip images — text-only embeds for clean, fast Discord posts
  const cleanEmbeds = payload.embeds?.map((e) => {
    const { image: _img, thumbnail: _thumb, ...rest } = e;
    return rest;
  });
  const body: WebhookPayload = {
    allowed_mentions: { parse: [] },
    ...payload,
    embeds: cleanEmbeds,
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const msg = `HTTP ${res.status}: ${text.slice(0, 180)}`;
      await appendHistory({ ts: Date.now(), channel, ok: false, message: msg });
      logger.error({ channel, status: res.status, text }, "discord post failed");
      return { ok: false, status: res.status, error: msg };
    }
    const summary = payload.embeds?.[0]?.title ?? payload.content?.slice(0, 80) ?? "(empty)";
    await appendHistory({ ts: Date.now(), channel, ok: true, message: summary });
    logger.info({ channel }, `discord: posted ${meta.label}`);

    // Fan out to Telegram (best-effort; never fails the discord send)
    void (async () => {
      try {
        const tg = await sendToTelegramForChannel(channel, payload);
        await logTelegramResult(channel, tg);
      } catch (err) {
        logger.error({ err, channel }, "telegram fan-out threw");
      }
    })();

    return { ok: true, status: res.status };
  } catch (err) {
    const msg = (err as Error).message ?? String(err);
    await appendHistory({ ts: Date.now(), channel, ok: false, message: msg });
    logger.error({ err, channel }, "discord post threw");
    return { ok: false, error: msg };
  }
}
