import type { SKRSContext2D } from "@napi-rs/canvas";
import {
  brandFooter,
  drawAccentLine,
  drawAvatar,
  drawCandles,
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

// Dark cinematic theme — June 2026 push
// All palettes: pure black + silver/gold/off-white. No neon colors.
// Dark, elite, mature labels — no emojis, no hype slang
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
  if (n >= 1_000_000) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1e3).toFixed(1)}K`;
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

// =================================================================
// PROOF — dark luxury multiplier receipt card
// =================================================================
export const proofTemplate: RenderTemplate = (ctx, input, rng) => {
  // Rich black + dark gold
  const palette = paintBackground(ctx, rng, ["#000000", "#0a0800", "#d4af37"]);
  const [, , accent] = palette;
  const ticker = str(input, "ticker", "TOKEN");
  const x = num(input, "x", 50);
  const entry = num(input, "entry", 12_300);
  const ath = Math.round(entry * x);
  const server = str(input, "server", "Baldwin Calls");
  const handle = str(input, "handle", "@apex");
  const xText = `${x.toFixed(x >= 100 ? 0 : 1)}x`;

  drawHeaderBar(ctx, "PROOF RECEIPT", server.toUpperCase(), accent);

  drawText(ctx, `$${ticker.toUpperCase()}`, 36, 150, {
    size: 70, weight: "900", color: "#e8e8e8",
  });
  drawAccentLine(ctx, 36, 158, 180, accent);

  // Large multiplier — gold glow, white fill
  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = 35;
  ctx.font = `900 ${x >= 100 ? 148 : 168}px Sans`;
  ctx.fillStyle = accent;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  for (let i = 0; i < 3; i++) ctx.fillText(xText, 36, 340);
  ctx.restore();
  ctx.font = `900 ${x >= 100 ? 148 : 168}px Sans`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(xText, 36, 340);

  let bx = 36;
  ctx.font = `800 15px Sans`;
  bx += drawPremiumBadge(ctx, bx, 420, `Entry ${fmtMoney(entry)}`, accent);
  bx += drawPremiumBadge(ctx, bx, 420, `ATH ${fmtMoney(ath)}`, accent);
  bx += drawPremiumBadge(ctx, bx, 420, pickFrom(rng, ELITE_TAGS), accent, true);

  drawText(ctx, `DM ${handle} to access VIP`, 36, 490, {
    size: 20, weight: "700", color: hexAlpha("#d0d0d0", 0.75),
  });

  drawMoneyStacks(ctx, W - 200, 390, accent, rng);
  drawGlowOrb(ctx, W - 195, 195, 76, accent, rng);

  brandFooter(ctx, server, `Receipts · ${new Date().toUTCString().slice(5, 22)}`, palette);
};

// =================================================================
// CALL — screenshot-matched redesign with real OHLCV chart
// Layout: statue bg left | content right | real price chart
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

  // Parse real OHLCV from pre-fetched JSON string
  let ohlcv: { t: number; c: number }[] = [];
  try {
    const raw = input["ohlcv"];
    if (raw) ohlcv = JSON.parse(raw) as { t: number; c: number }[];
  } catch { /* fall back to sparkline */ }

  // ── Background: true black
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, W, H);

  // ── Statue image — left ~45% of card, "cover" fill
  const bgImg = getBackgroundImage();
  if (bgImg) {
    ctx.save();
    ctx.globalAlpha = 0.88;
    const targetW = 450;
    const imgAspect  = bgImg.width  / bgImg.height;
    const tgtAspect  = targetW / H;
    let sx = 0, sy = 0, sw = bgImg.width, sh = bgImg.height;
    if (imgAspect > tgtAspect) {
      sh = bgImg.height;
      sw = bgImg.height * tgtAspect;
      sx = (bgImg.width - sw) / 2;
    } else {
      sw = bgImg.width;
      sh = bgImg.width / tgtAspect;
      sy = (bgImg.height - sh) / 2;
    }
    ctx.drawImage(bgImg as unknown as Parameters<typeof ctx.drawImage>[0], sx, sy, sw, sh, 0, 0, targetW, H);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ── Gradient overlay: fade statue into dark content area
  const fade = ctx.createLinearGradient(0, 0, W, 0);
  fade.addColorStop(0,    "rgba(0,0,0,0)");
  fade.addColorStop(0.28, "rgba(0,0,0,0.08)");
  fade.addColorStop(0.44, "rgba(0,0,0,0.62)");
  fade.addColorStop(1,    "rgba(0,0,0,0.84)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, W, H);

  // ── Film grain (composited, preserves background opacity)
  drawFilmGrain(ctx, rng, 18);

  // ── Premium edge frame
  const inset = 8;
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

  // ⚡ BALDWIN CALLS — top-left
  ctx.save();
  ctx.shadowColor = hexAlpha(accent, 0.4);
  ctx.shadowBlur  = 8;
  ctx.font        = "800 18px Sans";
  ctx.fillStyle   = "#ffffff";
  ctx.textAlign   = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("⚡ BALDWIN CALLS", 22, 35);
  ctx.restore();

  // CHAIN • DEX — centre-right of header
  ctx.font        = "600 13px Sans";
  ctx.fillStyle   = hexAlpha("#c8c8c8", 0.65);
  ctx.textAlign   = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(
    `${chain.toUpperCase()} • ${dex.toUpperCase()}`,
    W - 104, 35,
  );

  // LIVE ● badge — top-right
  const liveX = W - 92;
  roundedRect(ctx, liveX, 13, 76, 26, 13);
  ctx.fillStyle = hexAlpha("#000000", 0.8);
  ctx.fill();
  roundedRect(ctx, liveX, 13, 76, 26, 13);
  ctx.strokeStyle = hexAlpha(accent, 0.5);
  ctx.lineWidth   = 1.5;
  ctx.stroke();
  ctx.font        = "800 13px Sans";
  ctx.fillStyle   = "#ffffff";
  ctx.textAlign   = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("LIVE", liveX + 10, 31);
  ctx.beginPath();
  ctx.arc(liveX + 60, 26, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#4ade80";
  ctx.fill();

  // ── Content area (right of statue): CX = 385
  const CX = 385;

  // Ticker $SYMBOL — large glow text
  drawGlowText(ctx, `$${ticker.toUpperCase()}`, CX, 170, {
    size: 100, weight: "900", color: "#ffffff",
    glowColor: "#ffffff", glowRadius: 18,
  });

  // Tagline
  drawText(ctx, "ENTRY OPEN  —  MOVE NOW", CX, 196, {
    size: 18, weight: "800", color: hexAlpha(accent, 0.88),
  });

  // ── 3 stat boxes with sub-tags
  const boxY  = 212;
  const boxW  = Math.floor((W - CX - 20 - 2 * 8) / 3);  // ~196
  const boxGap = 8;
  const mcTag  = mc  < 500_000 ? "👑 LOW MCAP"
               : mc  < 5_000_000 ? "📊 MID MCAP"
               : "📈 HIGH MCAP";
  const liqTag = liq > 20_000 ? "💧 STRONG LIQUIDITY"
               : liq > 5_000  ? "💧 GOOD LIQUIDITY"
               : "💧 THIN LIQUIDITY";

  statBlockWithTag(ctx, CX,                          boxY, boxW, "MARKET CAP", fmtMoney(mc),  mcTag,              palette);
  statBlockWithTag(ctx, CX + boxW + boxGap,           boxY, boxW, "LIQUIDITY",  fmtMoney(liq), liqTag,             palette);
  statBlockWithTag(ctx, CX + (boxW + boxGap) * 2,     boxY, boxW, "ENTRY",      "OPEN",         "🎯 EARLY ENTRY",  palette);

  // ── Real price chart
  const chartX = CX;
  const chartW = W - CX - 18;
  const chartY = 315;
  const chartH = 155;
  drawRealPriceChart(ctx, chartX, chartY, chartW, chartH, ohlcv, ticker, accent, rng);

  // ── Bottom pill badges
  const badgeTags = [
    "🚀 LOW MCAP",
    "⚡ FRESH LAUNCH",
    pickFrom(rng, ["★ PRECISION PLAY", "★ VIP FIRST", "★ ALPHA ENTRY", "★ FIRST WAVE"]),
  ];
  let bx = CX;
  for (const tag of badgeTags) {
    bx += drawPremiumBadge(ctx, bx, 487, tag, accent, false);
  }

  brandFooter(ctx, server, "Free Calls · DYOR", palette);
};

// =================================================================
// VIP — dark luxury sales card
// =================================================================
export const vipTemplate: RenderTemplate = (ctx, input, rng) => {
  // Black + warm gold — most premium
  const palette = paintBackground(ctx, rng, ["#000000", "#0d0a00", "#c5a028"]);
  const [, , accent] = palette;
  const handle = str(input, "handle", "@apex");
  const server = str(input, "server", "Baldwin Calls");
  const wins = (input["wins"] ?? "196x,120x,109x").split(",").slice(0, 3);

  drawHeaderBar(ctx, "JOIN VIP", "PRIVATE ACCESS", accent);

  drawGlowText(ctx, "Stop watching.", 36, 175, {
    size: 58, weight: "900", color: "#ffffff", glowColor: accent, glowRadius: 12,
  });
  drawGlowText(ctx, "Start winning.", 36, 248, {
    size: 58, weight: "900", color: accent, glowColor: accent, glowRadius: 18,
  });

  let cx = 36;
  for (const w of wins) {
    cx += drawPremiumBadge(ctx, cx, 308, w.trim().toUpperCase(), accent, true);
  }

  const bullets = [
    "CA before the public chart opens",
    "Tracked whale wallets for copy-trade",
    "Live entries and exits in real time",
    "Daily alpha and narrative briefing",
    "Private VIP-only channel access",
  ];
  let by = 350;
  for (const b of bullets) {
    drawText(ctx, `—  ${b}`, 36, by, { size: 20, weight: "600", color: hexAlpha("#d8d8d8", 0.85) });
    by += 34;
  }

  drawText(ctx, `DM ${handle} to get in`, 36, H - 72, {
    size: 26, weight: "900", color: "#ffffff",
  });

  drawGlowOrb(ctx, W - 200, 280, 120, accent, rng);

  brandFooter(ctx, server, "VIP · Limited Seats", palette);
};

// =================================================================
// ALERT — dark breaking alert card
// =================================================================
export const alertTemplate: RenderTemplate = (ctx, input, rng) => {
  // Black + cool silver — urgent but controlled
  const palette = paintBackground(ctx, rng, ["#000000", "#0d0d0d", "#d0d0d0"]);
  const [, , accent] = palette;
  const title = str(input, "title", "ALERT");
  const body = str(input, "body", "Something is moving.");
  const server = str(input, "server", "Baldwin Calls");

  drawHeaderBar(ctx, "BREAKING ALERT", "REAL-TIME", accent);

  // Pulsing indicator dot
  ctx.beginPath();
  ctx.arc(W - 56, 36, 16, 0, Math.PI * 2);
  const dot = ctx.createRadialGradient(W - 56, 36, 0, W - 56, 36, 16);
  dot.addColorStop(0, "#ffffff");
  dot.addColorStop(0.5, accent);
  dot.addColorStop(1, hexAlpha(accent, 0.6));
  ctx.fillStyle = dot;
  ctx.fill();
  for (let i = 3; i >= 1; i--) {
    ctx.beginPath();
    ctx.arc(W - 56, 36, 16 + i * 12, 0, Math.PI * 2);
    ctx.strokeStyle = hexAlpha(accent, 0.06 + i * 0.04);
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  drawAccentLine(ctx, 36, 100, 200, accent);

  drawGlowText(ctx, title.toUpperCase(), 36, 190, {
    size: 56, weight: "900", color: "#ffffff",
    glowColor: accent, glowRadius: 16, maxWidth: W - 72,
  });

  wrapText(ctx, body, 36, 250, W - 80, 38, {
    size: 24, weight: "600", color: hexAlpha("#e8e8e8", 0.88),
  });

  brandFooter(ctx, server, "ALERTS · LIVE", palette);
};

// =================================================================
// WHALE — dark on-chain wallet movement card
// =================================================================
export const whaleTemplate: RenderTemplate = (ctx, input, rng) => {
  // Black + icy silver
  const palette = paintBackground(ctx, rng, ["#000000", "#08090a", "#b8c8d0"]);
  const [, , accent] = palette;
  const action = str(input, "action", "BOUGHT");
  const ticker = str(input, "ticker", "TOKEN");
  const wallet = str(input, "wallet", "ABCD…WXYZ");
  const sizeStr = str(input, "size", "240 SOL");
  const usdStr = str(input, "usd", "$48,000");
  const tag = str(input, "tag", "Smart Money #1");
  const server = str(input, "server", "Baldwin Calls");
  const isExit = action.toLowerCase().includes("exit") || action.toLowerCase().includes("trim");
  // Gold for buy, silver for sell — no neon
  const actionColor = isExit ? "#909090" : "#d4af37";

  drawHeaderBar(ctx, "WHALE TRACKER", tag.toUpperCase(), accent);

  drawAvatar(ctx, 90, 220, 62, rng, palette);

  drawGlowText(ctx, action.toUpperCase(), 180, 200, {
    size: 52, weight: "900", color: actionColor, glowColor: actionColor, glowRadius: 14,
  });
  drawText(ctx, `$${ticker.toUpperCase()}`, 180, 258, {
    size: 40, weight: "900", color: "#e8e8e8",
  });
  drawText(ctx, `Wallet  ${wallet}`, 180, 298, {
    size: 18, weight: "600", color: hexAlpha("#c8c8c8", 0.6),
  });

  statBlock(ctx, 36, 340, "SIZE", sizeStr, palette);
  statBlock(ctx, 274, 340, "VALUE", usdStr, palette);
  statBlock(ctx, 512, 340, "STATUS", "ON-CHAIN", palette);

  drawSparkline(ctx, W - 420, 100, 380, 210, rng, isExit ? "down" : "up", accent);
  drawGlowOrb(ctx, W - 200, 340, 65, actionColor, rng);

  brandFooter(ctx, server, "TRACKING 1,200+ WALLETS", palette);
};

// =================================================================
// TRADE — dark live entry/trim/exit card
// =================================================================
export const tradeTemplate: RenderTemplate = (ctx, input, rng) => {
  const direction = str(input, "direction", "BUY");
  const isBuy = direction === "BUY";
  const isExit = direction === "EXIT";
  // Gold for buy, mid-silver for trim, dark silver for exit
  const accentColor = isBuy ? "#d4af37" : isExit ? "#888888" : "#a8a020";
  const bgPalette: [string, string, string] = isBuy
    ? ["#000000", "#0a0800", "#d4af37"]
    : isExit
    ? ["#000000", "#0d0d0d", "#888888"]
    : ["#000000", "#0a0900", "#a8a020"];
  const palette = paintBackground(ctx, rng, bgPalette);
  const [, , accent] = palette;

  const ticker = str(input, "ticker", "TOKEN");
  const sizeStr = str(input, "size", "12 SOL");
  const usdStr = str(input, "usd", "$2,400");
  const wallet = str(input, "wallet", "ABCD…WXYZ");
  const server = str(input, "server", "Baldwin Calls");

  drawHeaderBar(ctx, "LIVE TRADE", wallet, accent);

  drawGlowText(ctx, direction, 36, 220, {
    size: 94, weight: "900", color: accentColor,
    glowColor: accentColor, glowRadius: 24,
  });
  drawGlowText(ctx, `$${ticker.toUpperCase()}`, 36, 305, {
    size: 58, weight: "900", color: "#ffffff",
    glowColor: hexAlpha("#ffffff", 0.15), glowRadius: 8,
  });

  drawCandles(ctx, W - 450, 88, 410, 240, rng, isBuy ? "up" : "down");

  statBlock(ctx, 36, 348, "SIZE", sizeStr, palette);
  statBlock(ctx, 274, 348, "USD VALUE", usdStr, palette);
  statBlock(ctx, 512, 348, "STATUS", isBuy ? "FILLED" : isExit ? "CLOSED" : "TRIMMED", palette);

  brandFooter(ctx, server, "Live Trades", palette);
};

// =================================================================
// TRENDING — dark top movers list card
// =================================================================
export const trendingTemplate: RenderTemplate = (ctx, input, rng) => {
  // Black + warm gold
  const palette = paintBackground(ctx, rng, ["#000000", "#0c0900", "#c5a028"]);
  const [, , accent] = palette;
  const items = (input["items"] ?? "DEGEN:+220,WIF2:+148,BONK2:+92").split(",").slice(0, 3);
  const server = str(input, "server", "Baldwin Calls");

  drawHeaderBar(ctx, "TRENDING", "LAST 24H", accent);

  let y = 95;
  // Gold tier / silver tier / bronze tier — no neon
  const rankColors = [accent, hexAlpha("#b0b0b0", 0.9), hexAlpha("#8b6914", 0.85)];
  let rank = 1;
  for (const it of items) {
    const [name, change] = (it ?? "").split(":");
    roundedRect(ctx, 28, y, W - 56, 100, 16);
    const rowGrad = ctx.createLinearGradient(28, y, W - 56, y);
    rowGrad.addColorStop(0, hexAlpha("#000000", 0.75));
    rowGrad.addColorStop(1, hexAlpha("#000000", 0.35));
    ctx.fillStyle = rowGrad;
    ctx.fill();
    roundedRect(ctx, 28, y, W - 56, 100, 16);
    ctx.strokeStyle = hexAlpha(rankColors[rank - 1]!, 0.28);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = rankColors[rank - 1]!;
    ctx.fillRect(28, y + 8, 4, 84);

    drawText(ctx, `#${rank}`, 56, y + 66, { size: 38, weight: "900", color: rankColors[rank - 1]! });
    drawText(ctx, `$${(name ?? "TOKEN").toUpperCase()}`, 130, y + 66, {
      size: 36, weight: "900", color: "#e8e8e8",
    });
    drawSparkline(ctx, W - 340, y + 12, 180, 70, rng, "up", rankColors[rank - 1]!);
    const changeVal = change ?? "+0";
    drawGlowText(ctx, `${changeVal}%`, W - 130, y + 66, {
      size: 34, weight: "900", color: accent,
      glowColor: accent, glowRadius: 10, align: "right",
    });
    y += 118;
    rank++;
  }

  brandFooter(ctx, server, "Updated every 5m", palette);
};

