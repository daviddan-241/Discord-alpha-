import type { SKRSContext2D } from "@napi-rs/canvas";
import {
  brandFooter,
  drawAccentLine,
  drawAvatar,
  drawCandles,
  drawChip,
  drawGlowOrb,
  drawGlowText,
  drawHeaderBar,
  drawMoneyStacks,
  drawPremiumBadge,
  drawSparkline,
  drawText,
  hexAlpha,
  paintBackground,
  pickFrom,
  roundedRect,
  SIZE,
  statBlock,
  wrapText,
  type RenderInput,
  type RenderTemplate,
} from "./canvas";

const { W, H } = SIZE;

const HYPE_TAGS = [
  "🔥 ABSOLUTE BANGER",
  "✅ VIP GOT EARLIER",
  "💰 ANOTHER CLEAN HIT",
  "🎯 INSIDER PICK",
  "💎 DIAMOND CALL",
  "⚡ WE EAT GOOD",
  "🚀 MOONSHOTTED",
  "📈 100% ALPHA",
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
// PROOF — premium multiplier receipt card (TokenScan-inspired)
// =================================================================
export const proofTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#020d06", "#053a1a", "#00e676"]);
  const [, , accent] = palette;
  const ticker = str(input, "ticker", "TOKEN");
  const x = num(input, "x", 50);
  const entry = num(input, "entry", 12_300);
  const ath = Math.round(entry * x);
  const server = str(input, "server", "Apex Alpha");
  const handle = str(input, "handle", "@apex");
  const xText = `${x.toFixed(x >= 100 ? 0 : 1)}x`;

  drawHeaderBar(ctx, "🏆  PROOF RECEIPT", server.toUpperCase(), accent);

  const leftW = 580;

  drawText(ctx, `$${ticker.toUpperCase()}`, 36, 150, {
    size: 70, weight: "900", color: "#ffffff",
  });
  drawAccentLine(ctx, 36, 158, 180, accent);

  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = 55;
  ctx.font = `900 ${x >= 100 ? 148 : 168}px Sans`;
  ctx.fillStyle = accent;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  for (let i = 0; i < 4; i++) ctx.fillText(xText, 36, 340);
  ctx.restore();
  ctx.font = `900 ${x >= 100 ? 148 : 168}px Sans`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(xText, 36, 340);

  let bx = 36;
  ctx.font = `800 15px Sans`;
  bx += drawPremiumBadge(ctx, bx, 420, `Called at ${fmtMoney(entry)}`, accent);
  bx += drawPremiumBadge(ctx, bx, 420, `ATH ${fmtMoney(ath)}`, accent);
  bx += drawPremiumBadge(ctx, bx, 420, pickFrom(rng, HYPE_TAGS), accent, true);

  drawText(ctx, `Get in early → DM ${handle}`, 36, 490, {
    size: 20, weight: "700", color: "rgba(255,255,255,0.8)",
  });

  drawMoneyStacks(ctx, W - 200, 390, accent, rng);
  drawGlowOrb(ctx, W - 195, 195, 76, accent, rng);

  brandFooter(ctx, server, `Receipts • ${new Date().toUTCString().slice(5, 22)}`, palette);
};

// =================================================================
// CALL — premium new call card
// =================================================================
export const callTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#020610", "#032a50", "#38bdf8"]);
  const [, , accent] = palette;
  const ticker = str(input, "ticker", "TOKEN");
  const mc = num(input, "mc", 18_400);
  const liq = num(input, "liq", 24_500);
  const chain = str(input, "chain", "Solana");
  const dex = str(input, "dex", "PumpSwap");
  const server = str(input, "server", "Apex Alpha");

  drawHeaderBar(ctx, "📊  NEW CALL", `${chain} • ${dex}`, accent);

  drawGlowText(ctx, `$${ticker.toUpperCase()}`, 36, 185, {
    size: 96, weight: "900", color: "#ffffff",
    glowColor: accent, glowRadius: 35,
  });
  drawAccentLine(ctx, 36, 193, 220, accent);

  drawText(ctx, "ENTRY OPEN  →  BUY NOW", 36, 235, {
    size: 20, weight: "800", color: accent,
  });

  statBlock(ctx, 36, 268, "MARKET CAP", fmtMoney(mc), palette);
  statBlock(ctx, 274, 268, "LIQUIDITY", fmtMoney(liq), palette);
  statBlock(ctx, 512, 268, "ENTRY", "NOW ✅", palette);

  let bx = 36;
  const tags = ["LOW MCAP", "FRESH LAUNCH", pickFrom(rng, ["VIP GOT EARLIER", "INSIDER PICK", "ALPHA PLAY", "FIRST WAVE"])];
  for (let i = 0; i < tags.length; i++) {
    bx += drawPremiumBadge(ctx, bx, 440, tags[i]!, accent, i === 2);
  }

  drawSparkline(ctx, W - 440, 100, 400, 330, rng, "up", accent);

  brandFooter(ctx, server, "Free Calls • DYOR", palette);
};

