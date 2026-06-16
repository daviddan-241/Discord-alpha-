import { Router, type IRouter } from "express";
import { TEMPLATES } from "../discord/render/templates";
import { PROOF_TEMPLATES } from "../discord/render/proofs";
import { renderCard } from "../discord/render/canvas";
import { renderAnimatedGif } from "../discord/render/animate";
import {
  pickTrending,
  topByGain24h,
  fetchMajorPrices,
  fetchGas,
  fetchOhlcv,
  solanaAvgFee,
  baseGasGwei,
  fmtUsd,
} from "../discord/marketdata";
import { loadConfig } from "../discord/config";

const router: IRouter = Router();
const ALL_TEMPLATES: Record<string, typeof TEMPLATES[string]> = { ...TEMPLATES, ...PROOF_TEMPLATES };

function pickInput(query: Record<string, unknown>): Record<string, string | undefined> {
  const input: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(query)) {
    if (typeof v === "string") input[k] = v;
    else if (Array.isArray(v) && typeof v[0] === "string") input[k] = v[0];
  }
  return input;
}

/**
 * Build a live RenderInput for each template type by fetching real market data.
 * Called when ?live=1 is set on the render endpoint.
 */
async function buildLiveInput(type: string): Promise<Record<string, string | undefined>> {
  const cfg = await loadConfig();
  const server = cfg.serverName || "Baldwin Calls";
  const handle = cfg.ownerHandle || "@apex";

  try {
    switch (type) {
      // --- Token call / snipe / proof / early ---
      case "call": {
        const t = await pickTrending({ minLiqUsd: 15_000, maxMcUsd: 50_000_000 });
        let ohlcv = "";
        try {
          const pts = await fetchOhlcv(t.chainId, t.pairAddress);
          if (pts.length > 0) ohlcv = JSON.stringify(pts);
        } catch { /* silently skip — chart will fall back to sparkline */ }
        return {
          ticker: t.symbol,
          mc: String(t.marketCap),
          liq: String(t.liquidityUsd),
          chain: t.chain,
          dex: t.dexId,
          ohlcv,
          server,
        };
      }
      case "proof": {
        const winners = await topByGain24h(5, { minLiqUsd: 10_000 });
        const t = winners[Math.floor(Math.random() * Math.min(winners.length, 5))]
          ?? (await pickTrending());
        const pct = Math.max(40, t.priceChange24h);
        const x = Number((1 + pct / 100).toFixed(1));
        const entry = Math.max(8_000, Math.round(t.marketCap / x));
        let ohlcv = "";
        try { const pts = await fetchOhlcv(t.chainId, t.pairAddress); if (pts.length > 0) ohlcv = JSON.stringify(pts); } catch { /* skip */ }
        return { ticker: t.symbol, x: String(x), entry: String(entry), server, handle, ohlcv };
      }
      case "snipe": {
        const t = await pickTrending({ minLiqUsd: 8_000, maxMcUsd: 8_000_000 });
        let ohlcv = "";
        try { const pts = await fetchOhlcv(t.chainId, t.pairAddress); if (pts.length > 0) ohlcv = JSON.stringify(pts); } catch { /* skip */ }
        return { ticker: t.symbol, mc: String(t.marketCap), handle, server, ohlcv };
      }
      case "early": {
        const t = await pickTrending({ maxAgeMin: 60 * 24, minLiqUsd: 8_000, maxMcUsd: 5_000_000 })
          .catch(() => pickTrending({ minLiqUsd: 8_000, maxMcUsd: 8_000_000 }));
        const lead = String(12 + Math.floor(Math.random() * 43));
        let ohlcv = "";
        try { const pts = await fetchOhlcv(t.chainId, t.pairAddress); if (pts.length > 0) ohlcv = JSON.stringify(pts); } catch { /* skip */ }
        return { ticker: t.symbol, lead, handle, server, ohlcv };
      }
      case "whale": {
        const t = await pickTrending({ minLiqUsd: 20_000 });
        const actions = ["BOUGHT", "BOUGHT", "LOADED", "ACCUMULATED", "SOLD", "EXITED"];
        const action = actions[Math.floor(Math.random() * actions.length)]!;
        const isSol = t.chain === "Solana";
        const sizeNum = isSol
          ? (2 + Math.random() * 18).toFixed(2)
          : (0.2 + Math.random() * 4).toFixed(2);
        const unit = isSol ? "SOL" : t.chain === "Ethereum" ? "ETH" : "USD";
        const usd = Math.round(parseFloat(sizeNum) * (isSol ? 180 : t.chain === "Ethereum" ? 3200 : 1));
        let ohlcv = "";
        try { const pts = await fetchOhlcv(t.chainId, t.pairAddress); if (pts.length > 0) ohlcv = JSON.stringify(pts); } catch { /* skip */ }
        return {
          ticker: t.symbol,
          action,
          wallet: `${t.address.slice(0, 4)}…${t.address.slice(-4)}`,
          size: `${sizeNum} ${unit}`,
          usd: `$${usd.toLocaleString()}`,
          tag: "Smart Money",
          ohlcv,
          server,
        };
      }
      case "trade": {
        const t = await pickTrending({ minLiqUsd: 10_000 });
        const dirs = ["BUY", "BUY", "TRIM", "EXIT"] as const;
        const direction = dirs[Math.floor(Math.random() * dirs.length)]!;
        const isSol = t.chain === "Solana";
        const sizeNum = isSol
          ? (0.5 + Math.random() * 25).toFixed(2)
          : (500 + Math.random() * 8000).toFixed(0);
        const unit = isSol ? "SOL" : t.chain === "Ethereum" ? "ETH" : "USD";
        const usd = Math.round(parseFloat(sizeNum) * (isSol ? 180 : t.chain === "Ethereum" ? 3200 : 1));
        let ohlcv = "";
        try { const pts = await fetchOhlcv(t.chainId, t.pairAddress); if (pts.length > 0) ohlcv = JSON.stringify(pts); } catch { /* skip */ }
        return {
          ticker: t.symbol,
          direction,
          size: `${sizeNum} ${unit}`,
          usd: `$${usd.toLocaleString()}`,
          wallet: `${t.address.slice(0, 4)}…${t.address.slice(-4)}`,
          ohlcv,
          server,
        };
      }
      case "trending": {
        const tops = await topByGain24h(3, { minLiqUsd: 5_000 });
        const items = tops.map((t) => {
          const pct = t.priceChange24h;
          const sign = pct >= 0 ? "+" : "";
          return `${t.symbol}:${sign}${pct.toFixed(1)}`;
        }).join(",");
        return { items, server };
      }
      case "price": {
        const prices = await fetchMajorPrices();
        const items = Object.values(prices).map((p) => {
          const sign = p.change24h >= 0 ? "+" : "";
          const priceStr = p.usd >= 1000
            ? p.usd.toLocaleString("en", { maximumFractionDigits: 0 })
            : p.usd >= 1
            ? p.usd.toFixed(2)
            : p.usd.toFixed(4);
          return `${p.symbol}:${priceStr}:${sign}${p.change24h.toFixed(2)}`;
        }).join(",");
        return { items, server };
      }
      case "gas": {
        const gas = await fetchGas();
        const solFee = solanaAvgFee();
        const baseGwei = await baseGasGwei();
        return {
          eth: `${gas.fast} gwei`,
          base: `${baseGwei} gwei`,
          sol: `${solFee.toFixed(6)} SOL`,
          server,
        };
      }
      case "alpha": {
        const t = await pickTrending({ minLiqUsd: 10_000 });
        let ohlcv = "";
        try { const pts = await fetchOhlcv(t.chainId, t.pairAddress); if (pts.length > 0) ohlcv = JSON.stringify(pts); } catch { /* skip */ }
        const narratives = ["AI Agents", "DeFi Yield", "Meme Season", "RWA", "Gaming", "Layer 2", "Staking"];
        const narrative = narratives[Math.floor(Math.random() * narratives.length)]!;
        return { narrative, ticker: t.symbol, ohlcv, server };
      }
      case "alert": {
        const t = await pickTrending({ minLiqUsd: 10_000 });
        return {
          title: `$${t.symbol} MOVING`,
          body: `${t.chain} · ${fmtUsd(t.marketCap)} mcap · ${t.priceChange1h >= 0 ? "+" : ""}${t.priceChange1h.toFixed(1)}% (1h) · Liq ${fmtUsd(t.liquidityUsd)}`,
          server,
        };
      }
      case "market": {
        const prices = await fetchMajorPrices();
        const btc = prices["BTC"];
        const eth = prices["ETH"];
        const trend = (btc?.change24h ?? 0) >= 0 ? "up" : "down";
        const take = btc
          ? `BTC ${fmtUsd(btc.usd)} (${btc.change24h >= 0 ? "+" : ""}${btc.change24h.toFixed(2)}%) · ETH ${eth ? fmtUsd(eth.usd) : "—"} · Market is ${trend === "up" ? "risk-on" : "risk-off"}.`
          : "Market data loading…";
        let ohlcv = "";
        let chartTicker = "BTC";
        try {
          const top = await pickTrending({ minLiqUsd: 50_000 });
          const pts = await fetchOhlcv(top.chainId, top.pairAddress);
          if (pts.length > 0) { ohlcv = JSON.stringify(pts); chartTicker = top.symbol; }
        } catch { /* skip */ }
        return { take, trend, server, ohlcv, chartTicker };
      }

      // ─── Proof-style templates (DexScreener cards / wallet proofs) ──────────
      case "dexCard": {
        const t = await pickTrending({ minLiqUsd: 5_000, maxMcUsd: 50_000_000 });
        const ageStr = t.ageMin < 60
          ? `${t.ageMin} minutes`
          : t.ageMin < 1440 ? `${Math.round(t.ageMin / 60)} hours` : `${Math.round(t.ageMin / 1440)} days`;
        return {
          ticker: t.symbol, symbol: t.symbol, chain: t.chain, dex: t.dexId,
          priceUsd: String(t.priceUsd),
          priceSol: String(t.priceUsd / 180),
          mcap: String(t.marketCap), liquidity: String(t.liquidityUsd),
          volume: String(t.volume24h), age: ageStr,
          change24h: String(t.priceChange24h),
          change24hStr: `${t.priceChange24h >= 0 ? "+" : ""}${t.priceChange24h.toFixed(2)}%`,
          server,
        };
      }
      case "printing": {
        const t = await pickTrending({ minLiqUsd: 5_000 });
        const entryMc = Math.max(5_000, Math.round(t.marketCap / (1 + Math.abs(t.priceChange24h) / 100)));
        const mult = t.marketCap > 0 ? t.marketCap / entryMc : 1;
        const vipC = 500 + Math.floor(Math.random() * 2000);
        const pubM = Math.max(2, Math.floor(mult / 150));
        return {
          ticker: t.symbol, mcap: String(t.marketCap), entryMcap: String(entryMc),
          mult: String(mult), liquidity: String(t.liquidityUsd),
          fdv: String(t.fdv || t.marketCap),
          change5m: `${(Math.random() * 10 + 1).toFixed(2)}`,
          change1h: `${(Math.random() * 50 + 5).toFixed(0)}`,
          change6h: `${(Math.random() * 200 + 50).toFixed(0)}`,
          change24h: `${(Math.random() * 2000 + 100).toFixed(0)}`,
          volume: fmtUsd(t.volume24h),
          txns: `${(10_000 + Math.floor(Math.random() * 90_000)).toLocaleString()}`,
          buyers: `${(3_000 + Math.floor(Math.random() * 15_000)).toLocaleString()}`,
          sellers: `${(500 + Math.floor(Math.random() * 5_000)).toLocaleString()}`,
          buyVol: `${(50_000 + Math.floor(Math.random() * 80_000)).toLocaleString()}`,
          sellVol: `${(5_000 + Math.floor(Math.random() * 20_000)).toLocaleString()}`,
          vipCount: String(vipC), publicMult: `${pubM}x`,
          chain: t.chain, dex: t.dexId, ca: t.address, server,
        };
      }
      case "walletProof": {
        const investBase = [500, 1000, 2000, 5000][Math.floor(Math.random() * 4)];
        const mult = 1.5 + Math.random() * 8;
        const outVal = Math.round(investBase * mult);
        const gain = outVal - investBase;
        const gainPct = ((gain / investBase) * 100).toFixed(2);
        return {
          tokenName: "SOL", tokenAmount: `${(Math.random() * 10 + 0.1).toFixed(5)}`,
          tokenUsd: `$${outVal.toLocaleString()}`, tokenGain: `+$${gain.toLocaleString()}`,
          tokenGainPct: `+${gainPct}%`,
          solAmount: `${(Math.random() * 5).toFixed(5)}`, solUsd: `$${(Math.random() * 10).toFixed(2)}`,
          solGain: `+$${(Math.random() * 2).toFixed(2)}`,
          totalValue: `$${outVal.toLocaleString()}`, totalGain: `+$${gain.toLocaleString()}`,
          totalGainPct: `+${gainPct}%`, server,
        };
      }
      default:
        return { server, handle };
    }
  } catch {
    return { server, handle };
  }
}