// =================================================================
// PRICE — dark market ticker card
// =================================================================
export const priceTemplate: RenderTemplate = (ctx, input, rng) => {
  // Black + silver
  const palette = paintBackground(ctx, rng, ["#000000", "#0c0c0c", "#b8b8b8"]);
  const [, , accent] = palette;
  const server = str(input, "server", "Baldwin Calls");
  const items = (input["items"] ?? "BTC:65000:+1.2,ETH:3200:+2.1,SOL:185:+4.5,WIF:2.10:+8.4").split(",");

  drawHeaderBar(ctx, "LIVE PRICES", `${new Date().toUTCString().slice(17, 25)} UTC`, accent);

  let i = 0;
  const cols = 3;
  const gutter = 14;
  const colW = (W - 56 - gutter * (cols - 1)) / cols;
  for (const it of items.slice(0, 6)) {
    const [sym, p, ch] = (it ?? "").split(":");
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = 28 + col * (colW + gutter);
    const cy = 88 + row * 196;
    roundedRect(ctx, cx, cy, colW, 182, 16);
    const cardGrad = ctx.createLinearGradient(cx, cy, cx, cy + 182);
    cardGrad.addColorStop(0, hexAlpha("#ffffff", 0.04));
    cardGrad.addColorStop(1, hexAlpha("#000000", 0.65));
    ctx.fillStyle = cardGrad;
    ctx.fill();
    roundedRect(ctx, cx, cy, colW, 182, 16);
    const isUp = !(ch ?? "+0").startsWith("-");
    // Gold up / silver down
    ctx.strokeStyle = hexAlpha(isUp ? "#d4af37" : "#888888", 0.28);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    drawText(ctx, sym ?? "?", cx + 18, cy + 42, { size: 22, weight: "800", color: hexAlpha("#c8c8c8", 0.75) });
    drawText(ctx, `$${p ?? "0"}`, cx + 18, cy + 86, { size: 30, weight: "900", color: "#ffffff" });
    const ch2 = ch ?? "+0";
    drawText(ctx, `${ch2}%  24h`, cx + 18, cy + 120, {
      size: 16, weight: "800", color: isUp ? "#d4af37" : "#888888",
    });
    drawSparkline(ctx, cx + colW - 118, cy + 60, 100, 62, rng, isUp ? "up" : "down", isUp ? "#d4af37" : "#888888");
    i++;
  }

  brandFooter(ctx, server, "Refresh ~15m", palette);
};

