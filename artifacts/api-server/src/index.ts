import app from "./app";
import { logger } from "./lib/logger";
import { loadConfig } from "./discord/config";
import { startScheduler, startupBurst } from "./discord/scheduler";
import { startVerifyBot } from "./discord/verify-bot";
import { startKeepalive } from "./discord/keepalive";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  try {
    await loadConfig();

    // Always start the scheduler — every tick re-checks autoPost & webhook
    // presence, so once the user pastes a webhook in the dashboard the next
    // scheduled tick will pick it up automatically.
    startScheduler();

    // Fire every configured channel once immediately (3 s stagger per channel)
    // so posts start flowing the moment the server is up — no waiting for the
    // first timer to expire.
    void startupBurst();

    // Self-pinger: hits /api/ping every 14 min so Render free tier never sleeps.
    startKeepalive();

    // Verification bot only connects if DISCORD_BOT_TOKEN + related env
    // vars are set. Without them it logs a "disabled" line and stays out
    // of the way — webhook posting still works.
    startVerifyBot();
  } catch (e) {
    logger.error({ err: e }, "failed to bootstrap discord scheduler");
  }
});
