import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// UptimeRobot keepalive — cheap text response so the bot never sleeps on Render free.
router.get("/ping", (_req, res) => {
  res.type("text/plain").send("pong");
});

export default router;