// =================================================================
// GAS — dark fees tracker card
// =================================================================
export const gasTemplate: RenderTemplate = (ctx, input, rng) => {
  // Black + steel
  const palette = paintBackground(ctx, rng, ["#000000", "#0a0a0c", "#a0a8b0"]);
  const [, , accent] = palette;
  const server = str(input, "server", "Baldwin Calls");
  const eth = str(input, "eth", "12 gwei");
  const base = str(input, "base", "0.05 gwei");
  const sol = str(input, "sol", "0.000007 SOL");

  drawHeaderBar(ctx, "GAS TRACKER", "LIVE FEES", accent);

  const chains = [
    { name: "ETHEREUM", fee: eth, status: "nominal" },
    { name: "BASE", fee: base, status: "cheap" },
    { name: "SOLANA", fee: sol, status: "spammable" },
  ];
  const cw = (W - 56 - 24) / 3;
  for (let i2 = 0; i2 < 3; i2++) {
    const chain2 = chains[i2]!;
    const cx = 28 + i2 * (cw + 12);
    const cy = 88;
    roundedRect(ctx, cx, cy, cw, H - 88 - 56, 18);
    const bg2 = ctx.createLinearGradient(cx, cy, cx, cy + H - 144);
    bg2.addColorStop(0, hexAlpha("#ffffff", 0.04));
    bg2.addColorStop(1, hexAlpha("#000000", 0.65));
    ctx.fillStyle = bg2;
    ctx.fill();
    roundedRect(ctx, cx, cy, cw, H - 88 - 56, 18);
    ctx.strokeStyle = hexAlpha(accent, 0.2);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    drawText(ctx, chain2.name, cx + 20, cy + 50, { size: 20, weight: "900", color: accent });
    drawText(ctx, chain2.fee, cx + 20, cy + 130, { size: 22, weight: "800", color: "#e0e0e0" });
    drawText(ctx, chain2.status, cx + 20, cy + 175, { size: 16, weight: "700", color: hexAlpha("#c8c8c8", 0.6) });
    drawSparkline(ctx, cx + 14, cy + 230, cw - 28, 100, rng, "wave", accent);
  }

  brandFooter(ctx, server, "Network fees live", palette);
};

