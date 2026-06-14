import { createCanvas, loadImage, type SKRSContext2D, type Canvas } from "@napi-rs/canvas";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Dark cinematic theme — June 2026
// Palette: pure black + silver/gold/off-white accents. No neon, no bright hues.
// Pushed to https://github.com/daviddan-241/Discord-alpha-
export const THEME_VERSION = "dark-cinematic-v1";

const W = 1024;
const H = 576;

export type RenderInput = Record<string, string | undefined>;

export type RenderTemplate = (
  ctx: SKRSContext2D,
  input: RenderInput,
  rng: () => number,
) => void;

export function mulberry32(seedStr: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  let a = h >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function renderCard(template: RenderTemplate, input: RenderInput): Buffer {
  const seed = JSON.stringify(input);
  const rng = mulberry32(seed);
  const canvas: Canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  template(ctx, input, rng);
  return canvas.toBuffer("image/png");
}

export function pickFrom<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

// Dark cinematic palettes — [deep black, charcoal mid, accent]
// All accent tones are silver, gold, or off-white. No neon.
const PALETTES: Array<[string, string, string]> = [
  ["#000000", "#0d0d0d", "#c8c8c8"], // black + silver
  ["#000000", "#0a0807", "#d4af37"], // black + gold
  ["#000000", "#080808", "#e0e0e0"], // black + off-white
  ["#050505", "#0e0d0b", "#c5a028"], // near-black + warm gold
  ["#000000", "#0c0c0c", "#a0a0a0"], // black + steel
  ["#000000", "#0b0905", "#b8901a"], // black + bronze
  ["#000000", "#090909", "#d0d0d0"], // pure black + light silver
  ["#030303", "#111111", "#888888"], // deep black + mid-silver
  ["#000000", "#0a0908", "#e8c84a"], // black + bright gold
  ["#050505", "#100f0e", "#909090"], // near-black + cool silver
];

export function paintBackground(
  ctx: SKRSContext2D,
  rng: () => number,
  palette?: [string, string, string],
): [string, string, string] {
  const p = palette ?? pickFrom(rng, PALETTES);
  const [c1, , accent] = p;

  // Base fill — true black
  ctx.fillStyle = c1;
  ctx.fillRect(0, 0, W, H);

  // ── Statue image — LEFT PANEL ONLY (x=0 to 420), right side is pure dark
  const bgImg = _bgImage;
  if (bgImg) {
    ctx.save();
    ctx.globalAlpha = 0.88;
    const targetW = 420;
    const imgAspect = bgImg.width  / bgImg.height;
    const tgtAspect = targetW / H;
    let sx = 0, sy = 0, sw = bgImg.width, sh = bgImg.height;
    if (imgAspect > tgtAspect) {
      sw = bgImg.height * tgtAspect;
      sx = (bgImg.width - sw) / 2;
    } else {
      sh = bgImg.width / tgtAspect;
      sy = (bgImg.height - sh) / 2;
    }
    ctx.drawImage(bgImg as unknown as Parameters<typeof ctx.drawImage>[0], sx, sy, sw, sh, 0, 0, targetW, H);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ── Hard fade at divider: statue fades into black by x≈440
  const fade = ctx.createLinearGradient(0, 0, W, 0);
  fade.addColorStop(0,    "rgba(0,0,0,0)");
  fade.addColorStop(0.32, "rgba(0,0,0,0.15)");
  fade.addColorStop(0.40, "rgba(0,0,0,0.82)");
  fade.addColorStop(0.43, "rgba(0,0,0,0.97)");
  fade.addColorStop(1,    "rgba(0,0,0,1)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, W, H);

  // ── Thin vertical accent rule at the divider (x≈432)
  const divX = 432;
  const divRule = ctx.createLinearGradient(0, 0, 0, H);
  divRule.addColorStop(0,   "rgba(0,0,0,0)");
  divRule.addColorStop(0.15, hexAlpha(accent, 0.28));
  divRule.addColorStop(0.85, hexAlpha(accent, 0.28));
  divRule.addColorStop(1,   "rgba(0,0,0,0)");
  ctx.fillStyle = divRule;
  ctx.fillRect(divX, 0, 1, H);

  // Smoke / mist particles — composited so they don't erase the background
  const smokeC = createCanvas(W, H);
  const smokeG = smokeC.getContext("2d");
  const smokeData = smokeG.createImageData(W, H);
  const sd = smokeData.data;
  for (let i = 0; i < sd.length; i += 4) {
    if (rng() < 0.003) {
      const v = Math.floor(180 + rng() * 60);
      const a = Math.floor(rng() * 24);
      sd[i] = v; sd[i + 1] = v; sd[i + 2] = v; sd[i + 3] = a;
    }
  }
  smokeG.putImageData(smokeData, 0, 0);
  ctx.drawImage(smokeC as unknown as Parameters<typeof ctx.drawImage>[0], 0, 0);

  // Heavy cinematic vignette — the signature dark-corners look
  const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.18, W / 2, H / 2, H * 1.05);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.88)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  // Film grain — composited so it doesn't replace pixel alpha
  const grainC = createCanvas(W, H);
  const grainG = grainC.getContext("2d");
  const grainImg = grainG.createImageData(W, H);
  const gd = grainImg.data;
  for (let i = 0; i < gd.length; i += 4) {
    const v = Math.floor(rng() * 30);
    gd[i] = v; gd[i + 1] = v; gd[i + 2] = v; gd[i + 3] = 22;
  }
  grainG.putImageData(grainImg, 0, 0);
  ctx.drawImage(grainC as unknown as Parameters<typeof ctx.drawImage>[0], 0, 0);

  // Premium edge frame — thin silver/gold double ring
  const inset = 10;
  const edgeGrad = ctx.createLinearGradient(0, 0, W, H);
  edgeGrad.addColorStop(0, hexAlpha(accent, 0.7));
  edgeGrad.addColorStop(0.35, hexAlpha("#ffffff", 0.2));
  edgeGrad.addColorStop(0.65, hexAlpha(accent, 0.5));
  edgeGrad.addColorStop(1, hexAlpha(accent, 0.7));

  ctx.save();
  ctx.shadowColor = hexAlpha(accent, 0.4);
  ctx.shadowBlur = 8;
  roundedRect(ctx, inset, inset, W - inset * 2, H - inset * 2, 18);
  ctx.strokeStyle = edgeGrad;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Inner hairline — gives the frame a chiselled depth
  roundedRect(ctx, inset + 3, inset + 3, W - (inset + 3) * 2, H - (inset + 3) * 2, 15);
  ctx.strokeStyle = hexAlpha("#000000", 0.6);
  ctx.lineWidth = 1;
  ctx.stroke();

  return p;
}

export function hexAlpha(hex: string, a: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return `rgba(255,255,255,${a})`;
  const v = m[1]!;
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function roundedRect(
  ctx: SKRSContext2D, x: number, y: number, w: number, h: number, r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

export function drawGlowText(
  ctx: SKRSContext2D,
  text: string,
  x: number,
  y: number,
  opts: {
    size?: number;
    weight?: string;
    color?: string;
    align?: "left" | "center" | "right";
    glowColor?: string;
    glowRadius?: number;
    maxWidth?: number;
  } = {},
): void {
  const size = opts.size ?? 28;
  const weight = opts.weight ?? "900";
  const color = opts.color ?? "#ffffff";
  const glowColor = opts.glowColor ?? color;
  const glowRadius = opts.glowRadius ?? 14; // reduced — more refined
  ctx.font = `${weight} ${size}px Sans`;
  ctx.textAlign = opts.align ?? "left";
  ctx.textBaseline = "alphabetic";

  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = glowRadius;
  ctx.fillStyle = glowColor;
  const args: Parameters<typeof ctx.fillText> = opts.maxWidth
    ? [text, x, y, opts.maxWidth] : [text, x, y];
  for (let i = 0; i < 2; i++) ctx.fillText(...args);
  ctx.restore();

  ctx.fillStyle = color;
  if (opts.maxWidth) ctx.fillText(text, x, y, opts.maxWidth);
  else ctx.fillText(text, x, y);
}

export function drawText(
  ctx: SKRSContext2D,
  text: string,
  x: number,
  y: number,
  opts: {
    size?: number;
    weight?: "400" | "600" | "700" | "800" | "900";
    color?: string;
    align?: "left" | "center" | "right";
    baseline?: "top" | "middle" | "alphabetic" | "bottom";
    maxWidth?: number;
  } = {},
): void {
  const size = opts.size ?? 28;
  const weight = opts.weight ?? "700";
  ctx.font = `${weight} ${size}px Sans`;
  ctx.fillStyle = opts.color ?? "#ffffff";
  ctx.textAlign = opts.align ?? "left";
  ctx.textBaseline = opts.baseline ?? "alphabetic";
  if (opts.maxWidth) ctx.fillText(text, x, y, opts.maxWidth);
  else ctx.fillText(text, x, y);
}

export function wrapText(
  ctx: SKRSContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  opts: { size?: number; weight?: "400" | "600" | "700"; color?: string } = {},
): number {
  ctx.font = `${opts.weight ?? "400"} ${opts.size ?? 22}px Sans`;
  ctx.fillStyle = opts.color ?? "#ffffff";
  const words = text.split(/\s+/);
  let line = "";
  let cy = y;
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + " " + words[i] : words[i];
    const metrics = ctx.measureText(test ?? "");
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = words[i] ?? "";
      cy += lineHeight;
    } else {
      line = test ?? "";
    }
  }
  if (line) ctx.fillText(line, x, cy);
  return cy;
}

export function drawMoneyStacks(
  ctx: SKRSContext2D,
  cx: number,
  baseY: number,
  accent: string,
  rng: () => number,
): void {
  const stackCount = 7;
  const widths  = [230, 208, 186, 162, 136, 106, 78];
  const heights = [28,  26,  24,  22,  20,  18,  16];
  const gap = 20;

  for (let i = stackCount - 1; i >= 0; i--) {
    const w = widths[i]!;
    const h = heights[i]!;
    const sy = baseY - i * gap;
    const sx = cx - w / 2;

    roundedRect(ctx, sx, sy - h, w, h, 6);
    const stackAlpha = 0.18 + i * 0.08;
    ctx.fillStyle = hexAlpha(accent, stackAlpha);
    ctx.fill();

    const topGrad = ctx.createLinearGradient(sx, sy - h, sx, sy);
    topGrad.addColorStop(0, hexAlpha("#ffffff", 0.12));
    topGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = topGrad;
    roundedRect(ctx, sx, sy - h, w, h, 6);
    ctx.fill();

    ctx.strokeStyle = hexAlpha(accent, 0.28 + i * 0.06);
    ctx.lineWidth = 1.5;
    roundedRect(ctx, sx, sy - h, w, h, 6);
    ctx.stroke();

    if (i > 0) {
      const lineX = sx + 24 + rng() * (w - 48);
      ctx.strokeStyle = hexAlpha("#ffffff", 0.05);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lineX, sy - h + 4);
      ctx.lineTo(lineX + 30 + rng() * 40, sy - h + 4);
      ctx.stroke();
    }
  }

  const glowOrb = ctx.createRadialGradient(cx, baseY - stackCount * gap * 0.5, 0, cx, baseY - stackCount * gap * 0.5, 100);
  glowOrb.addColorStop(0, hexAlpha(accent, 0.10));
  glowOrb.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glowOrb;
  ctx.fillRect(cx - 130, baseY - stackCount * gap - 60, 260, 220);
}

