/**
 * Live market data for the auto-poster.
 *
 * Pulls real on-chain token data from DexScreener (free, no key) and
 * major-coin spot prices from CoinGecko (free, no key) and ETH gas from
 * ethgas.watch (free, no key). All responses are cached with short TTLs to
 * stay well under the public rate limits.
 *
 * The generators import from here so calls have real CAs, real chains,
 * real mcap / liq / volume, and real 24h moves — instead of synthetic data.
 */
import { logger } from "../lib/logger";

export type RealToken = {
  address: string;
  symbol: string;
  name: string;
  /** Human-readable chain ("Solana", "Ethereum", "Base"…) */
  chain: string;
  /** DexScreener chain id ("solana", "ethereum", "base"…) */
  chainId: string;
  priceUsd: number;
  marketCap: number;
  fdv: number;
  liquidityUsd: number;
  volume24h: number;
  priceChange1h: number;
  priceChange24h: number;
  pairAddress: string;
  dexId: string;
  pairCreatedAt: number;
  ageMin: number;
  /** DexScreener pair URL — clickable in the Discord embed. */
  url: string;
  imageUrl?: string;
  /** Was this token in the boosted (paid promo) trending list? */
  boosted: boolean;
};

export type MajorPrice = {
  id: string;
  symbol: string;
  usd: number;
  change24h: number;
};

export type GasInfo = {
  fast: number;
  standard: number;
  slow: number;
};

const CHAIN_HUMAN: Record<string, string> = {
  solana: "Solana",
  ethereum: "Ethereum",
  base: "Base",
  bsc: "BSC",
  arbitrum: "Arbitrum",
  polygon: "Polygon",
  avalanche: "Avalanche",
  blast: "Blast",
  sui: "Sui",
  ton: "TON",
  tron: "Tron",
  pulsechain: "PulseChain",
  cronos: "Cronos",
  mantle: "Mantle",
  scroll: "Scroll",
  linea: "Linea",
  zksync: "zkSync",
  optimism: "Optimism",
  fantom: "Fantom",
  abstract: "Abstract",
  hyperliquid: "Hyperliquid",
  monad: "Monad",
  berachain: "Berachain",
  unichain: "Unichain",
  sonic: "Sonic",
  cardano: "Cardano",
};

function chainHuman(chainId: string): string {
  return CHAIN_HUMAN[chainId.toLowerCase()] ?? chainId.charAt(0).toUpperCase() + chainId.slice(1);
}

const TRENDING_TTL_MS = 3 * 60 * 1000;
const PRICE_TTL_MS = 60 * 1000;
const GAS_TTL_MS = 60 * 1000;

let trendingCache: { ts: number; tokens: RealToken[] } | null = null;
let pricesCache: { ts: number; data: Record<string, MajorPrice> } | null = null;
let gasCache: { ts: number; data: GasInfo } | null = null;

const COIN_GECKO_IDS: ReadonlyArray<readonly [id: string, symbol: string]> = [
  ["bitcoin", "BTC"],
  ["ethereum", "ETH"],
  ["solana", "SOL"],
  ["binancecoin", "BNB"],
  ["dogecoin", "DOGE"],
  ["ripple", "XRP"],
];