// =================================================================
// ANNOUNCEMENT — dark official server announcement card
// =================================================================
export const announceTemplate: RenderTemplate = (ctx, input, rng) => {
  // Pick from default palettes — all cinematic dark
  const palette = paintBackground(ctx, rng);
  const [, , accent] = palette;
  const title = str(input, "title", "ANNOUNCEMENT");
  const body = str(input, "body", "Big news coming.");
  const server = str(input, "server", "Baldwin Calls");

  drawHeaderBar(ctx, "OFFICIAL", server.toUpperCase(), accent);

  drawAccentLine(ctx, 36, 100, 260, accent);

  drawGlowText(ctx, title.toUpperCase(), 36, 210, {
    size: 58, weight: "900", color: "#ffffff",
    glowColor: accent, glowRadius: 12, maxWidth: W - 72,
  });

  wrapText(ctx, body, 36, 270, W - 80, 38, {
    size: 24, weight: "600", color: hexAlpha("#e8e8e8", 0.88),
  });

  drawPremiumBadge(ctx, 36, 490, pickFrom(rng, ["IMPORTANT", "READ NOW", "PRIORITY", "MANDATORY", "ACTION REQUIRED"]), accent, true);

  brandFooter(ctx, server, "Official Channel", palette);
};

// =================================================================
// VIP SNIPE — dark partially blurred preview card
// =================================================================
export const snipeTemplate: RenderTemplate = (ctx, input, rng) => {
  // Black + dark gold — VIP exclusivity
  const palette = paintBackground(ctx, rng, ["#000000", "#0c0900", "#c5a028"]);
  const [, , accent] = palette;
  const ticker = str(input, "ticker", "TOKEN");
  const mc = num(input, "mc", 12_500);
  const handle = str(input, "handle", "@apex");
  const server = str(input, "server", "Baldwin Calls");

  drawHeaderBar(ctx, "VIP SNIPE", "PREVIEW ONLY", accent);

  drawGlowText(ctx, `$${ticker.slice(0, 2).toUpperCase()}•••`, 36, 215, {
    size: 94, weight: "900", color: "#e8e8e8",
    glowColor: accent, glowRadius: 18,
  });
  drawGlowText(ctx, `Filled @ ${fmtMoney(mc)}`, 36, 278, {
    size: 34, weight: "800", color: accent,
    glowColor: accent, glowRadius: 10,
  });

  drawCandles(ctx, W - 440, 88, 400, 240, rng, "up");

  // Locked badge — dark with gold border
  roundedRect(ctx, W / 2 - 240, 360, 480, 72, 36);
  ctx.fillStyle = hexAlpha("#000000", 0.85);
  ctx.fill();
  roundedRect(ctx, W / 2 - 240, 360, 480, 72, 36);
  ctx.strokeStyle = hexAlpha(accent, 0.65);
  ctx.lineWidth = 2;
  ctx.stroke();
  drawGlowText(ctx, "CA LOCKED — VIP ONLY", W / 2, 404, {
    size: 22, weight: "900", color: accent,
    glowColor: accent, glowRadius: 10, align: "center",
  });

  drawText(ctx, `DM ${handle} to join VIP`, W / 2, 466, {
    size: 22, weight: "700", color: hexAlpha("#d0d0d0", 0.8), align: "center",
  });

  drawGlowOrb(ctx, W - 110, 300, 55, accent, rng);

  brandFooter(ctx, server, "VIP Snipes", palette);
};

