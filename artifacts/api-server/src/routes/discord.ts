import { Router, type IRouter } from "express";
import {
  CHANNEL_KEYS,
  CHANNEL_META,
  appendHistory,
  loadConfig,
  loadHistory,
  publicBaseUrlFromEnv,
  updateConfig,
  type ChannelKey,
} from "../discord/config";
import { GENERATORS } from "../discord/generators";
import { sendToChannel } from "../discord/poster";
import { isStarted, startScheduler, stopScheduler } from "../discord/scheduler";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/discord/state", async (_req, res) => {
  const cfg = await loadConfig();
  const history = await loadHistory();
  const channels = CHANNEL_KEYS.map((k) => {
    const meta = CHANNEL_META[k];
    const last = history.find((h) => h.channel === k);
    return {
      key: k,
      label: meta.label,
      emoji: meta.emoji,
      oneShot: meta.oneShot,
      minMinutes: meta.minMinutes,
      maxMinutes: meta.maxMinutes,
      description: meta.description,
      hasWebhook: Boolean(cfg.webhooks[k]),
      webhookPreview: cfg.webhooks[k]
        ? `…${cfg.webhooks[k]!.slice(-12)}`
        : "",
      lastPost: last
        ? { ts: last.ts, ok: last.ok, message: last.message }
        : null,
    };
  });
  res.json({
    channels,
    autoPost: cfg.autoPost,
    schedulerRunning: isStarted(),
    ownerHandle: cfg.ownerHandle,
    serverName: cfg.serverName,
    publicBaseUrl: cfg.publicBaseUrl || publicBaseUrlFromEnv(),
    detectedPublicBaseUrl: publicBaseUrlFromEnv(),
    history: history.slice(0, 60),
  });
});

router.post("/discord/config", async (req, res) => {
  const body = req.body as {
    ownerHandle?: string;
    serverName?: string;
    autoPost?: boolean;
    publicBaseUrl?: string;
  };
  const next = await updateConfig({
    ...(body.ownerHandle !== undefined ? { ownerHandle: body.ownerHandle } : {}),
    ...(body.serverName !== undefined ? { serverName: body.serverName } : {}),
    ...(body.publicBaseUrl !== undefined ? { publicBaseUrl: body.publicBaseUrl } : {}),
    ...(body.autoPost !== undefined ? { autoPost: body.autoPost } : {}),
  });
  if (next.autoPost && !isStarted()) startScheduler();
  if (!next.autoPost && isStarted()) stopScheduler();
  res.json({ ok: true, autoPost: next.autoPost, schedulerRunning: isStarted() });
});

router.post("/discord/webhook", async (req, res) => {
  const body = req.body as { channel?: string; url?: string };
  if (!body.channel || !CHANNEL_KEYS.includes(body.channel as ChannelKey)) {
    res.status(400).json({ ok: false, error: "invalid channel" });
    return;
  }
  const url = (body.url ?? "").trim();
  if (url && !/^https:\/\/(?:[a-z]+\.)?discord(?:app)?\.com\/api\/webhooks\//i.test(url)) {
    res.status(400).json({ ok: false, error: "must be a discord webhook URL" });
    return;
  }
  const cfg = await loadConfig();
  const webhooks = { ...cfg.webhooks };
  if (url) webhooks[body.channel] = url;
  else delete webhooks[body.channel];
  await updateConfig({ webhooks });
  res.json({ ok: true });
});

router.post("/discord/preview", async (req, res) => {
  const body = req.body as { channel?: string };
  const ch = body.channel as ChannelKey | undefined;
  if (!ch || !CHANNEL_KEYS.includes(ch)) {
    res.status(400).json({ ok: false, error: "invalid channel" });
    return;
  }
  try {
    const payload = await GENERATORS[ch]();
    res.json({ ok: true, channel: ch, payload });
  } catch (err) {
    logger.error({ err, ch }, "preview generation failed");
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

router.post("/discord/test", async (req, res) => {
  const body = req.body as { channel?: string };
  const ch = body.channel as ChannelKey | undefined;
  if (!ch || !CHANNEL_KEYS.includes(ch)) {
    res.status(400).json({ ok: false, error: "invalid channel" });
    return;
  }
  try {
    const payload = await GENERATORS[ch]();
    const out = await sendToChannel(ch, payload);
    res.json(out);
  } catch (err) {
    logger.error({ err, ch }, "test send failed");
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

router.post("/discord/post-all", async (_req, res) => {
  const cfg = await loadConfig();
  const results: { channel: ChannelKey; ok: boolean; error?: string }[] = [];
  for (const ch of CHANNEL_KEYS) {
    if (!cfg.webhooks[ch]) {
      results.push({ channel: ch, ok: false, error: "no webhook" });
      continue;
    }
    try {
      const payload = await GENERATORS[ch]();
      const out = await sendToChannel(ch, payload);
      results.push({ channel: ch, ok: out.ok, error: out.error });
    } catch (err) {
      results.push({ channel: ch, ok: false, error: (err as Error).message });
    }
  }
  res.json({ results });
});

router.post("/discord/clear-history", async (_req, res) => {
  await appendHistory({ ts: Date.now(), channel: "alerts", ok: true, message: "history cleared by admin" });
  res.json({ ok: true });
});

export default router;
