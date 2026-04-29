import { createCanvas, type SKRSContext2D } from "@napi-rs/canvas";
import { GIFEncoder, quantize, applyPalette } from "gifenc";
import { mulberry32, SIZE, type RenderInput, type RenderTemplate } from "./canvas";

const { W, H } = SIZE;

/**
 * Animated overlays we layer on top of any static template to make a GIF.
 * Each variant is a function `(ctx, t, rng)` where `t` ∈ [0,1) is the
 * normalized loop time. Designed to feel like a "live" trading card.
 */
type Overlay = (ctx: SKRSContext2D, t: number, rng: () => number, accent: string) => void;

const TAU = Math.PI * 2;

/** Pulsing glowing ring traveling diagonally — adds energy to call/proof cards. */
const pulsingRings: Overlay = (ctx, t, _rng, accent) => {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 3; i++) {
    const phase = (t + i / 3) % 1;
    const radius = 60 + phase * 220;
    const alpha = (1 - phase) * 0.35;
    ctx.beginPath();
    ctx.arc(W - 200, 220, radius, 0, TAU);
    ctx.strokeStyle = hex(accent, alpha);
    ctx.lineWidth = 4 - phase * 3;
    ctx.stroke();
  }
  ctx.restore();
};

/** Diagonal shimmer band sweeping across the card — gives it a "fresh" vibe. */
const shimmerSweep: Overlay = (ctx, t, _rng, _accent) => {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const x = -300 + (W + 600) * t;
  const grad = ctx.createLinearGradient(x - 80, 0, x + 80, H);
  grad.addColorStop(0, "rgba(255,255,255,0)");
  grad.addColorStop(0.5, "rgba(255,255,255,0.18)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.translate(x, 0);
  ctx.rotate(-0.18);
  ctx.translate(-x, 0);
  ctx.fillRect(x - 200, -100, 400, H + 200);
  ctx.restore();
};

/** Floating up-arrows (rocket exhaust) drifting upward — for proof / pump cards. */
const floatingArrows: Overlay = (ctx, t, rng, accent) => {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const count = 14;
  const myRng = mulberry32(`arrows-${count}`);
  for (let i = 0; i < count; i++) {
    const baseX = myRng() * W;
    const speed = 0.6 + myRng() * 0.8;
    const phase = (t * speed + myRng()) % 1;
    const y = H + 40 - phase * (H + 80);
    const alpha = Math.sin(phase * Math.PI) * 0.6;
    const size = 12 + myRng() * 14;
    ctx.fillStyle = hex(accent, alpha);
    ctx.font = `${Math.round(size)}px Sans`;
    ctx.fillText("▲", baseX, y);
  }
  ctx.restore();
};

/** Bottom-edge ticker tape line that scrolls right-to-left. */
const tapeTicker: Overlay = (ctx, t, rng, accent) => {
  ctx.save();
  // background bar
  const barH = 36;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(0, H - barH, W, barH);
  // moving text
  const items = ["• LIVE", "• REAL CALLS", "• REAL FILLS", "• ALPHA", "• VIP NOW", "• BALDWIN CALLS"];
  const text = items.join("   ").repeat(3);
  ctx.font = "700 18px Sans";
  ctx.fillStyle = hex(accent, 0.95);
  const totalWidth = ctx.measureText(text).width;
  const offset = -((t * totalWidth) % totalWidth);
  ctx.fillText(text, offset, H - 12);
  ctx.fillText(text, offset + totalWidth, H - 12);
  ctx.restore();
  void rng;
};

/** Heartbeat dot in the top-right corner for "LIVE" feel. */
const liveDot: Overlay = (ctx, t, _rng, _accent) => {
  ctx.save();
  const pulse = 0.5 + 0.5 * Math.sin(t * TAU * 2);
  ctx.beginPath();
  ctx.arc(W - 50, 56, 7 + pulse * 2, 0, TAU);
  ctx.fillStyle = "#ef4444";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(W - 50, 56, 14 + pulse * 8, 0, TAU);
  ctx.strokeStyle = `rgba(239,68,68,${0.6 - pulse * 0.5})`;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = "700 14px Sans";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.textAlign = "right";
  ctx.fillText("LIVE", W - 64, 61);
  ctx.restore();
};

/**
 * Pre-baked overlay combos per template type. Each combo is rendered on top of
 * the (static) underlying template. Keep it short so encoding stays fast.
 */
const COMBOS: Record<string, Overlay[]> = {
  proof: [pulsingRings, floatingArrows, shimmerSweep, tapeTicker],
  call: [pulsingRings, shimmerSweep, liveDot],
  trending: [shimmerSweep, tapeTicker],
  trade: [pulsingRings, liveDot, tapeTicker],
  whale: [pulsingRings, liveDot],
  snipe: [pulsingRings, shimmerSweep, liveDot],
  vip: [floatingArrows, shimmerSweep, tapeTicker],
  alpha: [shimmerSweep, liveDot],
  alert: [liveDot, pulsingRings],
  market: [shimmerSweep, tapeTicker],
  early: [floatingArrows, shimmerSweep, liveDot],
  price: [shimmerSweep, liveDot],
  gas: [shimmerSweep, liveDot],
  announce: [shimmerSweep, tapeTicker],
  chat: [shimmerSweep],
  info: [shimmerSweep],
};

function hex(color: string, alpha: number): string {
  // Accepts "#rrggbb" or "rgb()/rgba()" forms — only handle "#rrggbb" here, fallback otherwise.
  const m = /^#([0-9a-f]{6})$/i.exec(color);
  if (!m) return color;
  const v = parseInt(m[1]!, 16);
  const r = (v >> 16) & 0xff;
  const g = (v >> 8) & 0xff;
  const b = v & 0xff;
  return `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
}

const ANIM_CACHE = new Map<string, { ts: number; buf: Buffer }>();
const ANIM_TTL_MS = 5 * 60 * 1000;
const ANIM_MAX_ENTRIES = 60;

function cacheKey(name: string, input: RenderInput): string {
  return name + "|" + JSON.stringify(input);
}

export type AnimateOptions = {
  /** Number of frames in the loop. Default 18. */
  frames?: number;
  /** Per-frame delay in ms. Default 70 (~14fps). */
  delay?: number;
  /** Accent color used by overlays. */
  accent?: string;
};

/**
 * Render a static template once, then layer an animated overlay on top of it
 * across N frames, encode as GIF.
 *
 * We re-paint the entire scene each frame instead of caching the static layer,
 * because @napi-rs/canvas's drawImage(canvas) is just as fast as a raw fill
 * and avoids RGBA copies between buffers. Total cost is tiny (~150ms for 18
 * frames at 1024×576 with a 256-color palette).
 */
export function renderAnimatedGif(
  templateName: string,
  template: RenderTemplate,
  input: RenderInput,
  opts: AnimateOptions = {},
): Buffer {
  const key = cacheKey(templateName, input);
  const cached = ANIM_CACHE.get(key);
  const now = Date.now();
  if (cached && now - cached.ts < ANIM_TTL_MS) return cached.buf;

  const frames = opts.frames ?? 18;
  const delay = opts.delay ?? 70;
  const overlays = COMBOS[templateName] ?? [shimmerSweep, liveDot];
  const accent = opts.accent ?? "#22d3ee";

  const enc = GIFEncoder();
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // Use the same seed each frame so the static layer is identical.
  const seed = JSON.stringify(input);

  for (let i = 0; i < frames; i++) {
    const t = i / frames;

    // 1. Static base — re-render fresh each frame from same seed
    const baseRng = mulberry32(seed);
    template(ctx, input, baseRng);

    // 2. Animated overlays
    const overlayRng = mulberry32(seed + ":overlay");
    for (const ov of overlays) ov(ctx, t, overlayRng, accent);

    // 3. Quantize + emit frame
    const data = ctx.getImageData(0, 0, W, H).data as unknown as Uint8Array | Uint8ClampedArray;
    const u8 = data instanceof Uint8Array ? data : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    const palette = quantize(u8, 256, { format: "rgba4444" });
    const indexed = applyPalette(u8, palette, "rgba4444");
    enc.writeFrame(indexed, W, H, { palette, delay, transparent: false });
  }
  enc.finish();
  const buf = Buffer.from(enc.bytes());

  if (ANIM_CACHE.size >= ANIM_MAX_ENTRIES) {
    // Drop oldest entry (Map preserves insertion order)
    const firstKey = ANIM_CACHE.keys().next().value;
    if (firstKey !== undefined) ANIM_CACHE.delete(firstKey);
  }
  ANIM_CACHE.set(key, { ts: now, buf });
  return buf;
}

/** Templates that have an animated overlay registered. Other names still work
 *  but get a generic shimmer + LIVE dot. */
export function hasAnimator(name: string): boolean {
  return name in COMBOS;
}