// =================================================================
// ALPHA — dark narrative thesis card
// =================================================================
export const alphaTemplate: RenderTemplate = (ctx, input, rng) => {
  // Black + silver
  const palette = paintBackground(ctx, rng, ["#000000", "#0d0d0d", "#b8b8b8"]);
  const [, , accent] = palette;
  const narrative = str(input, "narrative", "AI Agents");
  const server = str(input, "server", "Baldwin Calls");

  drawHeaderBar(ctx, "ALPHA LOUNGE", "VIP DAILY BRIEF", accent);

  drawText(ctx, "NARRATIVE", 36, 130, { size: 14, weight: "800", color: hexAlpha(accent, 0.65) });
  drawAccentLine(ctx, 36, 136, 140, accent);

  drawGlowText(ctx, narrative.toUpperCase(), 36, 235, {
    size: 68, weight: "900", color: "#ffffff",
    glowColor: accent, glowRadius: 16, maxWidth: W * 0.6,
  });

  drawSparkline(ctx, 36, 275, W - 72, 130, rng, "up", accent);

  const insight = pickFrom(rng, [
    "Smart wallets accumulating quietly. Public attention has not arrived yet.",
    "Narrative heating up. Positioned before the crowd moves.",
    "On-chain data confirms significant accumulation underway.",
    "Early movers identified. The window is narrowing.",
    "High-conviction play backed by strong on-chain confirmation.",
  ]);
  wrapText(ctx, insight, 36, 450, W - 80, 30, {
    size: 20, weight: "600", color: hexAlpha("#d8d8d8", 0.82),
  });

  drawGlowOrb(ctx, W - 140, 200, 80, accent, rng);

  brandFooter(ctx, server, "Alpha Lounge", palette);
};

