import type { SKRSContext2D } from "@napi-rs/canvas";
import {
  brandFooter,
  drawAvatar,
  drawCandles,
  drawSparkline,
  drawText,
  hexAlpha,
  paintBackground,
  pickFrom,
  roundedRect,
  SIZE,
  wrapText,
  type RenderInput,
  type RenderTemplate,
} from "./canvas";

const { W, H } = SIZE;

const HYPE_TAGS = [
  "ABSOLUTE BANGER",
  "VIP CALL DELIVERED",
  "PUBLIC GOT FED",
  "ANOTHER CLEAN HIT",
  "WE EAT GOOD",
  "DIAMOND SEASON",
  "INSIDER SIGNAL",
  "ANOTHER ONE",
];

const ICONS = ["🚀", "💎", "🔥", "⚡", "🐋", "🧠", "🎯", "📈", "🟢", "💰"];

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
// PROOF — big multiplier card ("$TOKEN hit 109x")
// =================================================================
export const proofTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng);
  const ticker = str(input, "ticker", "TOKEN");
  const x = num(input, "x", 50);
  const entry = num(input, "entry", 12_300);
  const ath = Math.round(entry * x);
  const server = str(input, "server", "Apex Alpha");
  const handle = str(input, "handle", "@apex");

  // top brand strip
  drawText(ctx, "🏆 PROOF / RECEIPT", 36, 56, { size: 18, weight: "700", color: hexAlpha(palette[2], 0.95) });
  drawText(ctx, server.toUpperCase(), W - 36, 56, {
    size: 18, weight: "700", color: "rgba(255,255,255,0.7)", align: "right",
  });

  // ticker
  drawText(ctx, `$${ticker.toUpperCase()}`, 36, 130, {
    size: 64, weight: "900", color: "#ffffff",
  });

  // big X
  const xText = `${x.toFixed(x >= 100 ? 0 : 1)}x`;
  ctx.font = `900 220px Sans`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.fillText(xText, 36, 360);

  // chart underlay (right side)
  drawCandles(ctx, W - 460, 100, 420, 280, rng, "up");

  // entry / ATH chips
  const chipY = 410;
  drawChip(ctx, 36, chipY, `Called at ${fmtMoney(entry)}`, palette);
  drawChip(ctx, 36 + 240 + 16, chipY, `ATH ${fmtMoney(ath)}`, palette);
  drawChip(ctx, 36 + (240 + 16) * 2, chipY, pickFrom(rng, HYPE_TAGS), palette, true);

  // call to action
  drawText(ctx, `Want the next one? DM ${handle}`, 36, 490, {
    size: 22, weight: "700", color: "rgba(255,255,255,0.92)",
  });

  brandFooter(ctx, server, `Receipts • ${new Date().toUTCString().slice(5, 22)}`, palette);
};

// =================================================================
// CALL — new free call card
// =================================================================
export const callTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng);
  const ticker = str(input, "ticker", "TOKEN");
  const mc = num(input, "mc", 18_400);
  const liq = num(input, "liq", 24_500);
  const chain = str(input, "chain", "Solana");
  const dex = str(input, "dex", "PumpSwap");
  const server = str(input, "server", "Apex Alpha");

  drawText(ctx, "📊 NEW CALL", 36, 56, { size: 18, weight: "800", color: palette[2] });
  drawText(ctx, `${chain} • ${dex}`, W - 36, 56, {
    size: 16, weight: "700", color: "rgba(255,255,255,0.7)", align: "right",
  });

  drawText(ctx, `$${ticker.toUpperCase()}`, 36, 150, {
    size: 80, weight: "900", color: "#ffffff",
  });

  // sparkline up
  drawSparkline(ctx, W - 460, 100, 420, 200, rng, "up", "#22c55e");

  // stat blocks
  const statY = 270;
  statBlock(ctx, 36, statY, "MCAP", fmtMoney(mc), palette);
  statBlock(ctx, 36 + 240, statY, "LIQUIDITY", fmtMoney(liq), palette);
  statBlock(ctx, 36 + 240 * 2, statY, "ENTRY", "NOW", palette);

  // tag row
  const tagY = 430;
  drawChip(ctx, 36, tagY, "LOW MCAP", palette);
  drawChip(ctx, 36 + 200, tagY, "FRESH LAUNCH", palette);
  drawChip(ctx, 36 + 200 + 230, tagY, pickFrom(rng, ["VIP GOT EARLIER", "INSIDER PICK", "ALPHA CLUSTER"]), palette, true);

  brandFooter(ctx, server, "Free Calls • DYOR", palette);
};

