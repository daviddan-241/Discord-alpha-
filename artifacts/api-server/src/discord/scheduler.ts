import { logger } from "../lib/logger";
import { CHANNEL_KEYS, CHANNEL_META, type ChannelKey, loadConfig } from "./config";
import { GENERATORS } from "./generators";
import { sendToChannel } from "./poster";

type Timer = ReturnType<typeof setTimeout>;

const timers: Partial<Record<ChannelKey, Timer>> = {};
let started = false;

/**
 * Fire every recurring channel once right now, staggered by 3 s each so
 * Discord / Telegram don't rate-limit us. Runs silently — skips channels with
 * no webhook configured.
 */
export async function startupBurst(): Promise<void> {
  const recurringChannels = CHANNEL_KEYS.filter((ch) => !CHANNEL_META[ch].oneShot);
  logger.info({ count: recurringChannels.length }, "scheduler: startup burst — firing all channels");
  for (let i = 0; i < recurringChannels.length; i++) {
    const ch = recurringChannels[i]!;
    // Stagger each by 3 s to avoid hitting rate limits
    setTimeout(async () => {
      try {
        const cfg = await loadConfig();
        if (!cfg.autoPost) return;
        if (!cfg.webhooks[ch]) return;
        const payload = await GENERATORS[ch]();
        await sendToChannel(ch, payload);
        logger.info({ channel: ch }, `startup burst: posted ${CHANNEL_META[ch].label}`);
      } catch (err) {
        logger.error({ err, channel: ch }, "startup burst: post failed (non-fatal)");
      }
    }, i * 3_000);
  }
}

function jitter(min: number, max: number): number {
  return (Math.random() * (max - min) + min) * 60_000;
}

function scheduleNext(channel: ChannelKey): void {
  const meta = CHANNEL_META[channel];
  if (meta.oneShot) return;

  const delay = jitter(meta.minMinutes, meta.maxMinutes);
  const next = Math.round(delay / 60_000);
  logger.info({ channel, nextInMin: next }, `discord-scheduler: next ${meta.label} in ~${next}m`);

  timers[channel] = setTimeout(async () => {
    try {
      const cfg = await loadConfig();
      if (!cfg.autoPost) {
        logger.info({ channel }, "scheduler: autoPost off, skipping tick");
      } else if (!cfg.webhooks[channel]) {
        logger.info({ channel }, "scheduler: no webhook, skipping tick");
      } else {
        const payload = await GENERATORS[channel]();
        await sendToChannel(channel, payload);
      }
    } catch (err) {
      logger.error({ err, channel }, "scheduler tick failed");
    } finally {
      scheduleNext(channel);
    }
  }, delay);
}

export function startScheduler(): void {
  if (started) return;
  started = true;
  for (const ch of CHANNEL_KEYS) {
    if (!CHANNEL_META[ch].oneShot) {
      scheduleNext(ch);
    }
  }
  logger.info("discord-scheduler: started");
}

export function stopScheduler(): void {
  for (const k of Object.keys(timers) as ChannelKey[]) {
    const t = timers[k];
    if (t) clearTimeout(t);
    delete timers[k];
  }
  started = false;
  logger.info("discord-scheduler: stopped");
}

export function isStarted(): boolean {
  return started;
}