export function drawGlowOrb(
  ctx: SKRSContext2D,
  cx: number,
  cy: number,
  r: number,
  accent: string,
  rng: () => number,
): void {
  const outerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.2);
  outerGlow.addColorStop(0, hexAlpha(accent, 0.18));
  outerGlow.addColorStop(0.5, hexAlpha(accent, 0.05));
  outerGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = outerGlow;
  ctx.fillRect(cx - r * 2.5, cy - r * 2.5, r * 5, r * 5);

  const rings = 3;
  for (let i = rings; i >= 1; i--) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * (0.35 + i * 0.2), 0, Math.PI * 2);
    ctx.strokeStyle = hexAlpha(accent, 0.05 + i * 0.03);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Dark metallic sphere
  const sphere = ctx.createRadialGradient(cx - r * 0.28, cy - r * 0.28, r * 0.05, cx, cy, r);
  sphere.addColorStop(0, hexAlpha("#e8e8e8", 0.55));
  sphere.addColorStop(0.25, hexAlpha(accent, 0.55));
  sphere.addColorStop(0.65, hexAlpha(accent, 0.18));
  sphere.addColorStop(1, hexAlpha("#000000", 0.7));
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = sphere;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = hexAlpha(accent, 0.3);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Short emanation lines — like crown rays but dim
  const rays = 6;
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2 + rng() * 0.4;
    const x1 = cx + Math.cos(angle) * (r + 8);
    const y1 = cy + Math.sin(angle) * (r + 8);
    const x2 = cx + Math.cos(angle) * (r + 22 + rng() * 18);
    const y2 = cy + Math.sin(angle) * (r + 22 + rng() * 18);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = hexAlpha(accent, 0.12 + rng() * 0.08);
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

