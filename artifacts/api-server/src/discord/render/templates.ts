import type { SKRSContext2D } from "@napi-rs/canvas";
import {
  brandFooter,
  drawAccentLine,
  drawAvatar,
  drawChip,
  drawFilmGrain,
  drawGlowOrb,
  drawGlowText,
  drawHeaderBar,
  drawMoneyStacks,
  drawPremiumBadge,
  drawRealPriceChart,
  drawSparkline,
  drawText,
  getBackgroundImage,
  hexAlpha,
  paintBackground,
  pickFrom,
  roundedRect,
  SIZE,
  statBlock,
  statBlockWithTag,
  wrapText,
  type RenderInput,
  type RenderTemplate,
} from "./canvas";

const { W, H } = SIZE;

// ─── Right-panel layout constants ────────────────────────────────────────────
// Statue image occupies x=0..420 (left panel). ALL content lives on the right.
const RX  = 444;                          // right-panel x start
const RW  = W - RX - 12;                 // right-panel content width  ≈ 568
const RC  = RX + Math.round(RW / 2);     // right-panel center x       ≈ 728
const SW3 = Math.floor((RW - 24) / 3);   // stat-block width when 3    ≈ 181
const SW2 = Math.floor((RW - 12) / 2);   // stat-block width when 2    ≈ 278

// Dark, elite label pool for proof badges
const ELITE_TAGS = [
  "CONFIRMED RECEIPT",
  "VIP HAD IT FIRST",
  "CLEAN EXECUTION",
  "PRECISION ENTRY",
  "VERIFIED RESULT",
  "ALPHA DELIVERED",
  "POSITION CLOSED",
  "FLAWLESS CALL",
];

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
  } catch { /* fall back */ }
  return [];
}

// =================================================================
// PROOF — left: statue | right: ticker + multiplier + chart + badges
// =================================================================
export const proofTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#000000", "#0a0800", "#d4af37"]);
  const [, , accent] = palette;
  const ticker = str(input, "ticker", "TOKEN");
  const x      = num(input, "x", 50);
  const entry  = num(input, "entry", 12_300);
  const ath    = Math.round(entry * x);
  const server = str(input, "server", "Baldwin Calls");
  const handle = str(input, "handle", "@apex");
  const xText  = `${x.toFixed(x >= 100 ? 0 : 1)}x`;
  const ohlcv  = parseOhlcv(input);

  drawHeaderBar(ctx, "PROOF RECEIPT", server.toUpperCase(), accent);

  // Ticker label
  drawText(ctx, `$${ticker.toUpperCase()}`, RX, 116, {
    size: 52, weight: "900", color: "#e8e8e8",
  });
  drawAccentLine(ctx, RX, 122, 200, accent);

  // Big multiplier — gold glow
  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur  = 35;
  ctx.font        = `900 ${x >= 100 ? 128 : 148}px Sans`;
  ctx.fillStyle   = accent;
  ctx.textAlign   = "left";
  ctx.textBaseline = "alphabetic";
  for (let i = 0; i < 3; i++) ctx.fillText(xText, RX, 265);
  ctx.restore();
  ctx.font        = `900 ${x >= 100 ? 128 : 148}px Sans`;
  ctx.fillStyle   = "#ffffff";
  ctx.textAlign   = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(xText, RX, 265);

  // Real price chart
  drawRealPriceChart(ctx, RX, 282, RW - 8, 168, ohlcv, ticker, accent, rng);

  // Badges
  let bx = RX;
  bx += drawPremiumBadge(ctx, bx, 464, `Entry ${fmtMoney(entry)}`, accent);
  bx += drawPremiumBadge(ctx, bx, 464, `ATH ${fmtMoney(ath)}`, accent);
  bx += drawPremiumBadge(ctx, bx, 464, pickFrom(rng, ELITE_TAGS), accent, true);

  drawText(ctx, `DM ${handle} to access VIP`, RX, 500, {
    size: 18, weight: "700", color: hexAlpha("#d0d0d0", 0.72),
  });

  brandFooter(ctx, server, `Receipts · ${new Date().toUTCString().slice(5, 22)}`, palette);
};