// =================================================================
// VIP — luxury sales card
// =================================================================
export const vipTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#07000f", "#200050", "#c084fc"]);
  const [, , accent] = palette;
  const handle = str(input, "handle", "@apex");
  const server = str(input, "server", "Apex Alpha");
  const wins = (input["wins"] ?? "196x,120x,109x").split(",").slice(0, 3);

  drawHeaderBar(ctx, "💎  JOIN VIP", "ELITE MEMBERS ONLY", accent);

  drawGlowText(ctx, "Stop fading", 36, 175, {
    size: 62, weight: "900", color: "#ffffff", glowColor: accent, glowRadius: 20,
  });
  drawGlowText(ctx, "the calls.", 36, 248, {
    size: 62, weight: "900", color: accent, glowColor: accent, glowRadius: 30,
  });

  let cx = 36;
  for (const w of wins) {
    cx += drawPremiumBadge(ctx, cx, 308, w.trim().toUpperCase(), accent, true);
  }

  const bullets = [
    "🎯  CA before the public chart wakes",
    "🐋  Tracked whale wallets to copy-trade",
    "📈  Live entries + exits in real time",
    "🧠  Daily alpha + narrative briefing",
    "🔒  Private VIP-only channel access",
  ];
  let by = 350;
  for (const b of bullets) {
    drawText(ctx, b, 36, by, { size: 20, weight: "600", color: "rgba(255,255,255,0.9)" });
    by += 34;
  }

  drawText(ctx, `→  DM ${handle} to get in`, 36, H - 72, {
    size: 26, weight: "900", color: "#ffffff",
  });

  drawGlowOrb(ctx, W - 200, 280, 120, accent, rng);

  brandFooter(ctx, server, "VIP • Limited seats", palette);
};

// =================================================================
// ALERT — bold red breaking alert card
// =================================================================
export const alertTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#0f0003", "#4a0018", "#ff4081"]);
  const [, , accent] = palette;
  const title = str(input, "title", "ALERT");
  const body = str(input, "body", "Something is moving.");
  const server = str(input, "server", "Apex Alpha");

  drawHeaderBar(ctx, "📡  BREAKING ALERT", "REAL-TIME", accent);

  ctx.beginPath();
  ctx.arc(W - 56, 36, 18, 0, Math.PI * 2);
  const dot = ctx.createRadialGradient(W - 56, 36, 0, W - 56, 36, 18);
  dot.addColorStop(0, "#ffffff");
  dot.addColorStop(0.5, accent);
  dot.addColorStop(1, hexAlpha(accent, 0.8));
  ctx.fillStyle = dot;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(W - 56, 36, 28, 0, Math.PI * 2);
  ctx.strokeStyle = hexAlpha(accent, 0.4);
  ctx.lineWidth = 3;
  ctx.stroke();

  drawAccentLine(ctx, 36, 100, 200, accent);

  drawGlowText(ctx, title.toUpperCase(), 36, 190, {
    size: 56, weight: "900", color: "#ffffff",
    glowColor: accent, glowRadius: 28, maxWidth: W - 72,
  });

  wrapText(ctx, body, 36, 250, W - 80, 38, {
    size: 24, weight: "600", color: "rgba(255,255,255,0.9)",
  });

  for (let i = 3; i >= 1; i--) {
    ctx.beginPath();
    ctx.arc(W - 56, 36, 18 + i * 14, 0, Math.PI * 2);
    ctx.strokeStyle = hexAlpha(accent, 0.06 + i * 0.04);
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  brandFooter(ctx, server, "ALERTS • LIVE", palette);
};

