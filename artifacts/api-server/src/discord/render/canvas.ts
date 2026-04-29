import { createCanvas, type SKRSContext2D, type Canvas } from "@napi-rs/canvas";

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

const PALETTES: Array<[string, string, string]> = [
  ["#030c12", "#0e3a26", "#00e676"],
  ["#07050f", "#1a0a40", "#b66fff"],
  ["#030610", "#0b1d4a", "#38bdf8"],
  ["#0f0700", "#3a1200", "#ff8c00"],
  ["#080010", "#2a0050", "#e040fb"],
  ["#030f0a", "#043020", "#00ffa3"],
  ["#0a0a0a", "#1a1a2e", "#f1c40f"],
  ["#050010", "#1e0038", "#a78bfa"],
  ["#030812", "#0c2340", "#00d4ff"],
  ["#060003", "#220010", "#ff4081"],
];

export function paintBackground(
  ctx: SKRSContext2D,
  rng: () => number,
  palette?: [string, string, string],
): [string, string, string] {
  const p = palette ?? pickFrom(rng, PALETTES);
  const [c1, c2, accent] = p;

  ctx.fillStyle = c1;
  ctx.fillRect(0, 0, W, H);

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, c1);
  grad.addColorStop(0.55, c2);
  grad.addColorStop(1, hexAlpha(accent, 0.35));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 4; i++) {
    const cx = rng() * W;
    const cy = rng() * H;
    const r = 200 + rng() * 340;
    const color = i === 0 ? accent : i === 1 ? c2 : accent;
    const alpha = i === 0 ? 0.22 : 0.12;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, hexAlpha(color, alpha));
    g.addColorStop(0.5, hexAlpha(color, alpha * 0.4));
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  const bigGlow = ctx.createRadialGradient(W * 0.78, H * 0.42, 0, W * 0.78, H * 0.42, 340);
  bigGlow.addColorStop(0, hexAlpha(accent, 0.18));
  bigGlow.addColorStop(0.6, hexAlpha(accent, 0.06));
  bigGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = bigGlow;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = hexAlpha(accent, 0.04);
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 56) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 56) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.7)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  const grain = ctx.createImageData(W, H);
  const data = grain.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.floor(rng() * 22);
    data[i] = v; data[i + 1] = v; data[i + 2] = v; data[i + 3] = 18;
  }
  ctx.putImageData(grain, 0, 0);

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
  const glowRadius = opts.glowRadius ?? 24;
  ctx.font = `${weight} ${size}px Sans`;
  ctx.textAlign = opts.align ?? "left";
  ctx.textBaseline = "alphabetic";

  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = glowRadius;
  ctx.fillStyle = glowColor;
  const args: Parameters<typeof ctx.fillText> = opts.maxWidth
    ? [text, x, y, opts.maxWidth] : [text, x, y];
  for (let i = 0; i < 3; i++) ctx.fillText(...args);
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
    const stackAlpha = 0.28 + i * 0.1;
    ctx.fillStyle = hexAlpha(accent, stackAlpha);
    ctx.fill();

    const topGrad = ctx.createLinearGradient(sx, sy - h, sx, sy);
    topGrad.addColorStop(0, hexAlpha("#ffffff", 0.18));
    topGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = topGrad;
    roundedRect(ctx, sx, sy - h, w, h, 6);
    ctx.fill();

    ctx.strokeStyle = hexAlpha(accent, 0.35 + i * 0.08);
    ctx.lineWidth = 1.5;
    roundedRect(ctx, sx, sy - h, w, h, 6);
    ctx.stroke();

    if (i > 0) {
      const lineX = sx + 24 + rng() * (w - 48);
      ctx.strokeStyle = hexAlpha("#ffffff", 0.07);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lineX, sy - h + 4);
      ctx.lineTo(lineX + 30 + rng() * 40, sy - h + 4);
      ctx.stroke();
    }
  }

  const glowOrb = ctx.createRadialGradient(cx, baseY - stackCount * gap * 0.5, 0, cx, baseY - stackCount * gap * 0.5, 120);
  glowOrb.addColorStop(0, hexAlpha(accent, 0.15));
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
  const outerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.4);
  outerGlow.addColorStop(0, hexAlpha(accent, 0.28));
  outerGlow.addColorStop(0.5, hexAlpha(accent, 0.08));
  outerGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = outerGlow;
  ctx.fillRect(cx - r * 2.5, cy - r * 2.5, r * 5, r * 5);

  const rings = 4;
  for (let i = rings; i >= 1; i--) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * (0.35 + i * 0.18), 0, Math.PI * 2);
    ctx.strokeStyle = hexAlpha(accent, 0.06 + i * 0.04);
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  const sphere = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.05, cx, cy, r);
  sphere.addColorStop(0, hexAlpha("#ffffff", 0.6));
  sphere.addColorStop(0.3, hexAlpha(accent, 0.7));
  sphere.addColorStop(0.7, hexAlpha(accent, 0.4));
  sphere.addColorStop(1, hexAlpha("#000000", 0.5));
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = sphere;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = hexAlpha("#ffffff", 0.15);
  ctx.lineWidth = 2;
  ctx.stroke();

  const rays = 8;
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2 + rng() * 0.3;
    const x1 = cx + Math.cos(angle) * (r + 10);
    const y1 = cy + Math.sin(angle) * (r + 10);
    const x2 = cx + Math.cos(angle) * (r + 30 + rng() * 30);
    const y2 = cy + Math.sin(angle) * (r + 30 + rng() * 30);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = hexAlpha(accent, 0.2 + rng() * 0.15);
    ctx.lineWidth = 1.5;
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
    hg.addColorStop(0, hexAlpha(accent, 0.9));
    hg.addColorStop(1, hexAlpha(accent, 0.6));
    ctx.fillStyle = hg;
  } else {
    ctx.fillStyle = hexAlpha("#000000", 0.55);
  }
  ctx.fill();

  roundedRect(ctx, x, y - bh + 8, bw, bh, bh / 2);
  ctx.strokeStyle = hexAlpha(accent, highlight ? 0.9 : 0.4);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = highlight ? "#000000" : hexAlpha("#ffffff", 0.95);
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
  lg.addColorStop(0, hexAlpha(accent, 0.9));
  lg.addColorStop(0.6, hexAlpha(accent, 0.4));
  lg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = lg;
  ctx.fillRect(x, y, w, 4);

  const glowLine = ctx.createLinearGradient(x, y, x + w, y);
  glowLine.addColorStop(0, hexAlpha(accent, 0.4));
  glowLine.addColorStop(0.6, hexAlpha(accent, 0.1));
  glowLine.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glowLine;
  ctx.fillRect(x, y - 3, w, 10);
}