// =================================================================
// CALL — left: statue | right: ticker + stat boxes + chart + badges
// =================================================================
export const callTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette: [string, string, string] = ["#000000", "#0c0c0c", "#c8c8c8"];
  const [, , accent] = palette;

  const ticker = str(input, "ticker", "TOKEN");
  const mc     = num(input, "mc",  178_200);
  const liq    = num(input, "liq",  32_500);
  const chain  = str(input, "chain", "Solana");
  const dex    = str(input, "dex",   "PumpSwap");
  const server = str(input, "server", "Baldwin Calls");
  const ohlcv  = parseOhlcv(input);

  // ── Background: true black
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, W, H);

  // ── Statue image — LEFT PANEL ONLY (0..420)
  const bgImg = getBackgroundImage();
  if (bgImg) {
    ctx.save();
    ctx.globalAlpha = 0.88;
    const targetW   = 420;
    const imgAspect = bgImg.width  / bgImg.height;
    const tgtAspect = targetW / H;
    let sx = 0, sy = 0, sw = bgImg.width, sh = bgImg.height;
    if (imgAspect > tgtAspect) { sw = bgImg.height * tgtAspect; sx = (bgImg.width - sw) / 2; }
    else                        { sh = bgImg.width / tgtAspect;  sy = (bgImg.height - sh) / 2; }
    ctx.drawImage(bgImg as unknown as Parameters<typeof ctx.drawImage>[0], sx, sy, sw, sh, 0, 0, targetW, H);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ── Hard fade + divider rule
  const fade = ctx.createLinearGradient(0, 0, W, 0);
  fade.addColorStop(0,    "rgba(0,0,0,0)");
  fade.addColorStop(0.32, "rgba(0,0,0,0.15)");
  fade.addColorStop(0.40, "rgba(0,0,0,0.82)");
  fade.addColorStop(0.43, "rgba(0,0,0,0.97)");
  fade.addColorStop(1,    "rgba(0,0,0,1)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, W, H);
  const divRule = ctx.createLinearGradient(0, 0, 0, H);
  divRule.addColorStop(0,    "rgba(0,0,0,0)");
  divRule.addColorStop(0.15, hexAlpha(accent, 0.28));
  divRule.addColorStop(0.85, hexAlpha(accent, 0.28));
  divRule.addColorStop(1,    "rgba(0,0,0,0)");
  ctx.fillStyle = divRule;
  ctx.fillRect(432, 0, 1, H);

  drawFilmGrain(ctx, rng, 18);

  // ── Premium edge frame
  const inset    = 8;
  const edgeGrad = ctx.createLinearGradient(0, 0, W, H);
  edgeGrad.addColorStop(0,   hexAlpha(accent, 0.55));
  edgeGrad.addColorStop(0.5, hexAlpha("#ffffff", 0.15));
  edgeGrad.addColorStop(1,   hexAlpha(accent, 0.55));
  roundedRect(ctx, inset, inset, W - inset * 2, H - inset * 2, 16);
  ctx.strokeStyle = edgeGrad;
  ctx.lineWidth   = 1.5;
  ctx.stroke();

  // ── Top bar
  ctx.fillStyle = hexAlpha("#000000", 0.55);
  ctx.fillRect(0, 0, W, 52);
  const divGrad = ctx.createLinearGradient(0, 0, W, 0);
  divGrad.addColorStop(0,   "rgba(0,0,0,0)");
  divGrad.addColorStop(0.1, hexAlpha(accent, 0.4));
  divGrad.addColorStop(0.9, hexAlpha(accent, 0.4));
  divGrad.addColorStop(1,   "rgba(0,0,0,0)");
  ctx.fillStyle = divGrad;
  ctx.fillRect(0, 51, W, 1);
  ctx.save();
  ctx.shadowColor  = hexAlpha(accent, 0.4);
  ctx.shadowBlur   = 8;
  ctx.font         = "800 18px Sans";
  ctx.fillStyle    = "#ffffff";
  ctx.textAlign    = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("⚡ BALDWIN CALLS", 22, 35);
  ctx.restore();
  ctx.font         = "600 13px Sans";
  ctx.fillStyle    = hexAlpha("#c8c8c8", 0.65);
  ctx.textAlign    = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`${chain.toUpperCase()} • ${dex.toUpperCase()}`, W - 104, 35);
  const liveX = W - 92;
  roundedRect(ctx, liveX, 13, 76, 26, 13);
  ctx.fillStyle = hexAlpha("#000000", 0.8);
  ctx.fill();
  roundedRect(ctx, liveX, 13, 76, 26, 13);
  ctx.strokeStyle = hexAlpha(accent, 0.5);
  ctx.lineWidth   = 1.5;
  ctx.stroke();
  ctx.font      = "800 13px Sans";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.fillText("LIVE", liveX + 10, 31);
  ctx.beginPath();
  ctx.arc(liveX + 60, 26, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#4ade80";
  ctx.fill();

  // ── Ticker (right panel)
  drawGlowText(ctx, `$${ticker.toUpperCase()}`, RX, 152, {
    size: 86, weight: "900", color: "#ffffff",
    glowColor: "#ffffff", glowRadius: 18,
  });
  drawText(ctx, "ENTRY OPEN  —  MOVE NOW", RX, 174, {
    size: 16, weight: "800", color: hexAlpha(accent, 0.88),
  });

  // ── 3 stat boxes
  const boxY  = 190;
  const boxW  = SW3;
  const mcTag  = mc  < 500_000 ? "LOW MCAP" : mc  < 5_000_000 ? "MID MCAP" : "HIGH MCAP";
  const liqTag = liq > 20_000  ? "STRONG LIQ" : liq > 5_000 ? "GOOD LIQ" : "THIN LIQ";
  statBlockWithTag(ctx, RX,              boxY, boxW, "MARKET CAP", fmtMoney(mc),  mcTag,       palette);
  statBlockWithTag(ctx, RX + SW3 + 12,   boxY, boxW, "LIQUIDITY",  fmtMoney(liq), liqTag,      palette);
  statBlockWithTag(ctx, RX + (SW3+12)*2, boxY, boxW, "ENTRY",      "OPEN",        "EARLY",     palette);

  // ── Real price chart
  drawRealPriceChart(ctx, RX, 295, RW - 6, 160, ohlcv, ticker, accent, rng);

  // ── Bottom pill badges
  const badgeTags = [
    "LOW MCAP",
    "FRESH LAUNCH",
    pickFrom(rng, ["★ VIP FIRST", "★ ALPHA ENTRY", "★ FIRST WAVE", "★ PRECISION"]),
  ];
  let bx = RX;
  for (const tag of badgeTags) bx += drawPremiumBadge(ctx, bx, 468, tag, accent, false);

  brandFooter(ctx, server, "Free Calls · DYOR", palette);
};

// =================================================================
// VIP — left: statue | right: pitch text + bullets + CTA
// =================================================================
export const vipTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#000000", "#0d0a00", "#c5a028"]);
  const [, , accent] = palette;
  const handle = str(input, "handle", "@apex");
  const server = str(input, "server", "Baldwin Calls");
  const wins   = (input["wins"] ?? "196x,120x,109x").split(",").slice(0, 3);

  drawHeaderBar(ctx, "JOIN VIP", "PRIVATE ACCESS", accent);

  drawGlowText(ctx, "Stop watching.", RX, 162, {
    size: 52, weight: "900", color: "#ffffff", glowColor: accent, glowRadius: 12,
  });
  drawGlowText(ctx, "Start winning.", RX, 224, {
    size: 52, weight: "900", color: accent, glowColor: accent, glowRadius: 18,
  });

  let cx = RX;
  for (const w of wins) cx += drawPremiumBadge(ctx, cx, 276, w.trim().toUpperCase(), accent, true);

  const bullets = [
    "CA before the public chart opens",
    "Tracked whale wallets for copy-trade",
    "Live entries and exits in real time",
    "Daily alpha and narrative briefing",
    "Private VIP-only channel access",
  ];
  let by = 322;
  for (const b of bullets) {
    drawText(ctx, `—  ${b}`, RX, by, { size: 19, weight: "600", color: hexAlpha("#d8d8d8", 0.85) });
    by += 33;
  }

  drawText(ctx, `DM ${handle} to get in`, RX, H - 68, {
    size: 24, weight: "900", color: "#ffffff",
  });

  brandFooter(ctx, server, "VIP · Limited Seats", palette);
};

