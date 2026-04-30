import { logger } from "../lib/logger";
import { CHANNEL_KEYS, CHANNEL_META, type ChannelKey, loadConfig } from "./config";
import { GENERATORS } from "./generators";
import { freeCallLinkedTeaserFor, vipSnipePostFor } from "./generators/calls";
import { dailyRecapPost } from "./generators/announcements";
import { pickTrending } from "./marketdata";
import { sendToChannel } from "./poster";

type Timer = ReturnType<typeof setTimeout>;

const timers: Partial<Record<ChannelKey, Timer>> = {};
let linkedTimer: Timer | undefined;
let dailyRecapTimer: Timer | undefined;
let started = false;

/** UTC hour the daily recap fires (22:00 UTC = 6pm ET / 3pm PT). */
const DAILY_RECAP_HOUR_UTC = 22;

/** Pick which channel the recap goes to (announcements has the broadest reach). */
const DAILY_RECAP_CHANNEL: ChannelKey = "announcements";

/**
 * Channels that are NEVER scheduled independently — they fire as part of the
 * coupled "VIP-first" call cycle so VIP always gets the same token before free
 * chat sees the teaser.
 */
const LINKED_CHANNELS = new Set<ChannelKey>(["vip_snipes", "free_calls"]);

/**
 * Fire every recurring channel once right now, staggered by 3 s each so
 * Discord / Telegram don't rate-limit us. Runs silently — skips channels with
 * no webhook configured.
 */
export async function startupBurst(): Promise<void> {
  const recurringChannels = CHANNEL_KEYS
    .filter((ch) => !CHANNEL_META[ch].oneShot)
    .filter((ch) => !LINKED_CHANNELS.has(ch)); // linked cycle handles vip_snipes + free_calls
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
  // Fire one linked VIP→free cycle on startup as well (small offset so it
  // doesn't pile on the burst).
  setTimeout(() => {
    void runLinkedCallCycle().catch((err) =>
      logger.error({ err }, "startup linked call cycle failed"),
    );
  }, recurringChannels.length * 3_000 + 5_000);
}

/**
 * The single source of truth for "calls" — VIP gets the full CA first, then
 * the SAME token is teased in free chat after a short delay. Both Discord and
 * Telegram see this ordering (Telegram routing for vip_snipes goes to the VIP
 * group, free_calls goes to the broadcast group — see telegramChatFor()).
 */
async function runLinkedCallCycle(): Promise<void> {
  const cfg = await loadConfig();
  if (!cfg.autoPost) {
    logger.info("linked-cycle: autoPost off, skipping");
    return;
  }
  let token;
  try {
    token = await pickTrending({ minLiqUsd: 10_000, maxMcUsd: 8_000_000 });
  } catch (err) {
    logger.error({ err }, "linked-cycle: pickTrending failed");
    return;
  }
  // 1) VIP first — full CA goes to vip_snipes (and Telegram VIP chat).
  if (cfg.webhooks["vip_snipes"]) {
    try {
      const vipPayload = await vipSnipePostFor(token);
      await sendToChannel("vip_snipes", vipPayload);
      logger.info({ channel: "vip_snipes", token: token.symbol }, "linked-cycle: VIP posted FIRST");
    } catch (err) {
      logger.error({ err }, "linked-cycle: VIP post failed");
    }
  } else {
    logger.warn("linked-cycle: vip_snipes has no webhook — skipping VIP leg");
  }
  // 2) Free chat after a short, randomised lead — masked CA + "VIP got this N min ago".
  const leadMin = randInt(3, 9);
  logger.info({ leadMin, token: token.symbol }, "linked-cycle: scheduling free-chat teaser");
  setTimeout(async () => {
    try {
      const freshCfg = await loadConfig();
      if (!freshCfg.autoPost) return;
      if (!freshCfg.webhooks["free_calls"]) {
        logger.warn("linked-cycle: free_calls has no webhook — skipping free leg");
        return;
      }
      const freePayload = await freeCallLinkedTeaserFor(token, leadMin);
      await sendToChannel("free_calls", freePayload);
      logger.info({ channel: "free_calls", token: token.symbol, leadMin }, "linked-cycle: free chat posted AFTER VIP");
    } catch (err) {
      logger.error({ err }, "linked-cycle: free post failed");
    }
  }, leadMin * 60_000);
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function scheduleNextLinkedCycle(): void {
  // Recurring cadence between cycles (independent of the per-cycle lead).
  // Tightened to 15–28 min so the free channel stays active without spamming.
  const delayMs = (Math.random() * (28 - 15) + 15) * 60_000;
  const next = Math.round(delayMs / 60_000);
  logger.info({ nextInMin: next }, `discord-scheduler: next linked-call-cycle in ~${next}m`);
  linkedTimer = setTimeout(async () => {
    try {
      await runLinkedCallCycle();
    } catch (err) {
      logger.error({ err }, "linked-cycle tick failed");
    } finally {
      scheduleNextLinkedCycle();
    }
  }, delayMs);
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

/** Schedule the next daily-recap fire at the next 22:00 UTC. */
function scheduleNextDailyRecap(): void {
  const now = new Date();
  const next = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
    DAILY_RECAP_HOUR_UTC, 0, 0, 0,
  ));
  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  const delayMs = next.getTime() - now.getTime();
  logger.info({ fireAt: next.toISOString() }, `discord-scheduler: next daily-recap at ${next.toISOString()}`);
  dailyRecapTimer = setTimeout(async () => {
    try {
      const cfg = await loadConfig();
      if (cfg.autoPost && cfg.webhooks[DAILY_RECAP_CHANNEL]) {
        const payload = await dailyRecapPost();
        await sendToChannel(DAILY_RECAP_CHANNEL, payload);
        logger.info({ channel: DAILY_RECAP_CHANNEL }, "daily-recap: posted");
      } else {
        logger.warn("daily-recap: skipped (autoPost off or webhook missing)");
      }
    } catch (err) {
      logger.error({ err }, "daily-recap tick failed");
    } finally {
      scheduleNextDailyRecap();
    }
  }, delayMs);
}

export function startScheduler(): void {
  if (started) return;
  started = true;
  for (const ch of CHANNEL_KEYS) {
    if (CHANNEL_META[ch].oneShot) continue;
    if (LINKED_CHANNELS.has(ch)) continue; // handled by linked cycle
    scheduleNext(ch);
  }
  scheduleNextLinkedCycle();
  scheduleNextDailyRecap();
  logger.info("discord-scheduler: started (with VIP-first linked call cycle + daily recap)");
}

export function stopScheduler(): void {
  for (const k of Object.keys(timers) as ChannelKey[]) {
    const t = timers[k];
    if (t) clearTimeout(t);
    delete timers[k];
  }
  if (linkedTimer) {
    clearTimeout(linkedTimer);
    linkedTimer = undefined;
  }
  if (dailyRecapTimer) {
    clearTimeout(dailyRecapTimer);
    dailyRecapTimer = undefined;
  }
  started = false;
  logger.info("discord-scheduler: stopped");
}

export function isStarted(): boolean {
  return started;
}