// =================================================================
// VIP — sales card
// =================================================================
export const vipTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#1a0033", "#4c1d95", "#f0abfc"]);
  const handle = str(input, "handle", "@apex");
  const server = str(input, "server", "Apex Alpha");
  const wins = (input["wins"] ?? "196x,120x,109x").split(",").slice(0, 3);

  drawText(ctx, "💎 JOIN VIP", 36, 60, { size: 22, weight: "800", color: palette[2] });
  drawText(ctx, "EARLY ENTRIES • REAL FILLS • RECEIPTS", W - 36, 60, {
    size: 14, weight: "700", color: "rgba(255,255,255,0.7)", align: "right",
  });

  drawText(ctx, "Stop fading", 36, 150, { size: 60, weight: "900", color: "#ffffff" });
  drawText(ctx, "the calls.", 36, 215, { size: 60, weight: "900", color: palette[2] });

  // win chips
  let cx = 36;
  for (const w of wins) {
    drawChip(ctx, cx, 260, w.trim().toUpperCase(), palette, true);
    cx += 200;
  }

  // bullet list
  const bullets = [
    "🎯  CA before the public chart wakes",
    "🐋  Whale wallets to copy-trade",
    "📈  Live entries + exits in real time",
    "🧠  Daily alpha + narrative briefing",
  ];
  let by = 350;
  for (const b of bullets) {
    drawText(ctx, b, 36, by, { size: 22, weight: "600", color: "rgba(255,255,255,0.92)" });
    by += 36;
  }

  // CTA
  drawText(ctx, `→  DM ${handle} now`, 36, H - 80, {
    size: 28, weight: "800", color: "#ffffff",
  });

  brandFooter(ctx, server, "VIP • Limited seats", palette);
};

// =================================================================
// ALERT — bold red/pink notice
// =================================================================
export const alertTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#1a0808", "#831843", "#fb7185"]);
  const title = str(input, "title", "ALERT");
  const body = str(input, "body", "Something is moving.");
  const server = str(input, "server", "Apex Alpha");

  drawText(ctx, "📡 BREAKING ALERT", 36, 60, { size: 22, weight: "800", color: palette[2] });

  drawText(ctx, title.toUpperCase(), 36, 160, {
    size: 52, weight: "900", color: "#ffffff", maxWidth: W - 72,
  });

  wrapText(ctx, body, 36, 230, W - 72, 36, {
    size: 24, weight: "600", color: "rgba(255,255,255,0.92)",
  });

  // pulsing dot
  ctx.beginPath();
  ctx.arc(W - 80, 70, 14, 0, Math.PI * 2);
  ctx.fillStyle = "#fb7185";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(W - 80, 70, 24, 0, Math.PI * 2);
  ctx.strokeStyle = hexAlpha("#fb7185", 0.45);
  ctx.lineWidth = 3;
  ctx.stroke();

  brandFooter(ctx, server, "ALERTS • REAL-TIME", palette);
};

