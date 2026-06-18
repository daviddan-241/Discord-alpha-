import type { SKRSContext2D } from "@napi-rs/canvas";
import {
  brandFooter,
  drawAccentLine,
  drawGlowText,
  drawHeaderBar,
  drawRealPriceChart,
  drawText,
  hexAlpha,
  paintBackground,
  roundedRect,
  SIZE,
  statBlock,
  type RenderInput,
  type RenderTemplate,
} from "./canvas";

const { W, H } = SIZE;
const RX  = 444;
const RW  = W - RX - 12;

function fmtMoney(n: number): string {
  if (!isFinite(n)) return "—";
  if (n >= 1_000_000_000) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1_000_000)     return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1_000)         return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function num(input: RenderInput, key: string, fallback: number): number {
  const v = input[key];
  if (v == null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str(input: RenderInput, key: string, fallback: string): string {
  const v = input[key];
  return v && v.length ? v : fallback;
}

function parseOhlcv(input: RenderInput): { t: number; c: number }[] {
  try {
    const r = input["ohlcv"];
    if (r) return JSON.parse(r) as { t: number; c: number }[];
  } catch {}
  return [];
}

// =================================================================
// BALDWIN — Professional Texas Style (Clean & Real)
// =================================================================
export const proofTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#0a0a0a", "#111111", "#1a1a1a"]);
  const [, , accent] = palette;
  const ticker = str(input, "ticker", "TOKEN");
  const x      = num(input, "x", 50);
  const entry  = num(input, "entry", 12_300);
  const server = str(input, "server", "Baldwin");
  const xText  = `${x.toFixed(x >= 100 ? 0 : 1)}x`;

  drawHeaderBar(ctx, "PROOF", "BALDWIN", accent);

  ctx.save();
  ctx.shadowColor = "#22c55e";
  ctx.shadowBlur  = 35;
  ctx.font        = `900 ${x >= 100 ? 118 : 138}px Sans`;
  ctx.fillStyle   = "#22c55e";
  ctx.fillText(xText, RX, 215);
  ctx.restore();

  drawText(ctx, `$${ticker.toUpperCase()}`, RX, 268, {
    size: 38, weight: "800", color: "#e5e5e5",
  });

  drawText(ctx, `Called at ${fmtMoney(entry)}`, RX, 305, {
    size: 20, weight: "600", color: "#a3a3a3",
  });

  brandFooter(ctx, server, "Baldwin", palette);
};

export const tradeTemplate: RenderTemplate = (ctx, input, rng) => {
  const direction   = str(input, "direction", "BUY");
  const accentColor = direction === "BUY" ? "#22c55e" : "#888888";
  const palette = paintBackground(ctx, rng, ["#0a0a0a", "#111111", "#1a1a1a"]);
  const ticker   = str(input, "ticker", "TOKEN");
  const server   = str(input, "server", "Baldwin");

  drawHeaderBar(ctx, "LIVE TRADE", "BALDWIN", accentColor);

  drawGlowText(ctx, direction, RX, 175, {
    size: 78, weight: "900", color: accentColor,
    glowColor: accentColor, glowRadius: 20,
  });

  drawGlowText(ctx, `$${ticker.toUpperCase()}`, RX, 245, {
    size: 42, weight: "900", color: "#ffffff",
    glowColor: hexAlpha("#ffffff", 0.1), glowRadius: 6,
  });

  brandFooter(ctx, server, "Baldwin", palette);
};

export const callTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#0a0a0a", "#111111", "#1a1a1a"]);
  const [, , accent] = palette;
  const ticker = str(input, "ticker", "TOKEN");
  const server = str(input, "server", "Baldwin");

  drawHeaderBar(ctx, "NEW CALL", "BALDWIN", accent);
  drawGlowText(ctx, `$${ticker.toUpperCase()}`, RX, 185, {
    size: 48, weight: "900", color: "#e5e5e5",
  });
  brandFooter(ctx, server, "Baldwin", palette);
};

export const vipTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#0a0a0a", "#111111", "#1a1a1a"]);
  const [, , accent] = palette;
  const ticker = str(input, "ticker", "TOKEN");
  const x      = num(input, "x", 12);
  const server = str(input, "server", "Baldwin");

  drawHeaderBar(ctx, "VIP ONLY", "BALDWIN", accent);
  drawGlowText(ctx, `$${ticker.toUpperCase()}`, RX, 178, {
    size: 44, weight: "900", color: "#e5e5e5",
  });
  drawGlowText(ctx, `${x.toFixed(1)}x`, RX, 255, {
    size: 86, weight: "900", color: "#22c55e",
    glowColor: "#22c55e", glowRadius: 26,
  });
  brandFooter(ctx, server, "Baldwin • VIP", palette);
};

// Professional Texas trending
export const trendingTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#0a0a0a", "#111111", "#1a1a1a"]);
  const [, , accent] = palette;
  const server = str(input, "server", "Baldwin");

  drawHeaderBar(ctx, "TRENDING", "BALDWIN", accent);
  drawText(ctx, "Top movers right now across DexScreener.", RX, 168, {
    size: 24, weight: "600", color: "#a3a3a3",
  });
  brandFooter(ctx, server, "Baldwin", palette);
};

export const TEMPLATES: Record<string, RenderTemplate> = {
  proof:    proofTemplate,
  call:     callTemplate,
  vip:      vipTemplate,
  trade:    tradeTemplate,
  trending: trendingTemplate,
  alpha:    alphaTemplate,
};