// =================================================================
// ALERT — left: statue | right: breaking alert text
// =================================================================
export const alertTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#000000", "#0d0d0d", "#d0d0d0"]);
  const [, , accent] = palette;
  const title  = str(input, "title", "ALERT");
  const body   = str(input, "body", "Something is moving.");
  const server = str(input, "server", "Baldwin Calls");

  drawHeaderBar(ctx, "BREAKING ALERT", "REAL-TIME", accent);

  // Pulsing indicator dot — top right
  ctx.beginPath();
  ctx.arc(W - 56, 36, 14, 0, Math.PI * 2);
  const dot = ctx.createRadialGradient(W - 56, 36, 0, W - 56, 36, 14);
  dot.addColorStop(0, "#ffffff");
  dot.addColorStop(0.5, accent);
  dot.addColorStop(1, hexAlpha(accent, 0.6));
  ctx.fillStyle = dot;
  ctx.fill();
  for (let i = 3; i >= 1; i--) {
    ctx.beginPath();
    ctx.arc(W - 56, 36, 14 + i * 10, 0, Math.PI * 2);
    ctx.strokeStyle = hexAlpha(accent, 0.07 + i * 0.04);
    ctx.lineWidth   = 2;
    ctx.stroke();
  }

  drawAccentLine(ctx, RX, 94, 210, accent);

  drawGlowText(ctx, title.toUpperCase(), RX, 186, {
    size: 56, weight: "900", color: "#ffffff",
    glowColor: accent, glowRadius: 16, maxWidth: RW,
  });

  wrapText(ctx, body, RX, 248, RW - 12, 38, {
    size: 22, weight: "600", color: hexAlpha("#e8e8e8", 0.88),
  });

  brandFooter(ctx, server, "ALERTS · LIVE", palette);
};

