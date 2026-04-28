import { Router, type IRouter } from "express";
import { DASHBOARD_HTML } from "../admin/dashboard";

const router: IRouter = Router();

router.get(["/", "/admin"], (_req, res) => {
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.send(DASHBOARD_HTML);
});

export default router;
