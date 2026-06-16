/**
 * Proof-style card templates — mimicking real DexScreener info cards and
 * wallet PnL screenshots like the ones in Alpha Circle 100x / VIRTUAL CALLS.
 * These produce REAL-LOOKING embed images with actual token data,
 * DexScreener-style stat grids, and wallet profit screenshots.
 */
import type { SKRSContext2D } from "@napi-rs/canvas";
import {
  drawText,
  hexAlpha,
  roundedRect,
  SIZE,
  type RenderInput,
  type RenderTemplate,
} from "./canvas";

const { W, H } = SIZE;

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

function fmtMoney(n: number): string {
  if (!isFinite(n)) return "—";
  if (n >= 1_000_000_000) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function fmtPrice(n: number): string {
  if (!isFinite(n) || n <= 0) return "—";
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  if (n >= 0.0001) return `$${n.toFixed(6)}`;
  if (n >= 0.000001) return `$${n.toFixed(8)}`;
  return `$${n.toExponential(2)}`;
}

/**
 * DEXSCREENER-STYLE NEW CALL CARD
 * A dark card mimicking the DexScreener pair info panel:
 * Price USD, Price SOL, Market Cap, Liquidity, Volume, Age.
 * Exactly like the Alpha Circle 100x "NEW CALL" screenshots.
 */
export const dexCardTemplate: RenderTemplate = (ctx, input, rng) => {
  const bg = "#0d0f14";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const ticker = str(input, "ticker", "TOKEN");
  const symbolFull = str(input, "symbol", ticker);
  const chain = str(input, "chain", "Solana");
  const dex = str(input, "dex", "PumpSwap");
  const priceUsd = num(input, "priceUsd", 0.000454);
  const priceSol = num(input, "priceSol", 0.00000641);
  const mcap = num(input, "mcap", 21800);
  const liquidity = num(input, "liquidity", 5200);
  const volume = num(input, "volume", 57000);
  const age = str(input, "age", "10 minutes");
  const change24hNum = num(input, "change24h", 0.03);
  const isGreen = change24hNum >= 0;
  const accent = isGreen ? "#22c55e" : "#ef4444";
  const changeStr = str(input, "change24hStr", isGreen ? `+${change24hNum.toFixed(2)}%` : `${change24hNum.toFixed(2)}%`);

  // ── Top bar ──
  roundedRect(ctx, 0, 0, W, 56, 0);
  ctx.fillStyle = "#13151a";
  ctx.fill();
  drawText(ctx, `${symbolFull} / SOL`, 20, 38, { size: 22, weight: "800", color: "#ffffff" });
  drawText(ctx, `(Market Cap) on ${dex}`, 220, 38, { size: 16, weight: "600", color: "#8b94a7" });

  // LIVE dot top-right
  ctx.beginPath();
  ctx.arc(W - 32, 28, 8, 0, Math.PI * 2);
  ctx.fillStyle = hexAlpha("#22c55e", 0.25);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(W - 32, 28, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#22c55e";
  ctx.fill();

  // Change pill
  const pillW = Math.max(110, changeStr.length * 11 + 20);
  roundedRect(ctx, W - pillW - 16, 14, pillW, 28, 14);
  ctx.fillStyle = isGreen ? hexAlpha("#22c55e", 0.15) : hexAlpha("#ef4444", 0.15);
  ctx.fill();
  drawText(ctx, changeStr, W - pillW - 6, 34, { size: 16, weight: "800", color: accent });

  // ── Stat grid (2 cols × 3 rows) ──
  const padX = 20;
  const colW = (W - padX * 2 - 16) / 2;
  let y = 74;

  const rows: Array<{ label: string; value: string; highlight?: boolean }> = [
    { label: "PRICE USD", value: fmtPrice(priceUsd), highlight: true },
    { label: "PRICE SOL", value: fmtPrice(priceSol), highlight: true },
    { label: "MKT CAP", value: fmtMoney(mcap), highlight: true },
    { label: "LIQUIDITY", value: fmtMoney(liquidity), highlight: true },
    { label: "VOLUME", value: fmtMoney(volume) },
    { label: "AGE", value: age },
  ];

  for (let i = 0; i < rows.length; i += 2) {
    for (let c = 0; c < 2; c++) {
      const r = rows[i + c];
      if (!r) continue;
      const cx = padX + c * (colW + 16);
      roundedRect(ctx, cx, y, colW, 76, 10);
      ctx.fillStyle = "#151820";
      ctx.fill();
      drawText(ctx, r.label, cx + 14, y + 26, { size: 12, weight: "600", color: "#6b7280" });
      drawText(ctx, r.value, cx + 14, y + 56, {
        size: r.highlight ? 26 : 22,
        weight: "900",
        color: r.highlight ? "#ffffff" : "#d1d5db",
      });
    }
    y += 90;
  }

  // ── Bottom bar ──
  roundedRect(ctx, padX, H - 42, W - padX * 2, 30, 8);
  ctx.fillStyle = hexAlpha("#1a1c24", 0.7);
  ctx.fill();
  drawText(ctx, `${chain} • ${dex}`, padX + 12, H - 22, { size: 13, weight: "700", color: "#6b7280" });

  // LIVE dot bottom-right
  ctx.beginPath();
  ctx.arc(W - 36, H - 27, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#22c55e";
  ctx.fill();
};

/**
 * "STILL PRINTING" UPDATE CARD
 * Shows updated DexScreener-style card with progression:
 * MKT CAP, LIQUIDITY, FDV, VOLUME, TXNS, BUYERS/SELLERS,
 * and the big "STILL PRINTING!" badge with multiplier.
 * Exactly like the VIRTUAL CALLS $SPCTROLL screenshots.
 */
export const printingTemplate: RenderTemplate = (ctx, input, rng) => {
  const bg = "#0d0f14";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const ticker = str(input, "ticker", "SPCTROLL");
  const mcap = num(input, "mcap", 17_700_000);
  const entryMcap = num(input, "entryMcap", 13_000);
  const mult = num(input, "mult", 1361);
  const liquidity = num(input, "liquidity", 364_000);
  const fdv = num(input, "fdv", 17_700_000);
  const change5m = str(input, "change5m", "8.59%");
  const change1h = str(input, "change1h", "285%");
  const change6h = str(input, "change6h", "1,199%");
  const change24h = str(input, "change24h", "11,345%");
  const volume = str(input, "volume", "$5.6M");
  const txnCount = str(input, "txns", "95,762");
  const buyers = str(input, "buyers", "14,220");
  const sellers = str(input, "sellers", "4,177");
  const buyVol = str(input, "buyVol", "80,882");
  const sellVol = str(input, "sellVol", "14,880");
  const vipCount = str(input, "vipCount", "1600");
  const publicMult = str(input, "publicMult", "8x");
  const chain = str(input, "chain", "Solana");
  const dex = str(input, "dex", "PumpSwap");

  // ── Top bar ──
  roundedRect(ctx, 0, 0, W, 56, 0);
  ctx.fillStyle = "#13151a";
  ctx.fill();
  drawText(ctx, ticker.toUpperCase(), 20, 38, { size: 24, weight: "900", color: "#ffffff" });
  drawText(ctx, `${chain} • ${dex}`, 200, 38, { size: 14, weight: "600", color: "#8b94a7" });

  const padX = 20;
  const colW = (W - padX * 2 - 16) / 2;
  let y = 72;

  // Row 1: MKT CAP + LIQUIDITY
  for (let c = 0; c < 2; c++) {
    const cx = padX + c * (colW + 16);
    const label = c === 0 ? "MKT CAP" : "LIQUIDITY";
    const value = c === 0 ? fmtMoney(mcap) : fmtMoney(liquidity);
    roundedRect(ctx, cx, y, colW, 76, 10);
    ctx.fillStyle = "#151820";
    ctx.fill();
    drawText(ctx, label, cx + 14, y + 26, { size: 12, weight: "600", color: "#6b7280" });
    drawText(ctx, value, cx + 14, y + 56, { size: 26, weight: "900", color: "#ffffff" });
  }
  y += 90;

  // Row 2: FDV + VOLUME
  for (let c = 0; c < 2; c++) {
    const cx = padX + c * (colW + 16);
    const label = c === 0 ? "FDV" : "VOLUME";
    const value = c === 0 ? fmtMoney(fdv) : volume;
    roundedRect(ctx, cx, y, colW, 76, 10);
    ctx.fillStyle = "#151820";
    ctx.fill();
    drawText(ctx, label, cx + 14, y + 26, { size: 12, weight: "600", color: "#6b7280" });
    drawText(ctx, value, cx + 14, y + 56, { size: 26, weight: "900", color: "#ffffff" });
  }
  y += 90;

  // Row 3: 5M / 1H / 6H / 24H changes
  const chColW = (W - padX * 2 - 36) / 4;
  const changes: Array<{ label: string; value: string }> = [
    { label: "5M", value: change5m },
    { label: "1H", value: change1h },
    { label: "6H", value: change6h },
    { label: "24H", value: change24h },
  ];
  for (let c = 0; c < 4; c++) {
    const ch = changes[c]!;
    const cx = padX + c * (chColW + 12);
    roundedRect(ctx, cx, y, chColW, 70, 10);
    ctx.fillStyle = hexAlpha("#22c55e", 0.06);
    ctx.fill();
    drawText(ctx, ch.label, cx + 10, y + 24, { size: 11, weight: "700", color: "#6b7280" });
    drawText(ctx, `+${ch.value}`, cx + 10, y + 50, { size: 17, weight: "800", color: "#22c55e" });
  }
  y += 84;

  // Row 4: TXNS + BUYERS / SELLERS
  for (let c = 0; c < 2; c++) {
    const cx = padX + c * (colW + 16);
    const label = c === 0 ? "TXNS" : "BUYERS / SELLERS";
    const value = c === 0 ? txnCount : `${buyers} / ${sellers}`;
    roundedRect(ctx, cx, y, colW, 76, 10);
    ctx.fillStyle = "#151820";
    ctx.fill();
    drawText(ctx, label, cx + 14, y + 26, { size: 12, weight: "600", color: "#6b7280" });
    drawText(ctx, value, cx + 14, y + 56, { size: 22, weight: "900", color: "#ffffff" });
  }
  y += 90;

  // Row 5: Buy/Sell volume bar
  const totalVol = parseInt(buyVol.replace(/,/g, "")) + parseInt(sellVol.replace(/,/g, ""));
  const buyPct = totalVol > 0 ? parseInt(buyVol.replace(/,/g, "")) / totalVol : 0.5;
  const barW = W - padX * 2;
  roundedRect(ctx, padX, y, barW, 58, 10);
  ctx.fillStyle = "#151820";
  ctx.fill();
  // Buy side
  const bw = (barW - 4) * buyPct;
  if (bw > 0) {
    roundedRect(ctx, padX + 2, y + 2, bw, 54, 8);
    ctx.fillStyle = hexAlpha("#22c55e", 0.18);
    ctx.fill();
  }
  // Sell side
  const sw = (barW - 4) * (1 - buyPct);
  if (sw > 0) {
    roundedRect(ctx, padX + 2 + bw, y + 2, sw, 54, 8);
    ctx.fillStyle = hexAlpha("#ef4444", 0.1);
    ctx.fill();
  }
  drawText(ctx, `BUY VOL: ${buyVol}`, padX + 14, y + 35, { size: 13, weight: "700", color: "#22c55e" });
  drawText(ctx, `SELL VOL: ${sellVol}`, padX + 14, y + 53, { size: 13, weight: "700", color: "#ef4444" });
  y += 74;

  // ── Big multiplier display ──
  roundedRect(ctx, padX, y, W - padX * 2, 66, 12);
  const multGrad = ctx.createLinearGradient(padX, y, W - padX, y);
  multGrad.addColorStop(0, hexAlpha("#22c55e", 0.12));
  multGrad.addColorStop(1, hexAlpha("#22c55e", 0.04));
  ctx.fillStyle = multGrad;
  ctx.fill();
  roundedRect(ctx, padX, y, W - padX * 2, 66, 12);
  ctx.strokeStyle = hexAlpha("#22c55e", 0.2);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  drawText(ctx, `${mult.toFixed(0)}x`, padX + 20, y + 44, { size: 38, weight: "900", color: "#22c55e" });
  drawText(ctx, `VIP ${vipCount} • PUBLIC ${publicMult}`, padX + 20, y + 16, { size: 12, weight: "700", color: "#8b94a7" });

  // "STILL PRINTING!" badge
  roundedRect(ctx, W - padX - 150, y + 8, 136, 50, 10);
  ctx.fillStyle = hexAlpha("#22c55e", 0.1);
  ctx.fill();
  drawText(ctx, "STILL PRINTING!", W - padX - 140, y + 39, { size: 13, weight: "900", color: "#22c55e" });

  y += 82;

  // CA pill at bottom
  const ca = str(input, "ca", "FoePfchN3A6LeJ2jvN8uVe4No9pK7zHYhggD3Qidpump");
  roundedRect(ctx, padX, y, W - padX * 2, 32, 8);
  ctx.fillStyle = hexAlpha("#1a1c24", 0.6);
  ctx.fill();
  drawText(ctx, ca, padX + 10, y + 22, { size: 11, weight: "600", color: "#6b7280" });

  // LIVE dot
  ctx.beginPath();
  ctx.arc(W - 36, H - 14, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#22c55e";
  ctx.fill();
};

/**
 * WALLET PROOF CARD — mimics a Phantom wallet screenshot showing PnL gains.
 * Like the Alpha Circle screenshots showing $108.11 → +$44.17 / +80.08%.
 */
export const walletProofTemplate: RenderTemplate = (ctx, input, rng) => {
  const bg = "#0a0b10";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const tokenName = str(input, "tokenName", "LEGACY");
  const tokenAmount = str(input, "tokenAmount", "7,303.4434");
  const tokenUsd = str(input, "tokenUsd", "$108.66");
  const tokenGain = str(input, "tokenGain", "+$44.17");
  const tokenGainPct = str(input, "tokenGainPct", "+80.08%");
  const solAmount = str(input, "solAmount", "0.00998");
  const solUsd = str(input, "solUsd", "$1.45");
  const solGain = str(input, "solGain", "+$0.03");
  const totalValue = str(input, "totalValue", "$108.66");
  const totalGain = str(input, "totalGain", "+$44.17");
  const totalGainPct = str(input, "totalGainPct", "+80.08%");
  const server = str(input, "server", "Baldwin Calls");

  // Phantom-style header
  drawText(ctx, tokenName, 24, 40, { size: 16, weight: "800", color: "#ffffff" });
  drawText(ctx, totalValue, 24, 68, { size: 32, weight: "900", color: "#ffffff" });
  drawText(ctx, `${totalGain} ${totalGainPct}`, 24, 94, { size: 16, weight: "700", color: "#22c55e" });

  // Token rows
  let y = 120;
  const rows = [
    { name: tokenName, amount: tokenAmount, usd: tokenUsd, gain: tokenGain, gainPct: tokenGainPct },
    { name: "Solana", amount: solAmount, usd: solUsd, gain: solGain, gainPct: "" },
  ];

  for (const row of rows) {
    roundedRect(ctx, 16, y, W - 32, 68, 12);
    ctx.fillStyle = "#14161c";
    ctx.fill();
    drawText(ctx, row.name, 30, y + 26, { size: 15, weight: "700", color: "#ffffff" });
    drawText(ctx, row.amount, 30, y + 48, { size: 12, weight: "600", color: "#6b7280" });
    drawText(ctx, row.usd, W - 110, y + 26, { size: 17, weight: "800", color: "#ffffff", align: "right" });
    if (row.gainPct) {
      drawText(ctx, `${row.gain} ${row.gainPct}`, W - 110, y + 48, {
        size: 13, weight: "700", color: "#22c55e", align: "right",
      });
    }
    y += 80;
  }

  // CTA section
  y += 24;
  const quote = str(input, "quote", "Don't watch the wins happening, be the one winning.");
  drawText(ctx, quote, 24, y, { size: 16, weight: "700", color: "#d1d5db", maxWidth: W - 48 });
  drawText(ctx, `DM @goobler_123 to join VIP`, 24, y + 34, { size: 15, weight: "800", color: "#7e22ce" });

  // Footer
  roundedRect(ctx, 0, H - 36, W, 36, 0);
  ctx.fillStyle = "#111318";
  ctx.fill();
  drawText(ctx, `${server} • Verified Receipts`, 20, H - 12, { size: 12, weight: "600", color: "#6b7280" });
};

export const PROOF_TEMPLATES: Record<string, RenderTemplate> = {
  dexCard: dexCardTemplate,
  printing: printingTemplate,
  walletProof: walletProofTemplate,
};