// =================================================================
// WHALE — left: statue | right: action + ticker + chart + stats
// =================================================================
export const whaleTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette    = paintBackground(ctx, rng, ["#000000", "#08090a", "#b8c8d0"]);
  const [, , accent] = palette;
  const action     = str(input, "action", "BOUGHT");
  const ticker     = str(input, "ticker", "TOKEN");
  const wallet     = str(input, "wallet", "ABCD…WXYZ");
  const sizeStr    = str(input, "size", "240 SOL");
  const usdStr     = str(input, "usd", "$48,000");
  const tag        = str(input, "tag", "Smart Money #1");
  const server     = str(input, "server", "Baldwin Calls");
  const isExit     = action.toLowerCase().includes("exit") || action.toLowerCase().includes("trim");
  const actionColor = isExit ? "#909090" : "#d4af37";
  const ohlcv      = parseOhlcv(input);

  drawHeaderBar(ctx, "WHALE TRACKER", tag.toUpperCase(), accent);

  // Hero action + ticker
  drawGlowText(ctx, action.toUpperCase(), RX, 152, {
    size: 68, weight: "900", color: actionColor, glowColor: actionColor, glowRadius: 16,
  });
  drawGlowText(ctx, `$${ticker.toUpperCase()}`, RX, 212, {
    size: 50, weight: "900", color: "#e8e8e8",
    glowColor: hexAlpha("#ffffff", 0.1), glowRadius: 6,
  });
  drawText(ctx, `Wallet  ${wallet}`, RX, 240, {
    size: 15, weight: "600", color: hexAlpha("#c8c8c8", 0.55),
  });

  // Real price chart
  drawRealPriceChart(ctx, RX, 256, RW - 8, 170, ohlcv, ticker, actionColor, rng);

  // 2 stat blocks: SIZE + VALUE
  statBlock(ctx, RX,         438, "SIZE",  sizeStr, palette);
  statBlock(ctx, RX + SW2 + 12, 438, "VALUE", usdStr,  palette);

  brandFooter(ctx, server, "TRACKING 1,200+ WALLETS", palette);
};

// =================================================================
// TRADE — left: statue | right: direction + ticker + chart + stats
// =================================================================
export const tradeTemplate: RenderTemplate = (ctx, input, rng) => {
  const direction   = str(input, "direction", "BUY");
  const isBuy       = direction === "BUY";
  const isExit      = direction === "EXIT";
  const accentColor = isBuy ? "#d4af37" : isExit ? "#888888" : "#a8a020";
  const bgPalette: [string, string, string] = isBuy
    ? ["#000000", "#0a0800", "#d4af37"]
    : isExit
    ? ["#000000", "#0d0d0d", "#888888"]
    : ["#000000", "#0a0900", "#a8a020"];
  const palette  = paintBackground(ctx, rng, bgPalette);
  const [, , accent] = palette;
  const ticker   = str(input, "ticker", "TOKEN");
  const sizeStr  = str(input, "size", "12 SOL");
  const usdStr   = str(input, "usd", "$2,400");
  const wallet   = str(input, "wallet", "ABCD…WXYZ");
  const server   = str(input, "server", "Baldwin Calls");
  const ohlcv    = parseOhlcv(input);

  drawHeaderBar(ctx, "LIVE TRADE", wallet, accent);

  // Hero direction + ticker
  drawGlowText(ctx, direction, RX, 162, {
    size: 86, weight: "900", color: accentColor,
    glowColor: accentColor, glowRadius: 24,
  });
  drawGlowText(ctx, `$${ticker.toUpperCase()}`, RX, 238, {
    size: 52, weight: "900", color: "#ffffff",
    glowColor: hexAlpha("#ffffff", 0.12), glowRadius: 8,
  });

  // Real price chart
  drawRealPriceChart(ctx, RX, 254, RW - 8, 175, ohlcv, ticker, accentColor, rng);

  // 3 stat blocks
  statBlock(ctx, RX,              440, "SIZE",     sizeStr,                                   palette);
  statBlock(ctx, RX + SW3 + 12,   440, "USD VALUE", usdStr,                                   palette);
  statBlock(ctx, RX + (SW3+12)*2, 440, "STATUS",   isBuy ? "FILLED" : isExit ? "CLOSED" : "TRIMMED", palette);

  brandFooter(ctx, server, "Live Trades", palette);
};