async function fetchJson<T>(url: string, timeoutMs = 8000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { accept: "application/json", "user-agent": "baldwin-calls-bot/1.0" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

type DsBoost = { tokenAddress: string; chainId: string; url?: string };

type DsPair = {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken?: { address: string; name?: string; symbol?: string };
  priceUsd?: string;
  liquidity?: { usd?: number };
  volume?: { h24?: number; h6?: number; h1?: number };
  priceChange?: { h24?: number; h6?: number; h1?: number };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  info?: { imageUrl?: string };
};

export async function fetchTrending(): Promise<RealToken[]> {
  if (trendingCache && Date.now() - trendingCache.ts < TRENDING_TTL_MS) {
    return trendingCache.tokens;
  }
  try {
    const boosts = await fetchJson<DsBoost[]>("https://api.dexscreener.com/token-boosts/top/v1");
    const slice = boosts.slice(0, 25);
    const results: RealToken[] = [];
    await Promise.all(
      slice.map(async (b) => {
        try {
          const pairs = await fetchJson<DsPair[]>(
            `https://api.dexscreener.com/tokens/v1/${b.chainId}/${b.tokenAddress}`,
          );
          if (!Array.isArray(pairs) || pairs.length === 0) return;
          const ranked = [...pairs]
            .filter((p) => p && p.liquidity && (p.liquidity.usd ?? 0) > 5000 && p.baseToken?.symbol)
            .sort((a, b2) => (b2.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0));
          const pair = ranked[0];
          if (!pair) return;
          const ageMin = pair.pairCreatedAt
            ? Math.max(1, Math.round((Date.now() - pair.pairCreatedAt) / 60000))
            : 0;
          results.push({
            address: pair.baseToken?.address ?? b.tokenAddress,
            symbol: (pair.baseToken?.symbol ?? "").toUpperCase().replace(/\s+/g, ""),
            name: pair.baseToken?.name ?? pair.baseToken?.symbol ?? "?",
            chain: chainHuman(pair.chainId),
            chainId: pair.chainId,
            priceUsd: Number(pair.priceUsd) || 0,
            marketCap: Number(pair.marketCap ?? pair.fdv ?? 0),
            fdv: Number(pair.fdv ?? 0),
            liquidityUsd: Number(pair.liquidity?.usd ?? 0),
            volume24h: Number(pair.volume?.h24 ?? 0),
            priceChange1h: Number(pair.priceChange?.h1 ?? 0),
            priceChange24h: Number(pair.priceChange?.h24 ?? 0),
            pairAddress: pair.pairAddress,
            dexId: pair.dexId,
            pairCreatedAt: pair.pairCreatedAt ?? 0,
            ageMin,
            url: pair.url,
            imageUrl: pair.info?.imageUrl,
            boosted: true,
          });
        } catch {
          // skip — one bad pair doesn't poison the whole list
        }
      }),
    );
    if (results.length === 0) {
      if (trendingCache) {
        logger.warn("marketdata: dexscreener returned empty, serving stale cache");
        return trendingCache.tokens;
      }
      throw new Error("DexScreener returned no usable pairs");
    }
    trendingCache = { ts: Date.now(), tokens: results };
    logger.info({ count: results.length }, "marketdata: trending refreshed");
    return results;
  } catch (err) {
    if (trendingCache) {
      logger.warn({ err: (err as Error).message }, "marketdata: trending fetch failed, serving stale");
      return trendingCache.tokens;
    }
    throw err;
  }
}

export async function fetchMajorPrices(): Promise<Record<string, MajorPrice>> {
  if (pricesCache && Date.now() - pricesCache.ts < PRICE_TTL_MS) return pricesCache.data;
  const ids = COIN_GECKO_IDS.map(([id]) => id).join(",");
  try {
    const json = await fetchJson<Record<string, { usd?: number; usd_24h_change?: number }>>(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
    );
    const data: Record<string, MajorPrice> = {};
    for (const [id, sym] of COIN_GECKO_IDS) {
      const v = json[id];
      if (v && typeof v.usd === "number") {
        data[sym] = { id, symbol: sym, usd: v.usd, change24h: v.usd_24h_change ?? 0 };
      }
    }
    if (Object.keys(data).length === 0) throw new Error("CoinGecko returned no usable prices");
    pricesCache = { ts: Date.now(), data };
    return data;
  } catch (err) {
    if (pricesCache) {
      logger.warn({ err: (err as Error).message }, "marketdata: prices fetch failed, serving stale");
      return pricesCache.data;
    }
    throw err;
  }
}

const ETH_RPCS = [
  "https://ethereum-rpc.publicnode.com",
  "https://eth.drpc.org",
  "https://1rpc.io/eth",
  "https://eth.public-rpc.com",
  "https://eth.llamarpc.com",
  "https://cloudflare-eth.com",
];

async function ethRpc(method: string, params: unknown[] = []): Promise<unknown> {
  let lastErr: Error | null = null;
  for (const rpc of ETH_RPCS) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(rpc, {
        method: "POST",
        signal: ctrl.signal,
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status} on ${rpc}`);
      const json = (await res.json()) as { result?: unknown; error?: { message?: string } };
      if (json.error) throw new Error(`${method} error: ${json.error.message}`);
      if (json.result === undefined) throw new Error(`${method} returned no result`);
      return json.result;
    } catch (err) {
      lastErr = err as Error;
    }
  }
  throw lastErr ?? new Error(`All ETH RPCs failed for ${method}`);
}

export async function fetchGas(): Promise<GasInfo> {
  if (gasCache && Date.now() - gasCache.ts < GAS_TTL_MS) return gasCache.data;
  try {
    // Pull live gas price from a public Ethereum RPC (no auth).
    const result = await ethRpc("eth_gasPrice", []);
    const wei = BigInt(String(result));
    const gweiF = Number(wei) / 1e9;
    const gwei = Math.max(1, Math.round(gweiF));
    const data: GasInfo = {
      slow: Math.max(1, Math.round(gwei * 0.85)),
      standard: gwei,
      fast: Math.max(gwei + 1, Math.round(gwei * 1.25)),
    };
    gasCache = { ts: Date.now(), data };
    return data;
  } catch (err) {
    if (gasCache) {
      logger.warn({ err: (err as Error).message }, "marketdata: gas fetch failed, serving stale");
      return gasCache.data;
    }
    throw err;
  }
}

/** Solana per-tx avg fee in SOL (base 5000 lamports + small priority fee). */
export function solanaAvgFee(): number {
  return 0.000005 + Math.random() * 0.00003;
}

/** Approximate Base L2 gas (gwei) — derived from ETH L1 with a tiny multiplier. */
export async function baseGasGwei(): Promise<number> {
  try {
    const eth = await fetchGas();
    // Base txs cost a tiny fraction of L1 — ~0.5%–2% of standard ETH gwei.
    const factor = 0.005 + Math.random() * 0.015;
    return Number(Math.max(0.005, eth.standard * factor).toFixed(3));
  } catch {
    return Number((0.01 + Math.random() * 0.4).toFixed(3));
  }
}

export type TokenFilter = {
  maxAgeMin?: number;
  minLiqUsd?: number;
  minMcUsd?: number;
  maxMcUsd?: number;
  chain?: string;
  excludeChains?: string[];
};

function applyFilter(list: RealToken[], opts?: TokenFilter): RealToken[] {
  if (!opts) return list;
  let out = list;
  if (opts.maxAgeMin !== undefined) out = out.filter((t) => t.ageMin > 0 && t.ageMin <= opts.maxAgeMin!);
  if (opts.minLiqUsd !== undefined) out = out.filter((t) => t.liquidityUsd >= opts.minLiqUsd!);
  if (opts.minMcUsd !== undefined) out = out.filter((t) => t.marketCap >= opts.minMcUsd!);
  if (opts.maxMcUsd !== undefined) out = out.filter((t) => t.marketCap > 0 && t.marketCap <= opts.maxMcUsd!);
  if (opts.chain) out = out.filter((t) => t.chain === opts.chain);
  if (opts.excludeChains) out = out.filter((t) => !opts.excludeChains!.includes(t.chain));
  return out;
}

export async function pickTrending(opts?: TokenFilter): Promise<RealToken> {
  const list = await fetchTrending();
  const filtered = applyFilter(list, opts);
  const pool = filtered.length ? filtered : list;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

export async function topByVolume(n: number, opts?: TokenFilter): Promise<RealToken[]> {
  const list = await fetchTrending();
  const filtered = applyFilter(list, opts);
  return [...filtered].sort((a, b) => b.volume24h - a.volume24h).slice(0, n);
}

export async function topByGain24h(n: number, opts?: TokenFilter): Promise<RealToken[]> {
  const list = await fetchTrending();
  const filtered = applyFilter(list, opts);
  return [...filtered]
    .filter((t) => Number.isFinite(t.priceChange24h))
    .sort((a, b) => b.priceChange24h - a.priceChange24h)
    .slice(0, n);
}

export async function topByGain1h(n: number, opts?: TokenFilter): Promise<RealToken[]> {
  const list = await fetchTrending();
  const filtered = applyFilter(list, opts);
  return [...filtered]
    .filter((t) => Number.isFinite(t.priceChange1h))
    .sort((a, b) => b.priceChange1h - a.priceChange1h)
    .slice(0, n);
}

/** Mask a contract address for VIP-style "blurred CA" posts. */
export function maskAddr(addr: string): string {
  if (!addr || addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}${"•".repeat(Math.min(28, addr.length - 8))}${addr.slice(-4)}`;
}

/** Short address for whale/wallet display. */
export function shortAddr(addr: string): string {
  if (!addr || addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

/** Human-format dollar amount with K/M/B suffixes. */
export function fmtUsd(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toExponential(2)}`;
}

/** Format a percent change with arrow + color emoji. */
export function fmtChange(pct: number): string {
  if (!Number.isFinite(pct)) return "—";
  const sign = pct >= 0 ? "+" : "";
  const emoji = pct >= 0 ? "🟢" : "🔴";
  return `${emoji} ${sign}${pct.toFixed(2)}%`;
}

export function explorerUrl(t: Pick<RealToken, "chain" | "chainId" | "address">): string {
  const a = t.address;
  switch (t.chainId.toLowerCase()) {
    case "solana": return `https://solscan.io/token/${a}`;
    case "ethereum": return `https://etherscan.io/token/${a}`;
    case "base": return `https://basescan.org/token/${a}`;
    case "bsc": return `https://bscscan.com/token/${a}`;
    case "arbitrum": return `https://arbiscan.io/token/${a}`;
    case "polygon": return `https://polygonscan.com/token/${a}`;
    case "avalanche": return `https://snowtrace.io/token/${a}`;
    case "blast": return `https://blastscan.io/token/${a}`;
    case "optimism": return `https://optimistic.etherscan.io/token/${a}`;
    default: return `https://dexscreener.com/${t.chainId}/${a}`;
  }
}