export function drawPremiumBadge(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  text: string,
  accent: string,
  highlight = false,
): number {
  ctx.font = `800 17px Sans`;
  const tw = ctx.measureText(text).width;
  const bw = tw + 32;
  const bh = 38;

  roundedRect(ctx, x, y - bh + 8, bw, bh, bh / 2);
  if (highlight) {
    const hg = ctx.createLinearGradient(x, y - bh + 8, x + bw, y + 8);
    hg.addColorStop(0, hexAlpha(accent, 0.85));
    hg.addColorStop(1, hexAlpha(accent, 0.55));
    ctx.fillStyle = hg;
  } else {
    ctx.fillStyle = hexAlpha("#000000", 0.65);
  }
  ctx.fill();

  roundedRect(ctx, x, y - bh + 8, bw, bh, bh / 2);
  ctx.strokeStyle = hexAlpha(accent, highlight ? 0.8 : 0.35);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = highlight ? "#000000" : hexAlpha("#e8e8e8", 0.92);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, x + 16, y - 2);
  return bw + 12;
}

export function drawAccentLine(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  w: number,
  accent: string,
): void {
  const lg = ctx.createLinearGradient(x, y, x + w, y);
  lg.addColorStop(0, hexAlpha(accent, 0.85));
  lg.addColorStop(0.7, hexAlpha(accent, 0.3));
  lg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = lg;
  ctx.fillRect(x, y, w, 3);

  const glowLine = ctx.createLinearGradient(x, y, x + w, y);
  glowLine.addColorStop(0, hexAlpha(accent, 0.25));
  glowLine.addColorStop(0.7, hexAlpha(accent, 0.06));
  glowLine.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glowLine;
  ctx.fillRect(x, y - 3, w, 9);
}

