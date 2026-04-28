import { createCanvas, type SKRSContext2D, type Canvas } from "@napi-rs/canvas";

const W = 1024;
const H = 576;

export type RenderInput = Record<string, string | undefined>;

export type RenderTemplate = (
  ctx: SKRSContext2D,
  input: RenderInput,
  rng: () => number,
) => void;

// Deterministic RNG so the same query string produces the same image.
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

// ---------- shared drawing helpers ----------

export function pickFrom<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

const PALETTES: Array<[string, string, string]> = [
  ["#0f172a", "#1e3a8a", "#22d3ee"], // navy / cyan
  ["#0a0f1f", "#312e81", "#a855f7"], // indigo / purple
  ["#020617", "#831843", "#ec4899"], // pink
  ["#0c0a09", "#7c2d12", "#f97316"], // orange
  ["#022c22", "#065f46", "#34d399"], // emerald
  ["#1c1917", "#3f3f46", "#facc15"], // gold
  ["#0c0a1a", "#4c1d95", "#f0abfc"], // violet
  ["#020617", "#0e7490", "#22d3ee"], // teal
  ["#1a0808", "#7f1d1d", "#fb7185"], // crimson
  ["#0a0a0a", "#262626", "#10b981"], // dark green
];

export function paintBackground(
  ctx: SKRSContext2D,
  rng: () => number,
  palette?: [string, string, string],
): [string, string, string] {
  const p = palette ?? pickFrom(rng, PALETTES);
  const [c1, c2, accent] = p;
  // diagonal gradient
  const angle = rng() * Math.PI * 2;
  const x = Math.cos(angle) * W;
  const y = Math.sin(angle) * H;
  const grad = ctx.createLinearGradient(W / 2 - x / 2, H / 2 - y / 2, W / 2 + x / 2, H / 2 + y / 2);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // soft glow blobs
  const blobs = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < blobs; i++) {
    const cx = rng() * W;
    const cy = rng() * H;
    const r = 140 + rng() * 260;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    const color = i === 0 ? accent : pickFrom(rng, [accent, c2, "#ffffff"]);
    g.addColorStop(0, hexAlpha(color, 0.35));
    g.addColorStop(1, hexAlpha(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // grid lines
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1;
  for (let x = 40; x < W; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 40; y < H; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // film grain noise
  const grain = ctx.createImageData(W, H);
  const data = grain.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.floor(rng() * 16);
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 14;
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
  ctx: SKRSContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
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
  let v = 0.5;
  for (let i = 0; i < points; i++) {
    const drift = trend === "up" ? 0.012 : trend === "down" ? -0.012 : 0;
    const noise = (rng() - 0.5) * 0.12;
    v = Math.min(1, Math.max(0, v + drift + noise));
    xs.push(x + (i / (points - 1)) * w);
    ys.push(y + h - v * h);
  }

  // area
  ctx.beginPath();
  ctx.moveTo(xs[0]!, y + h);
  for (let i = 0; i < points; i++) ctx.lineTo(xs[i]!, ys[i]!);
  ctx.lineTo(xs[points - 1]!, y + h);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, hexAlpha(color, 0.45));
  grad.addColorStop(1, hexAlpha(color, 0));
  ctx.fillStyle = grad;
  ctx.fill();

  // line
  ctx.beginPath();
  ctx.moveTo(xs[0]!, ys[0]!);
  for (let i = 1; i < points; i++) ctx.lineTo(xs[i]!, ys[i]!);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
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
  const n = 22;
  const cw = w / n;
  let price = 0.5;
  for (let i = 0; i < n; i++) {
    const drift = trend === "up" ? 0.02 : -0.02;
    const noise = (rng() - 0.5) * 0.18;
    const open = price;
    price = Math.min(0.95, Math.max(0.05, price + drift + noise));
    const close = price;
    const high = Math.max(open, close) + rng() * 0.05;
    const low = Math.min(open, close) - rng() * 0.05;
    const cx = x + i * cw + cw / 2;
    const isUp = close >= open;
    const color = isUp ? "#22c55e" : "#ef4444";
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.4;
    // wick
    ctx.beginPath();
    ctx.moveTo(cx, y + h - high * h);
    ctx.lineTo(cx, y + h - low * h);
    ctx.stroke();
    // body
    const bodyTop = y + h - Math.max(open, close) * h;
    const bodyH = Math.max(2, Math.abs(close - open) * h);
    ctx.fillRect(cx - cw * 0.32, bodyTop, cw * 0.64, bodyH);
  }
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

  // initials
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const initial = letters[Math.floor(rng() * letters.length)]!;
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = `800 ${r}px Sans`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initial, cx, cy + 2);
  ctx.restore();

  // ring
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = hexAlpha("#ffffff", 0.18);
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function brandFooter(
  ctx: SKRSContext2D,
  serverName: string,
  rightText: string,
  palette: [string, string, string],
): void {
  ctx.fillStyle = hexAlpha("#000000", 0.35);
  ctx.fillRect(0, H - 50, W, 50);
  drawText(ctx, `⚡ ${serverName}`, 30, H - 18, { size: 18, weight: "700", color: palette[2] });
  drawText(ctx, rightText, W - 30, H - 18, {
    size: 16,
    weight: "600",
    color: "rgba(255,255,255,0.85)",
    align: "right",
  });
}

export const SIZE = { W, H } as const;