// =================================================================
// WHALE — premium on-chain wallet movement card
// =================================================================
export const whaleTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#000e18", "#003848", "#00d4ff"]);
  const [, , accent] = palette;
  const action = str(input, "action", "BOUGHT");
  const ticker = str(input, "ticker", "TOKEN");
  const wallet = str(input, "wallet", "ABCD…WXYZ");
  const sizeStr = str(input, "size", "240 SOL");
  const usdStr = str(input, "usd", "$48,000");
  const tag = str(input, "tag", "Smart Money #1");
  const server = str(input, "server", "Apex Alpha");
  const isExit = action.toLowerCase().includes("exit") || action.toLowerCase().includes("trim");
  const actionColor = isExit ? "#ff4444" : "#00e676";

  drawHeaderBar(ctx, "🐋  WHALE TRACKER", tag.toUpperCase(), accent);

  drawAvatar(ctx, 90, 220, 62, rng, palette);

  drawGlowText(ctx, action.toUpperCase(), 180, 200, {
    size: 52, weight: "900", color: actionColor, glowColor: actionColor, glowRadius: 22,
  });
  drawText(ctx, `$${ticker.toUpperCase()}`, 180, 258, {
    size: 40, weight: "900", color: "#ffffff",
  });
  drawText(ctx, `Wallet  ${wallet}`, 180, 298, {
    size: 18, weight: "600", color: "rgba(255,255,255,0.7)",
  });

  statBlock(ctx, 36, 340, "SIZE", sizeStr, palette);
  statBlock(ctx, 274, 340, "VALUE", usdStr, palette);
  statBlock(ctx, 512, 340, "STATUS", "ON-CHAIN ✅", palette);

  drawSparkline(ctx, W - 420, 100, 380, 210, rng, isExit ? "down" : "up", accent);
  drawGlowOrb(ctx, W - 200, 340, 65, actionColor, rng);

  brandFooter(ctx, server, "TRACKING 1,200+ WALLETS", palette);
};

// =================================================================
// TRADE — live entry/trim/exit card
// =================================================================
export const tradeTemplate: RenderTemplate = (ctx, input, rng) => {
  const direction = str(input, "direction", "BUY");
  const isBuy = direction === "BUY";
  const isExit = direction === "EXIT";
  const accentColor = isBuy ? "#00e676" : isExit ? "#ff4444" : "#f1c40f";
  const bgPalette: [string, string, string] = isBuy
    ? ["#010f06", "#023a18", "#00e676"]
    : isExit
    ? ["#0f0101", "#3a0202", "#ff4444"]
    : ["#0a0900", "#2e2800", "#f1c40f"];
  const palette = paintBackground(ctx, rng, bgPalette);
  const [, , accent] = palette;

  const ticker = str(input, "ticker", "TOKEN");
  const sizeStr = str(input, "size", "12 SOL");
  const usdStr = str(input, "usd", "$2,400");
  const wallet = str(input, "wallet", "ABCD…WXYZ");
  const server = str(input, "server", "Apex Alpha");

  drawHeaderBar(ctx, "📈  LIVE TRADE", wallet, accent);

  const icon = isBuy ? "🟢" : isExit ? "🔴" : "🟡";
  drawGlowText(ctx, `${icon} ${direction}`, 36, 220, {
    size: 94, weight: "900", color: accentColor,
    glowColor: accentColor, glowRadius: 38,
  });
  drawGlowText(ctx, `$${ticker.toUpperCase()}`, 36, 305, {
    size: 58, weight: "900", color: "#ffffff",
    glowColor: hexAlpha("#ffffff", 0.25), glowRadius: 12,
  });

  drawCandles(ctx, W - 450, 88, 410, 240, rng, isBuy ? "up" : "down");

  statBlock(ctx, 36, 348, "SIZE", sizeStr, palette);
  statBlock(ctx, 274, 348, "USD VALUE", usdStr, palette);
  statBlock(ctx, 512, 348, "STATUS", isBuy ? "FILLED ✅" : isExit ? "CLOSED 🔴" : "TRIMMED 🟡", palette);

  brandFooter(ctx, server, "Live Trades", palette);
};