export function drawSparkline(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rng: () => number,
  trend: "up" | "down" | "wave" = "up",
  color = "#c8c8c8",
): void {
  const points = 60;
  const xs: number[] = [];
  const ys: number[] = [];
  let v = trend === "up" ? 0.25 : 0.75;
  for (let i = 0; i < points; i++) {
    const drift = trend === "up" ? 0.014 : trend === "down" ? -0.014 : 0;
    const noise = (rng() - 0.5) * 0.1;
    v = Math.min(0.96, Math.max(0.04, v + drift + noise));
    xs.push(x + (i / (points - 1)) * w);
    ys.push(y + h - v * h);
  }
  ctx.beginPath();
  ctx.moveTo(xs[0]!, y + h);
  for (let i = 0; i < points; i++) ctx.lineTo(xs[i]!, ys[i]!);
  ctx.lineTo(xs[points - 1]!, y + h);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, hexAlpha(color, 0.35));
  grad.addColorStop(1, hexAlpha(color, 0.01));
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(xs[0]!, ys[0]!);
  for (let i = 1; i < points; i++) ctx.lineTo(xs[i]!, ys[i]!);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();

  const lastX = xs[points - 1]!;
  const lastY = ys[points - 1]!;
  const dotGlow = ctx.createRadialGradient(lastX, lastY, 0, lastX, lastY, 16);
  dotGlow.addColorStop(0, hexAlpha(color, 0.5));
  dotGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = dotGlow;
  ctx.fillRect(lastX - 18, lastY - 18, 36, 36);
  ctx.beginPath();
  ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(lastX, lastY, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
}