// =================================================================
// TRENDING — left: statue | right: top-3 mover rows
// =================================================================
export const trendingTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#000000", "#0c0900", "#c5a028"]);
  const [, , accent] = palette;
  const items  = (input["items"] ?? "DEGEN:+220,WIF2:+148,BONK2:+92").split(",").slice(0, 3);
  const server = str(input, "server", "Baldwin Calls");

  drawHeaderBar(ctx, "TRENDING", "LAST 24H", accent);

  let y = 88;
  const rankColors = [accent, hexAlpha("#b0b0b0", 0.9), hexAlpha("#8b6914", 0.85)];
  let rank = 1;
  for (const it of items) {
    const [name, change] = (it ?? "").split(":");
    const rowW = RW + 8;
    roundedRect(ctx, RX - 4, y, rowW, 104, 14);
    const rowGrad = ctx.createLinearGradient(RX - 4, y, RX - 4 + rowW, y);
    rowGrad.addColorStop(0, hexAlpha("#000000", 0.75));
    rowGrad.addColorStop(1, hexAlpha("#000000", 0.35));
    ctx.fillStyle = rowGrad;
    ctx.fill();
    roundedRect(ctx, RX - 4, y, rowW, 104, 14);
    ctx.strokeStyle = hexAlpha(rankColors[rank - 1]!, 0.28);
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    drawText(ctx, `#${rank}`, RX + 14, y + 64, { size: 36, weight: "900", color: rankColors[rank - 1]! });
    drawText(ctx, `$${(name ?? "TOKEN").toUpperCase()}`, RX + 82, y + 64, {
      size: 34, weight: "900", color: "#e8e8e8",
    });
    drawSparkline(ctx, RX + 240, y + 12, 180, 70, rng, "up", rankColors[rank - 1]!);
    const changeVal = change ?? "+0";
    drawGlowText(ctx, `${changeVal}%`, W - 28, y + 64, {
      size: 32, weight: "900", color: accent,
      glowColor: accent, glowRadius: 10, align: "right",
    });
    y += 118;
    rank++;
  }

  brandFooter(ctx, server, "Updated every 5m", palette);
};

// =================================================================
// PRICE — left: statue | right: 6-coin dark market ticker grid
// =================================================================
export const priceTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#000000", "#0c0c0c", "#b8b8b8"]);
  const [, , accent] = palette;
  const server = str(input, "server", "Baldwin Calls");
  const items  = (input["items"] ?? "BTC:65000:+1.2,ETH:3200:+2.1,SOL:185:+4.5,WIF:2.10:+8.4,BNB:580:+0.9,DOGE:0.18:+5.2").split(",");

  drawHeaderBar(ctx, "LIVE PRICES", `${new Date().toUTCString().slice(17, 25)} UTC`, accent);

  const cols   = 3;
  const gutter = 12;
  const colW   = Math.floor((RW - gutter * (cols - 1)) / cols);
  let i = 0;
  for (const it of items.slice(0, 6)) {
    const [sym, p, ch] = (it ?? "").split(":");
    const col  = i % cols;
    const row  = Math.floor(i / cols);
    const cx   = RX + col * (colW + gutter);
    const cy   = 84 + row * 196;
    roundedRect(ctx, cx, cy, colW, 182, 14);
    const cardGrad = ctx.createLinearGradient(cx, cy, cx, cy + 182);
    cardGrad.addColorStop(0, hexAlpha("#ffffff", 0.04));
    cardGrad.addColorStop(1, hexAlpha("#000000", 0.65));
    ctx.fillStyle = cardGrad;
    ctx.fill();
    roundedRect(ctx, cx, cy, colW, 182, 14);
    const isUp = !(ch ?? "+0").startsWith("-");
    ctx.strokeStyle = hexAlpha(isUp ? "#d4af37" : "#888888", 0.28);
    ctx.lineWidth   = 1.5;
    ctx.stroke();
    drawText(ctx, sym ?? "?", cx + 16, cy + 40, { size: 20, weight: "800", color: hexAlpha("#c8c8c8", 0.75) });
    drawText(ctx, `$${p ?? "0"}`, cx + 16, cy + 82, { size: 28, weight: "900", color: "#ffffff" });
    drawText(ctx, `${ch ?? "+0"}%  24h`, cx + 16, cy + 116, {
      size: 14, weight: "800", color: isUp ? "#d4af37" : "#888888",
    });
    drawSparkline(ctx, cx + colW - 108, cy + 56, 92, 60, rng, isUp ? "up" : "down", isUp ? "#d4af37" : "#888888");
    i++;
  }

  brandFooter(ctx, server, "Refresh ~15m", palette);
};