// =================================================================
// WHALE — wallet movement card
// =================================================================
export const whaleTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#022c22", "#0e7490", "#22d3ee"]);
  const action = str(input, "action", "BOUGHT");
  const ticker = str(input, "ticker", "TOKEN");
  const wallet = str(input, "wallet", "ABCD…WXYZ");
  const sizeStr = str(input, "size", "240 SOL");
  const usdStr = str(input, "usd", "$48,000");
  const tag = str(input, "tag", "Smart Money #1");
  const server = str(input, "server", "Apex Alpha");
  const isExit = action.toLowerCase().includes("exit") || action.toLowerCase().includes("trim");
  const accent = isExit ? "#ef4444" : "#34d399";

  drawText(ctx, "🐋 WHALE TRACKER", 36, 60, { size: 22, weight: "800", color: palette[2] });
  drawText(ctx, tag.toUpperCase(), W - 36, 60, {
    size: 16, weight: "700", color: "rgba(255,255,255,0.7)", align: "right",
  });

  drawAvatar(ctx, 110, 230, 70, rng, palette);

  drawText(ctx, `${action.toUpperCase()}  $${ticker.toUpperCase()}`, 210, 200, {
    size: 48, weight: "900", color: accent,
  });
  drawText(ctx, `Wallet  ${wallet}`, 210, 250, {
    size: 22, weight: "600", color: "rgba(255,255,255,0.85)",
  });

  // stat blocks
  statBlock(ctx, 36, 360, "SIZE", sizeStr, palette);
  statBlock(ctx, 36 + 240, 360, "VALUE", usdStr, palette);
  statBlock(ctx, 36 + 240 * 2, 360, "TX", "ON-CHAIN", palette);

  brandFooter(ctx, server, "TRACKING 1,200+ WALLETS", palette);
};

// =================================================================
// TRADE — buy/trim/exit card
// =================================================================
export const tradeTemplate: RenderTemplate = (ctx, input, rng) => {
  const direction = str(input, "direction", "BUY");
  const isBuy = direction === "BUY";
  const isExit = direction === "EXIT";
  const palette = paintBackground(
    ctx, rng,
    isBuy ? ["#022c22", "#065f46", "#34d399"] :
    isExit ? ["#1a0808", "#7f1d1d", "#fb7185"] :
             ["#1c1917", "#3f3f46", "#facc15"],
  );

  const ticker = str(input, "ticker", "TOKEN");
  const sizeStr = str(input, "size", "12 SOL");
  const usdStr = str(input, "usd", "$2,400");
  const wallet = str(input, "wallet", "ABCD…WXYZ");
  const server = str(input, "server", "Apex Alpha");

  drawText(ctx, "📈 LIVE TRADE", 36, 60, { size: 22, weight: "800", color: palette[2] });
  drawText(ctx, wallet, W - 36, 60, {
    size: 16, weight: "700", color: "rgba(255,255,255,0.7)", align: "right",
  });

  drawText(ctx, direction, 36, 180, {
    size: 86, weight: "900", color: isBuy ? "#22c55e" : isExit ? "#ef4444" : "#facc15",
  });
  drawText(ctx, `$${ticker.toUpperCase()}`, 36, 260, {
    size: 56, weight: "900", color: "#ffffff",
  });

  drawCandles(ctx, W - 460, 110, 420, 250, rng, isBuy ? "up" : isExit ? "down" : "wave" as never);

  statBlock(ctx, 36, 350, "SIZE", sizeStr, palette);
  statBlock(ctx, 36 + 240, 350, "USD", usdStr, palette);
  statBlock(ctx, 36 + 240 * 2, 350, "STATUS", isBuy ? "FILLED" : isExit ? "CLOSED" : "TRIMMED", palette);

  brandFooter(ctx, server, "Live Trades", palette);
};