// =================================================================
// MARKET — dark full-width chart card
// =================================================================
export const marketTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng);
  const [, , accent] = palette;
  const take = str(input, "take", "Range bound. Patience pays.");
  const server = str(input, "server", "Baldwin Calls");
  const trend: "up" | "down" = (input["trend"] === "down") ? "down" : "up";

  drawHeaderBar(ctx, "MARKET UPDATE", new Date().toUTCString().slice(5, 22), accent);

  drawCandles(ctx, 28, 88, W - 56, 310, rng, trend);

  roundedRect(ctx, 28, 418, W - 56, 68, 14);
  ctx.fillStyle = hexAlpha("#000000", 0.72);
  ctx.fill();
  roundedRect(ctx, 28, 418, W - 56, 68, 14);
  ctx.strokeStyle = hexAlpha(accent, 0.28);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  wrapText(ctx, take, 50, 458, W - 100, 32, {
    size: 22, weight: "600", color: hexAlpha("#e8e8e8", 0.92),
  });

  brandFooter(ctx, server, trend === "up" ? "RISK ON" : "RISK OFF", palette);
};

// =================================================================
// INFO CARDS — welcome / rules / verified / commands
// =================================================================
export const infoTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#000000", "#0d0d0d", "#c8c8c8"]);
  const [, , accent] = palette;
  const tag = str(input, "tag", "WELCOME");
  const title = str(input, "title", "WELCOME TO APEX");
  const subtitle = str(input, "subtitle", "");
  const server = str(input, "server", "Baldwin Calls");

  drawHeaderBar(ctx, tag, server.toUpperCase(), accent);

  drawAccentLine(ctx, 36, 96, 220, accent);
  drawGlowText(ctx, title.toUpperCase(), 36, 210, {
    size: 52, weight: "900", color: "#ffffff",
    glowColor: accent, glowRadius: 14, maxWidth: W - 72,
  });

  if (subtitle) {
    wrapText(ctx, subtitle, 36, 268, W - 80, 38, {
      size: 24, weight: "600", color: hexAlpha("#e0e0e0", 0.85),
    });
  }

  drawGlowOrb(ctx, W - 160, 320, 100, accent, rng);
  brandFooter(ctx, server, tag.toLowerCase(), palette);
};