// =================================================================
// TRENDING — animated top movers list card
// =================================================================
export const trendingTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#0a0500", "#320f00", "#ff8c00"]);
  const [, , accent] = palette;
  const items = (input["items"] ?? "DEGEN:+220,WIF2:+148,BONK2:+92").split(",").slice(0, 3);
  const server = str(input, "server", "Apex Alpha");

  drawHeaderBar(ctx, "🔥  TRENDING NOW", "LAST 24H", accent);

  let y = 95;
  const rankColors = [accent, hexAlpha(accent, 0.8), hexAlpha(accent, 0.6)];
  let rank = 1;
  for (const it of items) {
    const [name, change] = (it ?? "").split(":");
    roundedRect(ctx, 28, y, W - 56, 100, 16);
    const rowGrad = ctx.createLinearGradient(28, y, W - 56, y);
    rowGrad.addColorStop(0, hexAlpha("#000000", 0.6));
    rowGrad.addColorStop(1, hexAlpha("#000000", 0.2));
    ctx.fillStyle = rowGrad;
    ctx.fill();
    roundedRect(ctx, 28, y, W - 56, 100, 16);
    ctx.strokeStyle = hexAlpha(rankColors[rank - 1]!, 0.3);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = rankColors[rank - 1]!;
    ctx.fillRect(28, y + 8, 5, 84);

    drawText(ctx, `#${rank}`, 56, y + 66, { size: 38, weight: "900", color: rankColors[rank - 1]! });
    drawText(ctx, `$${(name ?? "TOKEN").toUpperCase()}`, 130, y + 66, {
      size: 36, weight: "900", color: "#ffffff",
    });
    drawSparkline(ctx, W - 340, y + 12, 180, 70, rng, "up", rankColors[rank - 1]!);
    const changeVal = change ?? "+0";
    drawGlowText(ctx, `${changeVal}%`, W - 130, y + 66, {
      size: 34, weight: "900", color: "#00e676",
      glowColor: "#00e676", glowRadius: 16, align: "right",
    });
    y += 118;
    rank++;
  }

  brandFooter(ctx, server, "Updated every 5m", palette);
};

// =================================================================
// PRICE — premium market ticker card
// =================================================================
export const priceTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#030810", "#091a3a", "#38bdf8"]);
  const [, , accent] = palette;
  const server = str(input, "server", "Apex Alpha");
  const items = (input["items"] ?? "BTC:65000:+1.2,ETH:3200:+2.1,SOL:185:+4.5,WIF:2.10:+8.4").split(",");

  drawHeaderBar(ctx, "📊  LIVE PRICES", `${new Date().toUTCString().slice(17, 25)} UTC`, accent);

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
    cardGrad.addColorStop(0, hexAlpha("#ffffff", 0.07));
    cardGrad.addColorStop(1, hexAlpha("#000000", 0.5));
    ctx.fillStyle = cardGrad;
    ctx.fill();
    roundedRect(ctx, cx, cy, colW, 182, 16);
    const isUp = !(ch ?? "+0").startsWith("-");
    ctx.strokeStyle = hexAlpha(isUp ? "#00e676" : "#ff4444", 0.3);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    drawText(ctx, sym ?? "?", cx + 18, cy + 42, { size: 22, weight: "800", color: "rgba(255,255,255,0.8)" });
    drawText(ctx, `$${p ?? "0"}`, cx + 18, cy + 86, { size: 30, weight: "900", color: "#ffffff" });
    const ch2 = ch ?? "+0";
    drawText(ctx, `${ch2}%  24h`, cx + 18, cy + 120, {
      size: 16, weight: "800", color: isUp ? "#00e676" : "#ff4444",
    });
    drawSparkline(ctx, cx + colW - 118, cy + 60, 100, 62, rng, isUp ? "up" : "down", isUp ? "#00e676" : "#ff4444");
    i++;
  }

  brandFooter(ctx, server, "Refresh ~15m", palette);
};