// =================================================================
// TRENDING — top 3 list card
// =================================================================
export const trendingTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#0c0a09", "#7c2d12", "#f97316"]);
  const items = (input["items"] ?? "DEGEN:+220,WIF2:+148,BONK2:+92").split(",").slice(0, 3);
  const server = str(input, "server", "Apex Alpha");

  drawText(ctx, "🔥 TRENDING NOW", 36, 60, { size: 22, weight: "800", color: palette[2] });
  drawText(ctx, "LAST 24H", W - 36, 60, {
    size: 16, weight: "700", color: "rgba(255,255,255,0.7)", align: "right",
  });

  let y = 150;
  let rank = 1;
  for (const it of items) {
    const [name, change] = (it ?? "").split(":");
    roundedRect(ctx, 36, y, W - 72, 92, 18);
    ctx.fillStyle = hexAlpha("#000000", 0.35);
    ctx.fill();
    drawText(ctx, `#${rank}`, 60, y + 60, { size: 36, weight: "900", color: palette[2] });
    drawText(ctx, `$${(name ?? "TOKEN").toUpperCase()}`, 150, y + 60, {
      size: 36, weight: "900", color: "#ffffff",
    });
    drawText(ctx, `${change ?? "+0"}%`, W - 60, y + 60, {
      size: 36, weight: "900", color: "#34d399", align: "right",
    });
    y += 110;
    rank++;
  }

  brandFooter(ctx, server, "Updated every 5m", palette);
};

// =================================================================
// PRICE — major coins ticker card
// =================================================================
export const priceTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#0a0a0a", "#1f2937", "#22d3ee"]);
  const server = str(input, "server", "Apex Alpha");
  const items = (input["items"] ?? "BTC:65000:+1.2,ETH:3200:+2.1,SOL:185:+4.5,WIF:2.10:+8.4").split(",");

  drawText(ctx, "📊 LIVE PRICES", 36, 60, { size: 22, weight: "800", color: palette[2] });
  drawText(ctx, new Date().toUTCString().slice(17, 25) + " UTC", W - 36, 60, {
    size: 16, weight: "700", color: "rgba(255,255,255,0.7)", align: "right",
  });

  let i = 0;
  for (const it of items.slice(0, 6)) {
    const [sym, p, ch] = (it ?? "").split(":");
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 36 + col * ((W - 72) / 3);
    const y = 130 + row * 200;
    const cw = (W - 72) / 3 - 16;
    roundedRect(ctx, x, y, cw, 180, 18);
    ctx.fillStyle = hexAlpha("#000000", 0.4);
    ctx.fill();
    drawText(ctx, sym ?? "?", x + 24, y + 50, { size: 28, weight: "800", color: "rgba(255,255,255,0.85)" });
    drawText(ctx, `$${p ?? "0"}`, x + 24, y + 100, { size: 36, weight: "900", color: "#ffffff" });
    const change = ch ?? "+0";
    const isUp = !change.startsWith("-");
    drawText(ctx, `${change}%  24h`, x + 24, y + 145, {
      size: 18, weight: "800", color: isUp ? "#22c55e" : "#ef4444",
    });
    drawSparkline(ctx, x + cw - 130, y + 90, 110, 60, rng, isUp ? "up" : "down", isUp ? "#22c55e" : "#ef4444");
    i++;
  }

  brandFooter(ctx, server, "Refresh ~15m", palette);
};

// =================================================================
// GAS — fees card
// =================================================================
export const gasTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#0a0f1f", "#1e3a8a", "#22d3ee"]);
  const server = str(input, "server", "Apex Alpha");
  const eth = str(input, "eth", "12 gwei");
  const base = str(input, "base", "0.05 gwei");
  const sol = str(input, "sol", "0.000007 SOL");

  drawText(ctx, "⛽ GAS TRACKER", 36, 60, { size: 22, weight: "800", color: palette[2] });

  card(ctx, 36, 130, (W - 72) / 3 - 12, 380, "ETHEREUM", eth, "🟢 normal", palette);
  card(ctx, 36 + (W - 72) / 3, 130, (W - 72) / 3 - 12, 380, "BASE", base, "🟢 cheap", palette);
  card(ctx, 36 + ((W - 72) / 3) * 2, 130, (W - 72) / 3 - 12, 380, "SOLANA", sol, "🟢 spammable", palette);

  brandFooter(ctx, server, "Good moment to ape", palette);
};