// =================================================================
// GENERAL CHAT — dark premium quote bubble
// =================================================================
export const chatTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng);
  const [, , accent] = palette;
  const quote = str(input, "quote", "patience is the only edge that matters");
  const persona = str(input, "persona", "anon");
  const server = str(input, "server", "Baldwin Calls");

  drawHeaderBar(ctx, "CHAT", server.toUpperCase(), accent);

  drawAvatar(ctx, 100, 260, 70, rng, palette);

  roundedRect(ctx, 195, 165, W - 230, 200, 22);
  const bubbleGrad = ctx.createLinearGradient(195, 165, 195, 365);
  bubbleGrad.addColorStop(0, hexAlpha("#ffffff", 0.06));
  bubbleGrad.addColorStop(1, hexAlpha("#000000", 0.65));
  ctx.fillStyle = bubbleGrad;
  ctx.fill();
  roundedRect(ctx, 195, 165, W - 230, 200, 22);
  ctx.strokeStyle = hexAlpha(accent, 0.22);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  drawText(ctx, persona, 218, 215, { size: 18, weight: "800", color: accent });
  wrapText(ctx, quote, 218, 258, W - 280, 34, {
    size: 24, weight: "600", color: "#e8e8e8",
  });

  brandFooter(ctx, server, "general-chat", palette);
};