export function drawCandles(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rng: () => number,
  trend: "up" | "down" = "up",
): void {
  const n = 24;
  const cw = w / n;
  let price = trend === "up" ? 0.3 : 0.7;
  for (let i = 0; i < n; i++) {
    const drift = trend === "up" ? 0.018 : -0.018;
    const noise = (rng() - 0.5) * 0.14;
    const open = price;
    price = Math.min(0.95, Math.max(0.05, price + drift + noise));
    const close = price;
    const high = Math.max(open, close) + rng() * 0.04;
    const low = Math.min(open, close) - rng() * 0.04;
    const cx2 = x + i * cw + cw / 2;
    const isUp = close >= open;
    // Gold for up, silver for down — no neon
    const color = isUp ? "#d4af37" : "#888888";
    const alpha = 0.45 + i / n * 0.55;
    ctx.strokeStyle = hexAlpha(color, alpha);
    ctx.fillStyle = hexAlpha(color, alpha);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx2, y + h - high * h);
    ctx.lineTo(cx2, y + h - low * h);
    ctx.stroke();
    const bodyTop = y + h - Math.max(open, close) * h;
    const bodyH = Math.max(2, Math.abs(close - open) * h);
    ctx.fillRect(cx2 - cw * 0.34, bodyTop, cw * 0.68, bodyH);
  }
}

export function drawAvatar(
  ctx: SKRSContext2D,
  cx: number,
  cy: number,
  r: number,
  rng: () => number,
  palette: [string, string, string],
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  // Dark metallic avatar fill
  const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  g.addColorStop(0, hexAlpha(palette[2], 0.25));
  g.addColorStop(1, hexAlpha(palette[1], 0.8));
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const initial = letters[Math.floor(rng() * letters.length)]!;
  ctx.fillStyle = hexAlpha(palette[2], 0.9);
  ctx.font = `800 ${r}px Sans`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initial, cx, cy + 2);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = hexAlpha(palette[2], 0.35);
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export function brandFooter(
  ctx: SKRSContext2D,
  serverName: string,
  rightText: string,
  palette: [string, string, string],
): void {
  const [, , accent] = palette;
  const barH = 52;
  // Deep black footer bar
  ctx.fillStyle = hexAlpha("#000000", 0.85);
  ctx.fillRect(0, H - barH, W, barH);
  // Thin accent rule at top of bar
  const rule = ctx.createLinearGradient(0, 0, W, 0);
  rule.addColorStop(0, "rgba(0,0,0,0)");
  rule.addColorStop(0.2, hexAlpha(accent, 0.6));
  rule.addColorStop(0.8, hexAlpha(accent, 0.6));
  rule.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = rule;
  ctx.fillRect(0, H - barH, W, 1);

  ctx.font = `800 19px Sans`;
  ctx.fillStyle = hexAlpha(accent, 0.9);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`⚡ ${serverName}`, 28, H - barH + 33);

  ctx.font = `600 15px Sans`;
  ctx.fillStyle = hexAlpha("#d0d0d0", 0.55);
  ctx.textAlign = "right";
  ctx.fillText(rightText, W - 28, H - barH + 33);
}

export function drawHeaderBar(
  ctx: SKRSContext2D,
  leftLabel: string,
  rightLabel: string,
  accent: string,
): void {
  // Near-transparent dark bar
  ctx.fillStyle = hexAlpha("#000000", 0.55);
  ctx.fillRect(0, 0, W, 72);
  // Thin accent divider
  const divGrad = ctx.createLinearGradient(0, 0, W, 0);
  divGrad.addColorStop(0, "rgba(0,0,0,0)");
  divGrad.addColorStop(0.15, hexAlpha(accent, 0.5));
  divGrad.addColorStop(0.85, hexAlpha(accent, 0.5));
  divGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = divGrad;
  ctx.fillRect(0, 70, W, 1);

  ctx.save();
  ctx.shadowColor = hexAlpha(accent, 0.5);
  ctx.shadowBlur = 10;
  ctx.font = `800 19px Sans`;
  ctx.fillStyle = accent;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(leftLabel, 32, 46);
  ctx.restore();

  ctx.font = `600 15px Sans`;
  ctx.fillStyle = hexAlpha("#c8c8c8", 0.55);
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(rightLabel, W - 32, 46);
}

export function statBlock(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  label: string,
  value: string,
  palette: [string, string, string],
): void {
  const bw = 220;
  const bh = 90;
  const [, , accent] = palette;
  roundedRect(ctx, x, y, bw, bh, 14);
  ctx.fillStyle = hexAlpha("#000000", 0.65);
  ctx.fill();
  roundedRect(ctx, x, y, bw, bh, 14);
  ctx.strokeStyle = hexAlpha(accent, 0.22);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  drawText(ctx, label, x + 18, y + 30, { size: 13, weight: "700", color: hexAlpha(accent, 0.75) });
  drawText(ctx, value, x + 18, y + 66, { size: 28, weight: "900", color: "#e8e8e8" });
}

