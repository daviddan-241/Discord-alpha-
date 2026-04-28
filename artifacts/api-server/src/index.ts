import app from "./app";
import { logger } from "./lib/logger";
import { loadConfig } from "./discord/config";
import { startScheduler } from "./discord/scheduler";
import { startVerifyBot } from "./discord/verify-bot";

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
    // Verification bot only connects if DISCORD_BOT_TOKEN + related env
    // vars are set. Without them it logs a "disabled" line and stays out
    // of the way — webhook posting still works.
    startVerifyBot();
  } catch (e) {
    logger.error({ err: e }, "failed to bootstrap discord scheduler");
  }
});
