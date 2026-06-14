import { Router, type IRouter } from "express";
import { TEMPLATES } from "../discord/render/templates";
import { renderCard } from "../discord/render/canvas";
import { renderAnimatedGif } from "../discord/render/animate";
import {
  pickTrending,
  topByGain24h,
  fetchMajorPrices,
  fetchGas,
  solanaAvgFee,
  baseGasGwei,
  fmtUsd,
} from "../discord/marketdata";
import { loadConfig } from "../discord/config";

const router: IRouter = Router();

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
        return {
          ticker: t.symbol,
          mc: String(t.marketCap),
          liq: String(t.liquidityUsd),
          chain: t.chain,
          dex: t.dexId,
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
        return { ticker: t.symbol, x: String(x), entry: String(entry), server, handle };
      }
      case "snipe": {
        const t = await pickTrending({ minLiqUsd: 8_000, maxMcUsd: 8_000_000 });
        return { ticker: t.symbol, mc: String(t.marketCap), handle, server };
      }
      case "early": {
        const t = await pickTrending({ maxAgeMin: 60 * 24, minLiqUsd: 8_000, maxMcUsd: 5_000_000 })
          .catch(() => pickTrending({ minLiqUsd: 8_000, maxMcUsd: 8_000_000 }));
        const lead = String(12 + Math.floor(Math.random() * 43));
        return { ticker: t.symbol, lead, handle, server };
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
        return {
          ticker: t.symbol,
          action,
          wallet: `${t.address.slice(0, 4)}…${t.address.slice(-4)}`,
          size: `${sizeNum} ${unit}`,
          usd: `$${usd.toLocaleString()}`,
          tag: "Smart Money",
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
        return {
          ticker: t.symbol,
          direction,
          size: `${sizeNum} ${unit}`,
          usd: `$${usd.toLocaleString()}`,
          wallet: `${t.address.slice(0, 4)}…${t.address.slice(-4)}`,
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
        return { take, trend, server };
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
  const tpl = TEMPLATES[type];
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
  const tpl = TEMPLATES[type];
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