// =================================================================
// GAS — left: statue | right: 3-chain fee cards
// =================================================================
export const gasTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#000000", "#0a0a0c", "#a0a8b0"]);
  const [, , accent] = palette;
  const server = str(input, "server", "Baldwin Calls");
  const eth    = str(input, "eth", "12 gwei");
  const base   = str(input, "base", "0.05 gwei");
  const sol    = str(input, "sol", "0.000007 SOL");

  drawHeaderBar(ctx, "GAS TRACKER", "LIVE FEES", accent);

  const chains = [
    { name: "ETHEREUM", fee: eth,  status: "nominal" },
    { name: "BASE",     fee: base, status: "cheap" },
    { name: "SOLANA",   fee: sol,  status: "spammable" },
  ];
  const gutter = 10;
  const cw     = Math.floor((RW - gutter * 2) / 3);
  for (let i2 = 0; i2 < 3; i2++) {
    const chain2 = chains[i2]!;
    const cx     = RX + i2 * (cw + gutter);
    const cy     = 84;
    roundedRect(ctx, cx, cy, cw, H - 84 - 52, 16);
    const bg2 = ctx.createLinearGradient(cx, cy, cx, cy + H - 136);
    bg2.addColorStop(0, hexAlpha("#ffffff", 0.04));
    bg2.addColorStop(1, hexAlpha("#000000", 0.65));
    ctx.fillStyle = bg2;
    ctx.fill();
    roundedRect(ctx, cx, cy, cw, H - 84 - 52, 16);
    ctx.strokeStyle = hexAlpha(accent, 0.2);
    ctx.lineWidth   = 1.5;
    ctx.stroke();
    drawText(ctx, chain2.name, cx + 16, cy + 46, { size: 18, weight: "900", color: accent });
    drawText(ctx, chain2.fee,  cx + 16, cy + 124, { size: 18, weight: "800", color: "#e0e0e0" });
    drawText(ctx, chain2.status, cx + 16, cy + 165, { size: 14, weight: "700", color: hexAlpha("#c8c8c8", 0.6) });
    drawSparkline(ctx, cx + 12, cy + 210, cw - 24, 100, rng, "wave", accent);
  }

  brandFooter(ctx, server, "Network fees live", palette);
};

// =================================================================
// ANNOUNCEMENT — left: statue | right: official text
// =================================================================
export const announceTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng);
  const [, , accent] = palette;
  const title  = str(input, "title", "ANNOUNCEMENT");
  const body   = str(input, "body", "Big news coming.");
  const server = str(input, "server", "Baldwin Calls");

  drawHeaderBar(ctx, "OFFICIAL", server.toUpperCase(), accent);

  drawAccentLine(ctx, RX, 94, 260, accent);

  drawGlowText(ctx, title.toUpperCase(), RX, 196, {
    size: 54, weight: "900", color: "#ffffff",
    glowColor: accent, glowRadius: 12, maxWidth: RW,
  });

  wrapText(ctx, body, RX, 258, RW - 12, 38, {
    size: 23, weight: "600", color: hexAlpha("#e8e8e8", 0.88),
  });

  drawPremiumBadge(ctx, RX, 468, pickFrom(rng, ["IMPORTANT", "READ NOW", "PRIORITY", "MANDATORY", "ACTION REQUIRED"]), accent, true);

  brandFooter(ctx, server, "Official Channel", palette);
};