// =================================================================
// ANNOUNCEMENT — generic hype banner
// =================================================================
export const announceTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng);
  const title = str(input, "title", "ANNOUNCEMENT");
  const body = str(input, "body", "Big news coming.");
  const server = str(input, "server", "Apex Alpha");

  drawText(ctx, "📢 OFFICIAL", 36, 60, { size: 22, weight: "800", color: palette[2] });
  drawText(ctx, server.toUpperCase(), W - 36, 60, {
    size: 16, weight: "700", color: "rgba(255,255,255,0.7)", align: "right",
  });

  drawText(ctx, title.toUpperCase(), 36, 170, {
    size: 56, weight: "900", color: "#ffffff", maxWidth: W - 72,
  });
  wrapText(ctx, body, 36, 240, W - 72, 36, {
    size: 24, weight: "600", color: "rgba(255,255,255,0.9)",
  });

  // decorative accent bar
  ctx.fillStyle = palette[2];
  ctx.fillRect(36, 130, 120, 8);

  brandFooter(ctx, server, pickFrom(rng, ["LIMITED", "READ ME", "IMPORTANT", "MUST READ"]), palette);
};

// =================================================================
// VIP SNIPE — partially blurred preview
// =================================================================
export const snipeTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#0a0014", "#4c1d95", "#a855f7"]);
  const ticker = str(input, "ticker", "TOKEN");
  const mc = num(input, "mc", 12_500);
  const handle = str(input, "handle", "@apex");
  const server = str(input, "server", "Apex Alpha");

  drawText(ctx, "💎 VIP SNIPE", 36, 60, { size: 22, weight: "800", color: palette[2] });
  drawText(ctx, "PUBLIC PREVIEW", W - 36, 60, {
    size: 16, weight: "700", color: "rgba(255,255,255,0.7)", align: "right",
  });

  // blurred ticker
  drawText(ctx, `$${ticker.slice(0, 2).toUpperCase()}•••`, 36, 200, {
    size: 84, weight: "900", color: "#ffffff",
  });
  drawText(ctx, `Filled @ ${fmtMoney(mc)}`, 36, 260, {
    size: 32, weight: "800", color: "rgba(255,255,255,0.9)",
  });

  // candles trending up
  drawCandles(ctx, W - 460, 110, 420, 250, rng, "up");

  // big "LOCKED" badge
  ctx.save();
  ctx.translate(W / 2, 410);
  roundedRect(ctx, -200, -32, 400, 64, 32);
  ctx.fillStyle = hexAlpha("#000000", 0.6);
  ctx.fill();
  drawText(ctx, "🔒  CA LOCKED — VIP ONLY", 0, 8, {
    size: 22, weight: "800", color: palette[2], align: "center",
  });
  ctx.restore();

  drawText(ctx, `Unlock: DM ${handle}`, W / 2, 480, {
    size: 22, weight: "700", color: "rgba(255,255,255,0.9)", align: "center",
  });

  brandFooter(ctx, server, "VIP Snipes", palette);
};

// =================================================================
// ALPHA — narrative thesis card
// =================================================================
export const alphaTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#0a0f1f", "#312e81", "#a855f7"]);
  const narrative = str(input, "narrative", "AI Agents");
  const server = str(input, "server", "Apex Alpha");

  drawText(ctx, "🧠 ALPHA LOUNGE", 36, 60, { size: 22, weight: "800", color: palette[2] });
  drawText(ctx, "VIP DAILY BRIEF", W - 36, 60, {
    size: 16, weight: "700", color: "rgba(255,255,255,0.7)", align: "right",
  });

  drawText(ctx, "NARRATIVE", 36, 150, { size: 16, weight: "800", color: "rgba(255,255,255,0.6)" });
  drawText(ctx, narrative.toUpperCase(), 36, 215, {
    size: 64, weight: "900", color: "#ffffff", maxWidth: W - 72,
  });

  drawSparkline(ctx, 36, 280, W - 72, 140, rng, "up", palette[2]);

  drawText(ctx, "Top wallets are quietly accumulating. Public attention hasn't arrived.", 36, 480, {
    size: 18, weight: "600", color: "rgba(255,255,255,0.85)",
  });

  brandFooter(ctx, server, "Alpha Lounge", palette);
};