// =================================================================
// GAS — fees tracker card
// =================================================================
export const gasTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#030810", "#061838", "#38bdf8"]);
  const [, , accent] = palette;
  const server = str(input, "server", "Apex Alpha");
  const eth = str(input, "eth", "12 gwei");
  const base = str(input, "base", "0.05 gwei");
  const sol = str(input, "sol", "0.000007 SOL");

  drawHeaderBar(ctx, "⛽  GAS TRACKER", "LIVE FEES", accent);

  const chains = [
    { name: "ETHEREUM", fee: eth, icon: "🟣", status: "🟢 normal" },
    { name: "BASE", fee: base, icon: "🔵", status: "🟢 cheap" },
    { name: "SOLANA", fee: sol, icon: "🟣", status: "🟢 spammable" },
  ];
  const cw = (W - 56 - 24) / 3;
  for (let i2 = 0; i2 < 3; i2++) {
    const chain2 = chains[i2]!;
    const cx = 28 + i2 * (cw + 12);
    const cy = 88;
    roundedRect(ctx, cx, cy, cw, H - 88 - 56, 18);
    const bg2 = ctx.createLinearGradient(cx, cy, cx, cy + H - 144);
    bg2.addColorStop(0, hexAlpha("#ffffff", 0.06));
    bg2.addColorStop(1, hexAlpha("#000000", 0.55));
    ctx.fillStyle = bg2;
    ctx.fill();
    roundedRect(ctx, cx, cy, cw, H - 88 - 56, 18);
    ctx.strokeStyle = hexAlpha(accent, 0.22);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    drawText(ctx, chain2.name, cx + 20, cy + 50, { size: 20, weight: "900", color: accent });
    drawText(ctx, chain2.fee, cx + 20, cy + 130, { size: 22, weight: "800", color: "#ffffff" });
    drawText(ctx, chain2.status, cx + 20, cy + 175, { size: 16, weight: "700", color: "#00e676" });
    drawSparkline(ctx, cx + 14, cy + 230, cw - 28, 100, rng, "wave", accent);
  }

  brandFooter(ctx, server, "Great time to ape", palette);
};

// =================================================================
// ANNOUNCEMENT — official server announcement card
// =================================================================
export const announceTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng);
  const [, , accent] = palette;
  const title = str(input, "title", "ANNOUNCEMENT");
  const body = str(input, "body", "Big news coming.");
  const server = str(input, "server", "Apex Alpha");

  drawHeaderBar(ctx, "📢  OFFICIAL", server.toUpperCase(), accent);

  drawAccentLine(ctx, 36, 100, 260, accent);

  drawGlowText(ctx, title.toUpperCase(), 36, 210, {
    size: 58, weight: "900", color: "#ffffff",
    glowColor: accent, glowRadius: 18, maxWidth: W - 72,
  });

  wrapText(ctx, body, 36, 270, W - 80, 38, {
    size: 24, weight: "600", color: "rgba(255,255,255,0.9)",
  });

  drawPremiumBadge(ctx, 36, 490, pickFrom(rng, ["LIMITED", "READ ME", "IMPORTANT", "MUST READ", "⚡ ACTION REQUIRED"]), accent, true);

  brandFooter(ctx, server, "Official Announcements", palette);
};

// =================================================================
// VIP SNIPE — partially blurred preview card
// =================================================================
export const snipeTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#070010", "#1a004d", "#b66fff"]);
  const [, , accent] = palette;
  const ticker = str(input, "ticker", "TOKEN");
  const mc = num(input, "mc", 12_500);
  const handle = str(input, "handle", "@apex");
  const server = str(input, "server", "Apex Alpha");

  drawHeaderBar(ctx, "💎  VIP SNIPE", "PUBLIC PREVIEW", accent);

  drawGlowText(ctx, `$${ticker.slice(0, 2).toUpperCase()}•••`, 36, 215, {
    size: 94, weight: "900", color: "#ffffff",
    glowColor: accent, glowRadius: 28,
  });
  drawGlowText(ctx, `Filled @ ${fmtMoney(mc)}`, 36, 278, {
    size: 34, weight: "800", color: accent,
    glowColor: accent, glowRadius: 15,
  });

  drawCandles(ctx, W - 440, 88, 400, 240, rng, "up");

  roundedRect(ctx, W / 2 - 240, 360, 480, 72, 36);
  ctx.fillStyle = hexAlpha("#000000", 0.75);
  ctx.fill();
  roundedRect(ctx, W / 2 - 240, 360, 480, 72, 36);
  ctx.strokeStyle = hexAlpha(accent, 0.7);
  ctx.lineWidth = 2;
  ctx.stroke();
  drawGlowText(ctx, "🔒  CA LOCKED — VIP ONLY", W / 2, 404, {
    size: 22, weight: "900", color: accent,
    glowColor: accent, glowRadius: 14, align: "center",
  });

  drawText(ctx, `Join VIP → DM ${handle}`, W / 2, 466, {
    size: 22, weight: "700", color: "rgba(255,255,255,0.85)", align: "center",
  });

  drawGlowOrb(ctx, W - 110, 300, 55, accent, rng);

  brandFooter(ctx, server, "VIP Snipes", palette);
};

