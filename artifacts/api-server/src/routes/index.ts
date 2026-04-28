import express, { Router, type IRouter } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import healthRouter from "./health";
import discordRouter from "./discord";
import adminRouter from "./admin";
import renderRouter from "./render";

const __filename = fileURLToPath(import.meta.url);
const __moduleDir = path.dirname(__filename);
// At runtime, __moduleDir is the bundled dist/ folder. The build step copies
// the source `public/` directory into `dist/public/`, so we resolve to that.
const PUBLIC_DIR = path.resolve(__moduleDir, "public");

const router: IRouter = Router();

router.use(healthRouter);
router.use(discordRouter);
router.use(renderRouter);
router.use(adminRouter);

router.use(
  "/static",
  express.static(PUBLIC_DIR, { maxAge: "1h", fallthrough: true }),
);

export default router;