// =================================================================
// VIP SNIPE — left: statue | right: chart + obscured ticker + lock
// =================================================================
export const snipeTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#000000", "#0c0900", "#c5a028"]);
  const [, , accent] = palette;
  const ticker = str(input, "ticker", "TOKEN");
  const mc     = num(input, "mc", 12_500);
  const handle = str(input, "handle", "@apex");
  const server = str(input, "server", "Baldwin Calls");
  const ohlcv  = parseOhlcv(input);

  drawHeaderBar(ctx, "VIP SNIPE", "PREVIEW ONLY", accent);

  // Chart at top of right panel
  drawRealPriceChart(ctx, RX, 84, RW - 8, 230, ohlcv, `${ticker.slice(0, 2)}•••`, accent, rng);

  // Obscured ticker
  drawGlowText(ctx, `$${ticker.slice(0, 2).toUpperCase()}•••`, RX, 356, {
    size: 72, weight: "900", color: "#e8e8e8",
    glowColor: accent, glowRadius: 18,
  });
  drawGlowText(ctx, `Filled @ ${fmtMoney(mc)}`, RX, 398, {
    size: 28, weight: "800", color: accent,
    glowColor: accent, glowRadius: 10,
  });

  // Lock badge
  roundedRect(ctx, RX, 416, RW - 8, 62, 31);
  ctx.fillStyle   = hexAlpha("#000000", 0.85);
  ctx.fill();
  roundedRect(ctx, RX, 416, RW - 8, 62, 31);
  ctx.strokeStyle = hexAlpha(accent, 0.65);
  ctx.lineWidth   = 2;
  ctx.stroke();
  drawGlowText(ctx, "CA LOCKED — VIP ONLY", RC, 456, {
    size: 20, weight: "900", color: accent,
    glowColor: accent, glowRadius: 10, align: "center",
  });

  drawText(ctx, `DM ${handle} to join VIP`, RC, 502, {
    size: 20, weight: "700", color: hexAlpha("#d0d0d0", 0.8), align: "center",
  });

  brandFooter(ctx, server, "VIP Snipes", palette);
};

// =================================================================
// ALPHA — left: statue | right: narrative label + chart + insight
// =================================================================
export const alphaTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette    = paintBackground(ctx, rng, ["#000000", "#0d0d0d", "#b8b8b8"]);
  const [, , accent] = palette;
  const narrative  = str(input, "narrative", "AI Agents");
  const server     = str(input, "server", "Baldwin Calls");
  const ohlcv      = parseOhlcv(input);
  const alphaTicker = str(input, "ticker", "TOKEN");

  drawHeaderBar(ctx, "ALPHA LOUNGE", "VIP DAILY BRIEF", accent);

  drawText(ctx, "NARRATIVE", RX, 108, { size: 13, weight: "800", color: hexAlpha(accent, 0.65) });
  drawAccentLine(ctx, RX, 114, 140, accent);

  drawGlowText(ctx, narrative.toUpperCase(), RX, 200, {
    size: 58, weight: "900", color: "#ffffff",
    glowColor: accent, glowRadius: 16, maxWidth: RW,
  });

  // Real price chart
  drawRealPriceChart(ctx, RX, 214, RW - 8, 200, ohlcv, alphaTicker, accent, rng);

  const insight = pickFrom(rng, [
    "Smart wallets accumulating quietly. Public attention has not arrived yet.",
    "Narrative heating up. Positioned before the crowd moves.",
    "On-chain data confirms significant accumulation underway.",
    "Early movers identified. The window is narrowing.",
    "High-conviction play backed by strong on-chain confirmation.",
  ]);
  wrapText(ctx, insight, RX, 440, RW - 12, 28, {
    size: 17, weight: "600", color: hexAlpha("#d8d8d8", 0.82),
  });

  brandFooter(ctx, server, "Alpha Lounge", palette);
};

// =================================================================
// MARKET — left: statue | right: full chart + market take
// =================================================================
export const marketTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng);
  const [, , accent] = palette;
  const take        = str(input, "take", "Range bound. Patience pays.");
  const server      = str(input, "server", "Baldwin Calls");
  const chartTicker = str(input, "chartTicker", "BTC");
  const ohlcv       = parseOhlcv(input);

  drawHeaderBar(ctx, "MARKET UPDATE", new Date().toUTCString().slice(5, 22), accent);

  // Full right-panel chart
  drawRealPriceChart(ctx, RX, 84, RW - 6, 310, ohlcv, chartTicker, accent, rng);

  roundedRect(ctx, RX, 404, RW - 6, 64, 12);
  ctx.fillStyle = hexAlpha("#000000", 0.72);
  ctx.fill();
  roundedRect(ctx, RX, 404, RW - 6, 64, 12);
  ctx.strokeStyle = hexAlpha(accent, 0.28);
  ctx.lineWidth   = 1.5;
  ctx.stroke();

  wrapText(ctx, take, RX + 18, 438, RW - 40, 28, {
    size: 20, weight: "600", color: hexAlpha("#e8e8e8", 0.92),
  });

  const trend = (input["trend"] === "down") ? "down" : "up";
  brandFooter(ctx, server, trend === "up" ? "RISK ON" : "RISK OFF", palette);
};