// =================================================================
// ALPHA — narrative thesis card
// =================================================================
export const alphaTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#04000f", "#150040", "#a78bfa"]);
  const [, , accent] = palette;
  const narrative = str(input, "narrative", "AI Agents");
  const server = str(input, "server", "Apex Alpha");

  drawHeaderBar(ctx, "🧠  ALPHA LOUNGE", "VIP DAILY BRIEF", accent);

  drawText(ctx, "NARRATIVE", 36, 130, { size: 14, weight: "800", color: hexAlpha(accent, 0.75) });
  drawAccentLine(ctx, 36, 136, 140, accent);

  drawGlowText(ctx, narrative.toUpperCase(), 36, 235, {
    size: 68, weight: "900", color: "#ffffff",
    glowColor: accent, glowRadius: 25, maxWidth: W * 0.6,
  });

  drawSparkline(ctx, 36, 275, W - 72, 130, rng, "up", accent);

  const insight = pickFrom(rng, [
    "Top wallets quietly accumulating. Public attention hasn't arrived.",
    "Narrative is just heating up. Smart money already positioned.",
    "On-chain data suggests significant accumulation phase underway.",
    "Early movers identified. Window closing fast.",
    "High-conviction play with strong on-chain confirmation.",
  ]);
  wrapText(ctx, insight, 36, 450, W - 80, 30, {
    size: 20, weight: "600", color: "rgba(255,255,255,0.85)",
  });

  drawGlowOrb(ctx, W - 140, 200, 80, accent, rng);

  brandFooter(ctx, server, "Alpha Lounge", palette);
};

// =================================================================
// MARKET — full-width chart + take card
// =================================================================
export const marketTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng);
  const [, , accent] = palette;
  const take = str(input, "take", "Range bound. Patience pays.");
  const server = str(input, "server", "Apex Alpha");
  const trend: "up" | "down" = (input["trend"] === "down") ? "down" : "up";

  drawHeaderBar(ctx, "📉  MARKET UPDATE", new Date().toUTCString().slice(5, 22), accent);

  drawCandles(ctx, 28, 88, W - 56, 310, rng, trend);

  roundedRect(ctx, 28, 418, W - 56, 68, 14);
  ctx.fillStyle = hexAlpha("#000000", 0.6);
  ctx.fill();
  roundedRect(ctx, 28, 418, W - 56, 68, 14);
  ctx.strokeStyle = hexAlpha(accent, 0.3);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  wrapText(ctx, take, 50, 458, W - 100, 32, {
    size: 22, weight: "600", color: "rgba(255,255,255,0.95)",
  });

  brandFooter(ctx, server, trend === "up" ? "RISK ON 🟢" : "RISK OFF 🔴", palette);
};

