import { Router, type IRouter } from "express";
import { TEMPLATES } from "../discord/render/templates";
import { renderCard } from "../discord/render/canvas";

const router: IRouter = Router();

router.get("/render/:type.png", (req, res) => {
  const type = req.params.type;
  const tpl = TEMPLATES[type];
  if (!tpl) {
    res.status(404).type("text/plain").send("unknown template");
    return;
  }
  // express may give string|string[]|undefined per query value — coerce to string|undefined
  const input: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(req.query)) {
    if (typeof v === "string") input[k] = v;
    else if (Array.isArray(v) && typeof v[0] === "string") input[k] = v[0];
  }
  try {
    const buf = renderCard(tpl, input);
    res.setHeader("content-type", "image/png");
    res.setHeader("cache-control", "public, max-age=86400, immutable");
    res.end(buf);
  } catch (err) {
    res.status(500).type("text/plain").send(`render error: ${(err as Error).message}`);
  }
});

export default router;