// =================================================================
// INFO CARDS — left: statue | right: label + title + subtitle
// =================================================================
export const infoTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#000000", "#0d0d0d", "#c8c8c8"]);
  const [, , accent] = palette;
  const tag      = str(input, "tag", "WELCOME");
  const title    = str(input, "title", "WELCOME TO APEX");
  const subtitle = str(input, "subtitle", "");
  const server   = str(input, "server", "Baldwin Calls");

  drawHeaderBar(ctx, tag, server.toUpperCase(), accent);

  drawAccentLine(ctx, RX, 88, 220, accent);
  drawGlowText(ctx, title.toUpperCase(), RX, 204, {
    size: 46, weight: "900", color: "#ffffff",
    glowColor: accent, glowRadius: 14, maxWidth: RW,
  });

  if (subtitle) {
    wrapText(ctx, subtitle, RX, 262, RW - 12, 38, {
      size: 22, weight: "600", color: hexAlpha("#e0e0e0", 0.85),
    });
  }

  drawGlowOrb(ctx, W - 120, 320, 80, accent, rng);
  brandFooter(ctx, server, tag.toLowerCase(), palette);
};

// =================================================================
// GENERAL CHAT — left: statue | right: avatar + quote bubble
// =================================================================
export const chatTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng);
  const [, , accent] = palette;
  const quote   = str(input, "quote", "patience is the only edge that matters");
  const persona = str(input, "persona", "anon");
  const server  = str(input, "server", "Baldwin Calls");

  drawHeaderBar(ctx, "CHAT", server.toUpperCase(), accent);

  drawAvatar(ctx, RX + 44, 264, 60, rng, palette);

  const bubbleX = RX + 118;
  const bubbleW = RW - 126;
  roundedRect(ctx, bubbleX, 170, bubbleW, 190, 20);
  const bubbleGrad = ctx.createLinearGradient(bubbleX, 170, bubbleX, 360);
  bubbleGrad.addColorStop(0, hexAlpha("#ffffff", 0.06));
  bubbleGrad.addColorStop(1, hexAlpha("#000000", 0.65));
  ctx.fillStyle = bubbleGrad;
  ctx.fill();
  roundedRect(ctx, bubbleX, 170, bubbleW, 190, 20);
  ctx.strokeStyle = hexAlpha(accent, 0.22);
  ctx.lineWidth   = 1.5;
  ctx.stroke();

  drawText(ctx, persona, bubbleX + 18, 218, { size: 17, weight: "800", color: accent });
  wrapText(ctx, quote, bubbleX + 18, 258, bubbleW - 36, 34, {
    size: 22, weight: "600", color: "#e8e8e8",
  });

  brandFooter(ctx, server, "general-chat", palette);
};

// =================================================================
// EARLY ACCESS — left: statue | right: ticker + chart + radar CTA
// =================================================================
export const earlyTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#000000", "#0c0900", "#c5a028"]);
  const [, , accent] = palette;
  const ticker = str(input, "ticker", "TOKEN");
  const lead   = str(input, "lead", "20");
  const handle = str(input, "handle", "@apex");
  const server = str(input, "server", "Baldwin Calls");
  const ohlcv  = parseOhlcv(input);

  drawHeaderBar(ctx, "EARLY ACCESS", "VIP RADAR", accent);

  drawText(ctx, "ON THE RADAR", RX, 104, { size: 13, weight: "800", color: hexAlpha(accent, 0.65) });
  drawAccentLine(ctx, RX, 110, 160, accent);

  drawGlowText(ctx, `$${ticker.toUpperCase()}`, RX, 206, {
    size: 74, weight: "900", color: "#ffffff",
    glowColor: accent, glowRadius: 20,
  });
  drawGlowText(ctx, `${lead} MIN BEFORE PUBLIC`, RX, 242, {
    size: 22, weight: "800", color: accent,
    glowColor: accent, glowRadius: 8,
  });

  // Real price chart
  drawRealPriceChart(ctx, RX, 256, RW - 8, 215, ohlcv, ticker, accent, rng);

  drawText(ctx, `DM ${handle} for the CA`, RX, H - 62, {
    size: 20, weight: "800", color: "#e8e8e8",
  });

  brandFooter(ctx, server, "Early Access", palette);
};

// =================================================================
// TEMPLATE REGISTRY — maps URL slug → render function
// =================================================================
export const TEMPLATES: Record<string, RenderTemplate> = {
  proof:    proofTemplate,
  call:     callTemplate,
  vip:      vipTemplate,
  alert:    alertTemplate,
  whale:    whaleTemplate,
  trade:    tradeTemplate,
  trending: trendingTemplate,
  price:    priceTemplate,
  gas:      gasTemplate,
  announce: announceTemplate,
  snipe:    snipeTemplate,
  alpha:    alphaTemplate,
  market:   marketTemplate,
  info:     infoTemplate,
  chat:     chatTemplate,
  early:    earlyTemplate,
};
