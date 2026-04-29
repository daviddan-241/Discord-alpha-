import { logger } from "../lib/logger";
import { publicBaseUrlFromEnv, loadConfig } from "./config";

const PING_INTERVAL_MS = 14 * 60 * 1000; // 14 min — just under Render's 15 min sleep

let pinger: ReturnType<typeof setInterval> | null = null;

async function getPingUrl(): Promise<string | null> {
  const fromEnv = publicBaseUrlFromEnv();
  if (fromEnv) return `${fromEnv}/api/ping`;
  try {
    const cfg = await loadConfig();
    const base = (cfg.publicBaseUrl || "").trim();
    if (base) return `${base}/api/ping`;
  } catch {}
  return null;
}

async function doPing(): Promise<void> {
  const url = await getPingUrl();
  if (!url) return; // no public URL configured yet
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    logger.info({ status: res.status, url }, "keepalive: self-ping ok");
  } catch (err) {
    logger.warn({ err, url }, "keepalive: self-ping failed (non-fatal)");
  }
}

export function startKeepalive(): void {
  if (pinger) return;

  // Immediate first ping
  void doPing();

  pinger = setInterval(() => void doPing(), PING_INTERVAL_MS);
  logger.info({ intervalMin: 14 }, "keepalive: started (14-min self-ping for Render free tier)");
}

export function stopKeepalive(): void {
  if (pinger) {
    clearInterval(pinger);
    pinger = null;
  }
}
