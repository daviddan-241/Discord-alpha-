import { Router, type IRouter } from "express";
import { CHANNEL_KEYS, loadConfig, updateConfig, type ChannelKey } from "../discord/config";
import { GENERATORS } from "../discord/generators";
import {
  discoverChats,
  getTelegramStatus,
  probeBot,
  sendToTelegram,
  sendToTelegramForChannel,
} from "../discord/telegram-poster";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/telegram/state", async (_req, res) => {
  const cfg = await loadConfig();
  const probed = await probeBot(false);
  res.json({
    enabled: cfg.telegramEnabled,
    hasToken: probed.hasToken,
    botUsername: probed.botUsername,
    lastError: probed.lastError,
    sends: probed.sends,
    lastSendAt: probed.lastSendAt,
    broadcastChatId: cfg.telegramBroadcastChatId,
    vipChatId: cfg.telegramVipChatId,
    chats: cfg.telegramChats,
    dmHandle: cfg.telegramDmHandle,
  });
});

router.post("/telegram/config", async (req, res) => {
  const body = req.body as {
    enabled?: boolean;
    broadcastChatId?: string;
    vipChatId?: string;
    dmHandle?: string;
    chats?: Record<string, string>;
  };
  const patch: Parameters<typeof updateConfig>[0] = {};
  if (body.enabled !== undefined) patch.telegramEnabled = body.enabled;
  if (body.broadcastChatId !== undefined) patch.telegramBroadcastChatId = body.broadcastChatId.trim();
  if (body.vipChatId !== undefined) patch.telegramVipChatId = body.vipChatId.trim();
  if (body.dmHandle !== undefined) {
    let h = body.dmHandle.trim();
    if (h && !h.startsWith("@")) h = "@" + h;
    patch.telegramDmHandle = h;
  }
  if (body.chats) {
    // Merge per-channel overrides; empty string clears.
    const cur = (await loadConfig()).telegramChats;
    const next: Record<string, string> = { ...cur };
    for (const [k, v] of Object.entries(body.chats)) {
      if (typeof v !== "string") continue;
      if (!CHANNEL_KEYS.includes(k as ChannelKey)) continue;
      const trimmed = v.trim();
      if (trimmed) next[k] = trimmed;
      else delete next[k];
    }
    patch.telegramChats = next;
  }
  const cfg = await updateConfig(patch);
  res.json({
    ok: true,
    enabled: cfg.telegramEnabled,
    broadcastChatId: cfg.telegramBroadcastChatId,
    dmHandle: cfg.telegramDmHandle,
    chats: cfg.telegramChats,
  });
});

router.post("/telegram/discover", async (_req, res) => {
  const out = await discoverChats();
  res.json(out);
});

router.post("/telegram/probe", async (_req, res) => {
  const out = await probeBot(true);
  res.json(out);
});

router.post("/telegram/test", async (req, res) => {
  const body = req.body as { chatId?: string; channel?: string };
  const cfg = await loadConfig();
  const ch = (body.channel as ChannelKey) || "join_vip";
  if (!CHANNEL_KEYS.includes(ch)) {
    res.status(400).json({ ok: false, error: "invalid channel" });
    return;
  }
  const chatId = (body.chatId || cfg.telegramBroadcastChatId || cfg.telegramChats[ch] || "").trim();
  if (!chatId) {
    res.status(400).json({ ok: false, error: "no chat id provided or configured" });
    return;
  }
  try {
    const payload = await GENERATORS[ch]();
    const out = await sendToTelegram(chatId, payload);
    res.json(out);
  } catch (err) {
    logger.error({ err }, "telegram test failed");
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

router.post("/telegram/post-all", async (_req, res) => {
  const cfg = await loadConfig();
  if (!getTelegramStatus().hasToken) {
    res.status(400).json({ ok: false, error: "TELEGRAM_BOT_TOKEN not set" });
    return;
  }
  const results: { channel: ChannelKey; ok: boolean; error?: string; reason?: string }[] = [];
  for (const ch of CHANNEL_KEYS) {
    try {
      const payload = await GENERATORS[ch]();
      const out = await sendToTelegramForChannel(ch, payload);
      results.push({ channel: ch, ok: out.ok, error: out.error, reason: out.reason });
    } catch (err) {
      results.push({ channel: ch, ok: false, error: (err as Error).message });
    }
    // Telegram bot rate limit: ~30 msg/sec global, 1 msg/sec per chat
    await new Promise((r) => setTimeout(r, 250));
  }
  res.json({ ok: true, broadcastChatId: cfg.telegramBroadcastChatId, results });
});

export default router;
