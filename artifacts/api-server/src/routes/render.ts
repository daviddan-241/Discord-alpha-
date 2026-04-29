import { Router, type IRouter } from "express";
import { TEMPLATES } from "../discord/render/templates";
import { renderCard } from "../discord/render/canvas";
import { renderAnimatedGif } from "../discord/render/animate";

const router: IRouter = Router();

function pickInput(query: Record<string, unknown>): Record<string, string | undefined> {
  const input: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(query)) {
    if (typeof v === "string") input[k] = v;
    else if (Array.isArray(v) && typeof v[0] === "string") input[k] = v[0];
  }
  return input;
}

router.get("/render/:type.png", (req, res) => {
  const type = req.params.type;
  const tpl = TEMPLATES[type];
  if (!tpl) {
    res.status(404).type("text/plain").send("unknown template");
    return;
  }
  try {
    const buf = renderCard(tpl, pickInput(req.query as Record<string, unknown>));
    res.setHeader("content-type", "image/png");
    res.setHeader("cache-control", "public, max-age=86400, immutable");
    res.end(buf);
  } catch (err) {
    res.status(500).type("text/plain").send(`render error: ${(err as Error).message}`);
  }
});

router.get("/render/:type.gif", (req, res) => {
  const type = req.params.type;
  const tpl = TEMPLATES[type];
  if (!tpl) {
    res.status(404).type("text/plain").send("unknown template");
    return;
  }
  try {
    const buf = renderAnimatedGif(type, tpl, pickInput(req.query as Record<string, unknown>));
    res.setHeader("content-type", "image/gif");
    res.setHeader("cache-control", "public, max-age=86400, immutable");
    res.end(buf);
  } catch (err) {
    res.status(500).type("text/plain").send(`gif render error: ${(err as Error).message}`);
  }
});

export default router;