export function drawSparkline(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rng: () => number,
  trend: "up" | "down" | "wave" = "up",
  color = "#34d399",
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
  grad.addColorStop(0, hexAlpha(color, 0.5));
  grad.addColorStop(1, hexAlpha(color, 0.02));
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(xs[0]!, ys[0]!);
  for (let i = 1; i < points; i++) ctx.lineTo(xs[i]!, ys[i]!);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();

  const lastX = xs[points - 1]!;
  const lastY = ys[points - 1]!;
  const dotGlow = ctx.createRadialGradient(lastX, lastY, 0, lastX, lastY, 20);
  dotGlow.addColorStop(0, hexAlpha(color, 0.6));
  dotGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = dotGlow;
  ctx.fillRect(lastX - 22, lastY - 22, 44, 44);
  ctx.beginPath();
  ctx.arc(lastX, lastY, 6, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
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
    const color = isUp ? "#22c55e" : "#ef4444";
    const alpha = 0.55 + i / n * 0.45;
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
  const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  g.addColorStop(0, palette[2]);
  g.addColorStop(1, palette[1]);
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const initial = letters[Math.floor(rng() * letters.length)]!;
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = `800 ${r}px Sans`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initial, cx, cy + 2);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = hexAlpha("#ffffff", 0.2);
  ctx.lineWidth = 2;
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
  ctx.fillStyle = hexAlpha("#000000", 0.6);
  ctx.fillRect(0, H - barH, W, barH);
  ctx.fillStyle = hexAlpha(accent, 0.5);
  ctx.fillRect(0, H - barH, W, 2);

  const logoGrad = ctx.createLinearGradient(28, 0, 200, 0);
  logoGrad.addColorStop(0, accent);
  logoGrad.addColorStop(1, hexAlpha(accent, 0.75));
  ctx.font = `800 19px Sans`;
  ctx.fillStyle = logoGrad;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`⚡ ${serverName}`, 28, H - barH + 33);

  ctx.font = `600 15px Sans`;
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.textAlign = "right";
  ctx.fillText(rightText, W - 28, H - barH + 33);

  ctx.fillStyle = hexAlpha(accent, 0.12);
  ctx.fillRect(0, H - barH - 1, W, 1);
}

export function drawHeaderBar(
  ctx: SKRSContext2D,
  leftLabel: string,
  rightLabel: string,
  accent: string,
): void {
  ctx.fillStyle = hexAlpha("#000000", 0.4);
  ctx.fillRect(0, 0, W, 72);
  ctx.fillStyle = hexAlpha(accent, 0.35);
  ctx.fillRect(0, 70, W, 2);

  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = 14;
  ctx.font = `800 19px Sans`;
  ctx.fillStyle = accent;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(leftLabel, 32, 46);
  ctx.restore();

  ctx.font = `600 15px Sans`;
  ctx.fillStyle = "rgba(255,255,255,0.65)";
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
  ctx.fillStyle = hexAlpha("#000000", 0.5);
  ctx.fill();
  roundedRect(ctx, x, y, bw, bh, 14);
  ctx.strokeStyle = hexAlpha(accent, 0.25);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  drawText(ctx, label, x + 18, y + 30, { size: 13, weight: "700", color: hexAlpha(accent, 0.85) });
  drawText(ctx, value, x + 18, y + 66, { size: 28, weight: "900", color: "#ffffff" });
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
  ctx.fillStyle = highlight ? hexAlpha(accent, 0.85) : hexAlpha("#000000", 0.55);
  ctx.fill();
  roundedRect(ctx, x, y, bw, bh, bh / 2);
  ctx.strokeStyle = hexAlpha(accent, highlight ? 0.9 : 0.35);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = highlight ? "#000000" : "rgba(255,255,255,0.92)";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, x + 14, y + 23);
}

export const SIZE = { W, H } as const;
