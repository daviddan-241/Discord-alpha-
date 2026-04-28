import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

const FAVICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
  '<rect width="64" height="64" rx="14" fill="#0b0d12"/>' +
  '<path d="M34 6 L14 36 H28 L24 58 L50 26 H34 Z" fill="#c4b5fd"/>' +
  "</svg>";

app.get("/favicon.ico", (_req, res) => {
  res.setHeader("content-type", "image/svg+xml");
  res.setHeader("cache-control", "public, max-age=86400");
  res.send(FAVICON_SVG);
});

app.get("/", (_req, res) => {
  res.redirect(302, "/api/");
});

export default app;