// =================================================================
// MARKET — chart + take card
// =================================================================
export const marketTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng);
  const take = str(input, "take", "Range bound. Patience pays.");
  const server = str(input, "server", "Apex Alpha");
  const trend: "up" | "down" = (input["trend"] === "down") ? "down" : "up";

  drawText(ctx, "📉 MARKET CHAT", 36, 60, { size: 22, weight: "800", color: palette[2] });
  drawText(ctx, new Date().toUTCString().slice(5, 22), W - 36, 60, {
    size: 16, weight: "700", color: "rgba(255,255,255,0.7)", align: "right",
  });

  drawCandles(ctx, 36, 110, W - 72, 280, rng, trend);

  wrapText(ctx, take, 36, 440, W - 72, 32, {
    size: 22, weight: "600", color: "rgba(255,255,255,0.95)",
  });

  brandFooter(ctx, server, trend === "up" ? "RISK ON" : "RISK OFF", palette);
};

// =================================================================
// GENERAL CHAT — quote bubble (used as image for general-chat)
// =================================================================
export const chatTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng);
  const quote = str(input, "quote", "gm degens, who's printing today");
  const persona = str(input, "persona", "anon");
  const server = str(input, "server", "Apex Alpha");

  drawText(ctx, "💬 GENERAL CHAT", 36, 60, { size: 18, weight: "800", color: palette[2] });

  drawAvatar(ctx, 100, 240, 70, rng, palette);

  // bubble
  roundedRect(ctx, 200, 170, W - 240, 160, 24);
  ctx.fillStyle = hexAlpha("#000000", 0.45);
  ctx.fill();

  drawText(ctx, persona, 220, 215, { size: 18, weight: "800", color: palette[2] });
  wrapText(ctx, quote, 220, 250, W - 280, 32, {
    size: 22, weight: "600", color: "#ffffff",
  });

  brandFooter(ctx, server, "general-chat", palette);
};

// =================================================================
// EARLY ACCESS — radar / countdown card
// =================================================================
export const earlyTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#020617", "#0e7490", "#22d3ee"]);
  const ticker = str(input, "ticker", "TOKEN");
  const lead = str(input, "lead", "20");
  const handle = str(input, "handle", "@apex");
  const server = str(input, "server", "Apex Alpha");

  drawText(ctx, "🚀 EARLY ACCESS", 36, 60, { size: 22, weight: "800", color: palette[2] });
  drawText(ctx, "VIP RADAR", W - 36, 60, {
    size: 16, weight: "700", color: "rgba(255,255,255,0.7)", align: "right",
  });

  drawText(ctx, "ON THE RADAR", 36, 150, { size: 18, weight: "800", color: "rgba(255,255,255,0.6)" });
  drawText(ctx, `$${ticker.toUpperCase()}`, 36, 230, {
    size: 80, weight: "900", color: "#ffffff",
  });

  drawText(ctx, `${lead} MINUTES BEFORE PUBLIC`, 36, 300, {
    size: 28, weight: "800", color: palette[2],
  });

  // radar circles
  const cx = W - 200, cy = 290, r = 130;
  for (let i = 1; i <= 4; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy, (r * i) / 4, 0, Math.PI * 2);
    ctx.strokeStyle = hexAlpha("#22d3ee", 0.18 + i * 0.06);
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + r, cy - r);
  ctx.strokeStyle = hexAlpha("#22d3ee", 0.6);
  ctx.lineWidth = 3;
  ctx.stroke();

  drawText(ctx, `→ DM ${handle} for the CA`, 36, H - 80, {
    size: 24, weight: "800", color: "#ffffff",
  });

  brandFooter(ctx, server, "Early Access", palette);
};