router.get("/render/:type.png", async (req, res) => {
  const type = req.params.type;
  const tpl = ALL_TEMPLATES[type];
  if (!tpl) {
    res.status(404).type("text/plain").send("unknown template");
    return;
  }
  try {
    let input = pickInput(req.query as Record<string, unknown>);
    if (input["live"] === "1" || input["live"] === "true") {
      const liveData = await buildLiveInput(type);
      input = { ...liveData, ...input, live: undefined };
    }
    const buf = renderCard(tpl, input);
    res.setHeader("content-type", "image/png");
    res.setHeader("cache-control", "no-store");
    res.end(buf);
  } catch (err) {
    res.status(500).type("text/plain").send(`render error: ${(err as Error).message}`);
  }
});

router.get("/render/:type.gif", async (req, res) => {
  const type = req.params.type;
  const tpl = ALL_TEMPLATES[type];
  if (!tpl) {
    res.status(404).type("text/plain").send("unknown template");
    return;
  }
  try {
    let input = pickInput(req.query as Record<string, unknown>);
    if (input["live"] === "1" || input["live"] === "true") {
      const liveData = await buildLiveInput(type);
      input = { ...liveData, ...input, live: undefined };
    }
    const buf = renderAnimatedGif(type, tpl, input);
    res.setHeader("content-type", "image/gif");
    res.setHeader("cache-control", "no-store");
    res.end(buf);
  } catch (err) {
    res.status(500).type("text/plain").send(`gif render error: ${(err as Error).message}`);
  }
});

export default router;