// =================================================================
// EARLY ACCESS — dark radar countdown card
// =================================================================
export const earlyTemplate: RenderTemplate = (ctx, input, rng) => {
  // Black + gold — VIP early
  const palette = paintBackground(ctx, rng, ["#000000", "#0c0900", "#c5a028"]);
  const [, , accent] = palette;
  const ticker = str(input, "ticker", "TOKEN");
  const lead = str(input, "lead", "20");
  const handle = str(input, "handle", "@apex");
  const server = str(input, "server", "Baldwin Calls");

  drawHeaderBar(ctx, "EARLY ACCESS", "VIP RADAR", accent);

  drawText(ctx, "ON THE RADAR", 36, 130, { size: 14, weight: "800", color: hexAlpha(accent, 0.65) });
  drawAccentLine(ctx, 36, 136, 160, accent);

  drawGlowText(ctx, `$${ticker.toUpperCase()}`, 36, 248, {
    size: 90, weight: "900", color: "#ffffff",
    glowColor: accent, glowRadius: 20,
  });
  drawGlowText(ctx, `${lead} MIN BEFORE PUBLIC`, 36, 306, {
    size: 26, weight: "800", color: accent,
    glowColor: accent, glowRadius: 8,
  });

  // Radar rings
  const cx = W - 195, cy = 295, maxR = 145;
  for (let i = 1; i <= 5; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy, (maxR * i) / 5, 0, Math.PI * 2);
    ctx.strokeStyle = hexAlpha(accent, 0.06 + i * 0.04);
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.save();
  ctx.shadowColor = hexAlpha(accent, 0.4);
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + maxR * 0.82, cy - maxR * 0.56);
  ctx.strokeStyle = hexAlpha(accent, 0.65);
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.fill();

  drawText(ctx, `DM ${handle} for the CA`, 36, H - 70, {
    size: 22, weight: "800", color: "#e8e8e8",
  });

  brandFooter(ctx, server, "Early Access", palette);
};

// =================================================================
// TEMPLATE REGISTRY — maps URL slug → render function
// =================================================================
export const TEMPLATES: Record<string, RenderTemplate> = {
  proof:     proofTemplate,
  call:      callTemplate,
  vip:       vipTemplate,
  alert:     alertTemplate,
  whale:     whaleTemplate,
  trade:     tradeTemplate,
  trending:  trendingTemplate,
  price:     priceTemplate,
  gas:       gasTemplate,
  announce:  announceTemplate,
  snipe:     snipeTemplate,
  alpha:     alphaTemplate,
  market:    marketTemplate,
  info:      infoTemplate,
  chat:      chatTemplate,
  early:     earlyTemplate,
};