export function drawChip(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  text: string,
  palette: [string, string, string],
  highlight = false,
): void {
  const [, , accent] = palette;
  ctx.font = `800 15px Sans`;
  const tw = ctx.measureText(text).width;
  const bw = tw + 28;
  const bh = 34;
  roundedRect(ctx, x, y, bw, bh, bh / 2);
  ctx.fillStyle = highlight ? hexAlpha(accent, 0.8) : hexAlpha("#000000", 0.65);
  ctx.fill();
  roundedRect(ctx, x, y, bw, bh, bh / 2);
  ctx.strokeStyle = hexAlpha(accent, highlight ? 0.85 : 0.3);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = highlight ? "#000000" : hexAlpha("#e8e8e8", 0.88);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, x + 14, y + 23);
}

export const SIZE = { W, H } as const;

// ─── Background image (statue/figure) loaded once at startup ─────────────────

type CanvasImage = Awaited<ReturnType<typeof loadImage>>;
let _bgImage: CanvasImage | null = null;

export async function initCanvasAssets(): Promise<void> {
  try {
    const dir = dirname(fileURLToPath(import.meta.url));
    const imgPath = join(dir, "public", "dark-bg.jpg");
    _bgImage = await loadImage(imgPath);
    console.log("[canvas] background image loaded:", imgPath, _bgImage.width, "x", _bgImage.height);
  } catch (err) {
    console.warn("[canvas] background image not loaded:", (err as Error).message);
  }
}

export function getBackgroundImage(): CanvasImage | null {
  return _bgImage;
}

// ─── Film grain that composites ON TOP without replacing alpha ───────────────

export function drawFilmGrain(ctx: SKRSContext2D, rng: () => number, opacity = 18): void {
  const grainC = createCanvas(W, H);
  const grainG = grainC.getContext("2d");
  const img = grainG.createImageData(W, H);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.floor(rng() * 26);
    d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = opacity;
  }
  grainG.putImageData(img, 0, 0);
  ctx.drawImage(grainC as unknown as Parameters<typeof ctx.drawImage>[0], 0, 0);
}

// ─── Stat block with a sub-tag line ──────────────────────────────────────────

export function statBlockWithTag(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  w: number,
  label: string,
  value: string,
  tag: string,
  palette: [string, string, string],
): void {
  const bh = 92;
  const [, , accent] = palette;
  roundedRect(ctx, x, y, w, bh, 14);
  ctx.fillStyle = hexAlpha("#000000", 0.72);
  ctx.fill();
  roundedRect(ctx, x, y, w, bh, 14);
  ctx.strokeStyle = hexAlpha(accent, 0.22);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  drawText(ctx, label, x + 16, y + 24, { size: 12, weight: "700", color: hexAlpha(accent, 0.6) });
  drawText(ctx, value, x + 16, y + 60, { size: 26, weight: "900", color: "#e8e8e8" });
  drawText(ctx, tag, x + 16, y + 83, { size: 11, weight: "700", color: hexAlpha("#c8c8c8", 0.5) });
}

// ─── Real OHLCV price chart ───────────────────────────────────────────────────

function fmtChartPrice(p: number): string {
  if (p >= 1000) return p.toLocaleString("en", { maximumFractionDigits: 0 });
  if (p >= 1) return p.toFixed(2);
  if (p >= 0.01) return p.toFixed(4);
  if (p >= 0.0001) return p.toFixed(6);
  return p.toExponential(2);
}

