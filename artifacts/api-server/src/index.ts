import app from "./app";
import { logger } from "./lib/logger";
import { loadConfig } from "./discord/config";
import { startScheduler } from "./discord/scheduler";

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
    const cfg = await loadConfig();
    if (cfg.autoPost) {
      startScheduler();
    } else {
      logger.info("auto-post is OFF — toggle it on in the dashboard at /");
    }
  } catch (e) {
    logger.error({ err: e }, "failed to bootstrap discord scheduler");
  }
});