// =================================================================
// INFO — welcome / rules / verified / commands
// =================================================================
export const infoTemplate: RenderTemplate = (ctx, input, rng) => {
  const palette = paintBackground(ctx, rng, ["#0c0a1a", "#4c1d95", "#f0abfc"]);
  const tag = str(input, "tag", "WELCOME");
  const title = str(input, "title", "WELCOME TO APEX");
  const subtitle = str(input, "subtitle", "");
  const server = str(input, "server", "Apex Alpha");

  drawText(ctx, tag, 36, 60, { size: 22, weight: "800", color: palette[2] });
  drawText(ctx, title.toUpperCase(), 36, 220, {
    size: 70, weight: "900", color: "#ffffff", maxWidth: W - 72,
  });
  if (subtitle) {
    drawText(ctx, subtitle, 36, 290, {
      size: 26, weight: "600", color: "rgba(255,255,255,0.85)", maxWidth: W - 72,
    });
  }

  // accent line
  ctx.fillStyle = palette[2];
  ctx.fillRect(36, 150, 160, 10);

  brandFooter(ctx, server, "INFO", palette);
};

// =================================================================
// helpers
// =================================================================
function drawChip(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  text: string,
  palette: [string, string, string],
  highlight = false,
): void {
  ctx.font = `800 18px Sans`;
  const m = ctx.measureText(text);
  const padX = 18, padY = 12;
  const w = Math.max(180, m.width + padX * 2);
  const h = 44;
  roundedRect(ctx, x, y, w, h, 22);
  ctx.fillStyle = highlight ? palette[2] : hexAlpha("#000000", 0.5);
  ctx.fill();
  ctx.strokeStyle = highlight ? "rgba(255,255,255,0.3)" : hexAlpha(palette[2], 0.45);
  ctx.lineWidth = 2;
  ctx.stroke();
  drawText(ctx, text, x + w / 2, y + 28, {
    size: 16, weight: "800",
    color: highlight ? "#0a0a0a" : "#ffffff",
    align: "center",
  });
}

function statBlock(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  label: string,
  value: string,
  palette: [string, string, string],
): void {
  const w = 220, h = 100;
  roundedRect(ctx, x, y, w, h, 18);
  ctx.fillStyle = hexAlpha("#000000", 0.4);
  ctx.fill();
  ctx.strokeStyle = hexAlpha(palette[2], 0.4);
  ctx.lineWidth = 2;
  ctx.stroke();
  drawText(ctx, label, x + 18, y + 32, { size: 14, weight: "800", color: hexAlpha(palette[2], 0.95) });
  drawText(ctx, value, x + 18, y + 78, { size: 30, weight: "900", color: "#ffffff" });
}

function card(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  status: string,
  palette: [string, string, string],
): void {
  roundedRect(ctx, x, y, w, h, 22);
  ctx.fillStyle = hexAlpha("#000000", 0.4);
  ctx.fill();
  ctx.strokeStyle = hexAlpha(palette[2], 0.35);
  ctx.lineWidth = 2;
  ctx.stroke();
  drawText(ctx, label, x + w / 2, y + 60, { size: 22, weight: "800", color: palette[2], align: "center" });
  drawText(ctx, value, x + w / 2, y + h / 2 + 10, {
    size: 28, weight: "900", color: "#ffffff", align: "center",
  });
  drawText(ctx, status, x + w / 2, y + h - 40, {
    size: 18, weight: "700", color: "rgba(255,255,255,0.85)", align: "center",
  });
}

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