// =================================================================
// GENERAL CHAT — premium quote bubble
// =================================================================
export const chatTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng);
  const [, , accent] = palette;
  const quote = str(input, "quote", "gm degens, who's printing today");
  const persona = str(input, "persona", "anon");
  const server = str(input, "server", "Apex Alpha");

  drawHeaderBar(ctx, "💬  GENERAL CHAT", server.toUpperCase(), accent);

  drawAvatar(ctx, 100, 260, 70, rng, palette);

  roundedRect(ctx, 195, 165, W - 230, 200, 22);
  const bubbleGrad = ctx.createLinearGradient(195, 165, 195, 365);
  bubbleGrad.addColorStop(0, hexAlpha("#ffffff", 0.1));
  bubbleGrad.addColorStop(1, hexAlpha("#000000", 0.55));
  ctx.fillStyle = bubbleGrad;
  ctx.fill();
  roundedRect(ctx, 195, 165, W - 230, 200, 22);
  ctx.strokeStyle = hexAlpha(accent, 0.3);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  drawText(ctx, persona, 218, 215, { size: 18, weight: "800", color: accent });
  wrapText(ctx, quote, 218, 258, W - 280, 34, {
    size: 24, weight: "600", color: "#ffffff",
  });

  brandFooter(ctx, server, "general-chat", palette);
};

// =================================================================
// EARLY ACCESS — radar countdown card
// =================================================================
export const earlyTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#000d18", "#002040", "#00d4ff"]);
  const [, , accent] = palette;
  const ticker = str(input, "ticker", "TOKEN");
  const lead = str(input, "lead", "20");
  const handle = str(input, "handle", "@apex");
  const server = str(input, "server", "Apex Alpha");

  drawHeaderBar(ctx, "🚀  EARLY ACCESS", "VIP RADAR", accent);

  drawText(ctx, "ON THE RADAR", 36, 130, { size: 14, weight: "800", color: hexAlpha(accent, 0.75) });
  drawAccentLine(ctx, 36, 136, 160, accent);

  drawGlowText(ctx, `$${ticker.toUpperCase()}`, 36, 248, {
    size: 90, weight: "900", color: "#ffffff",
    glowColor: accent, glowRadius: 30,
  });
  drawGlowText(ctx, `${lead} MIN BEFORE PUBLIC`, 36, 306, {
    size: 26, weight: "800", color: accent,
    glowColor: accent, glowRadius: 12,
  });

  const cx = W - 195, cy = 295, maxR = 145;
  for (let i = 1; i <= 5; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy, (maxR * i) / 5, 0, Math.PI * 2);
    ctx.strokeStyle = hexAlpha(accent, 0.08 + i * 0.05);
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + maxR * 0.82, cy - maxR * 0.56);
  ctx.strokeStyle = hexAlpha(accent, 0.75);
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.fill();

  drawText(ctx, `→ DM ${handle} for the CA`, 36, H - 70, {
    size: 22, weight: "800", color: "#ffffff",
  });

  brandFooter(ctx, server, "Early Access", palette);
};

// =================================================================
// INFO — welcome / rules / verified / commands
// =================================================================
export const infoTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#06000f", "#1a0050", "#c084fc"]);
  const [, , accent] = palette;
  const tag = str(input, "tag", "WELCOME");
  const title = str(input, "title", "WELCOME TO APEX");
  const subtitle = str(input, "subtitle", "");
  const server = str(input, "server", "Apex Alpha");

  drawHeaderBar(ctx, tag, server.toUpperCase(), accent);
  drawAccentLine(ctx, 36, 100, 200, accent);

  drawGlowText(ctx, title.toUpperCase(), 36, 250, {
    size: 70, weight: "900", color: "#ffffff",
    glowColor: accent, glowRadius: 22, maxWidth: W - 72,
  });

  if (subtitle) {
    drawText(ctx, subtitle, 36, 310, {
      size: 26, weight: "600", color: "rgba(255,255,255,0.85)", maxWidth: W - 72,
    });
  }

  drawGlowOrb(ctx, W - 160, 290, 95, accent, rng);

  brandFooter(ctx, server, "INFO", palette);
};

export const TEMPLATES: Record<string, RenderTemplate> = {
  proof: proofTemplate,
  call: callTemplate,
  vip: vipTemplate,
  alert: alertTemplate,
  whale: whaleTemplate,
  trade: tradeTemplate,
  trending: trendingTemplate,
  price: priceTemplate,
  gas: gasTemplate,
  announce: announceTemplate,
  snipe: snipeTemplate,
  alpha: alphaTemplate,
  market: marketTemplate,
  chat: chatTemplate,
  early: earlyTemplate,
  info: infoTemplate,
};