export function drawRealPriceChart(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  points: { t: number; c: number }[],
  ticker: string,
  accent: string,
  rng: () => number,
): void {
  const PAD_T = 28;
  const PAD_B = 22;
  const PAD_R = 64;

  const cX = x;
  const cY = y + PAD_T;
  const cW = w - PAD_R;
  const cH = h - PAD_T - PAD_B;

  // Chart container
  roundedRect(ctx, x, y, w, h, 12);
  ctx.fillStyle = hexAlpha("#000000", 0.6);
  ctx.fill();
  roundedRect(ctx, x, y, w, h, 12);
  ctx.strokeStyle = hexAlpha("#ffffff", 0.07);
  ctx.lineWidth = 1;
  ctx.stroke();

  // Header label
  ctx.font = "800 11px Sans";
  ctx.fillStyle = hexAlpha("#ffffff", 0.88);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`$${ticker.toUpperCase()} PRICE ACTION`, cX + 12, y + 18);

  // Live dot + label
  const labelW = ctx.measureText(`$${ticker.toUpperCase()} PRICE ACTION`).width;
  ctx.beginPath();
  ctx.arc(cX + 12 + labelW + 18, y + 14, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#4ade80";
  ctx.fill();
  ctx.font = "600 10px Sans";
  ctx.fillStyle = hexAlpha("#ffffff", 0.4);
  ctx.fillText("LIVE CHART", cX + 12 + labelW + 28, y + 18);

  // If no real data — fall back to a generated sparkline inside the container
  if (points.length < 3) {
    drawSparkline(ctx, cX + 4, cY + 4, cW - 8, cH - 8, rng, "up", accent);
    return;
  }

  const prices = points.map((p) => p.c);
  const times = points.map((p) => p.t);
  const minP = Math.min(...prices) * 0.993;
  const maxP = Math.max(...prices) * 1.007;
  const priceRange = maxP - minP || 1;

  const toY = (p: number): number => cY + cH - ((p - minP) / priceRange) * cH;
  const toXi = (i: number): number => cX + (i / (points.length - 1)) * cW;

  // Subtle horizontal grid lines
  for (let i = 0; i <= 4; i++) {
    const gy = cY + (i / 4) * cH;
    ctx.beginPath();
    ctx.moveTo(cX, gy);
    ctx.lineTo(cX + cW, gy);
    ctx.strokeStyle = hexAlpha("#ffffff", 0.05);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Filled area under line
  ctx.beginPath();
  ctx.moveTo(toXi(0), cY + cH);
  for (let i = 0; i < points.length; i++) ctx.lineTo(toXi(i), toY(prices[i]!));
  ctx.lineTo(toXi(points.length - 1), cY + cH);
  ctx.closePath();
  const areaGrad = ctx.createLinearGradient(0, cY, 0, cY + cH);
  areaGrad.addColorStop(0, hexAlpha("#ffffff", 0.22));
  areaGrad.addColorStop(1, hexAlpha("#ffffff", 0.01));
  ctx.fillStyle = areaGrad;
  ctx.fill();

  // Price line
  ctx.beginPath();
  ctx.moveTo(toXi(0), toY(prices[0]!));
  for (let i = 1; i < points.length; i++) ctx.lineTo(toXi(i), toY(prices[i]!));
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();

  // End dot
  const lx = toXi(points.length - 1);
  const ly = toY(prices[prices.length - 1]!);
  const dotGlow = ctx.createRadialGradient(lx, ly, 0, lx, ly, 14);
  dotGlow.addColorStop(0, hexAlpha("#ffffff", 0.4));
  dotGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = dotGlow;
  ctx.fillRect(lx - 16, ly - 16, 32, 32);
  ctx.beginPath();
  ctx.arc(lx, ly, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(lx, ly, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = "#e0e0e0";
  ctx.fill();

  // Y-axis labels (right side)
  ctx.font = "600 10px Sans";
  ctx.fillStyle = hexAlpha("#c8c8c8", 0.6);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  for (let i = 0; i <= 3; i++) {
    const p = maxP - (priceRange * i) / 3;
    const gy = cY + (i / 3) * cH;
    ctx.fillText(fmtChartPrice(p), cX + cW + 4, gy);
  }

  // X-axis time labels
  ctx.font = "600 10px Sans";
  ctx.fillStyle = hexAlpha("#c8c8c8", 0.55);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const step = Math.max(1, Math.floor(points.length / 7));
  const shown = new Set<number>();
  for (let i = 0; i < points.length - 1; i += step) {
    const t = new Date(times[i]!);
    const label = `${String(t.getUTCHours()).padStart(2, "0")}:00`;
    ctx.fillText(label, toXi(i), cY + cH + 4);
    shown.add(i);
  }
  // Always show NOW at the last point
  const lastIdx = points.length - 1;
  if (!shown.has(lastIdx)) {
    ctx.fillText("NOW", toXi(lastIdx), cY + cH + 4);
  }
}
