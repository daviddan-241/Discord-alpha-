export const TOKEN_TICKERS = [
  "ASTROPEPE", "MOONFROG", "GIGACHAD", "TURBOCAT", "WIFHAT2", "BONKINU", "PUMPDOG",
  "SLERFKING", "MICHI2", "BOMEX", "POPCAT2", "MEW2", "BOOKOFCAT", "RETARDIO2",
  "CHILLGUY", "PNUT2", "MOODENG2", "GOATSEUS", "FWOG2", "ZEREBRO",
  "ALPHAGEM", "SIGMACAT", "DEGENAPE", "LFGROCKET", "MOONSHOT", "PUMPKING", "SCAMCOIN",
  "BAGSGEM", "SNIPEX", "DIAMONDP", "PAPERH", "REKTBOY", "JEETSLAYER", "WAGMIX",
  "CABALGEM", "INSIDERX", "WHALEKING", "ALPHADEN", "GIGAWHALE", "MOONLAMBO",
  "FROGGER2", "DOGGOX", "CATGIRL2", "ANIMEAI", "WAIFUC", "OTAKUKING", "KAWAIICAT",
  "PEPELORD", "WOJAKINU", "CHADCOIN", "VIRGINKILLER", "GIGAGOD", "SIGMAMAX",
  "ALPHAINU", "BETAFISH", "OMEGADOG", "RUGSURVIVOR", "FOMOKING", "FUDSLAYER",
];

export const TOKEN_NAMES: Record<string, string> = {
  ASTROPEPE: "Astro Pepe",
  MOONFROG: "Moon Frog",
  GIGACHAD: "Giga Chad",
  TURBOCAT: "Turbo Cat",
  WIFHAT2: "Dog Wif Hat 2",
  BONKINU: "Bonk Inu",
  PUMPDOG: "Pump Dog",
  SLERFKING: "Slerf King",
  MICHI2: "Michi V2",
  BOMEX: "BOME X",
  POPCAT2: "Popcat 2",
  MEW2: "MEW 2",
  BOOKOFCAT: "Book of Cat",
  RETARDIO2: "Retardio 2",
  CHILLGUY: "Chill Guy",
  PNUT2: "Peanut 2",
  MOODENG2: "Moo Deng 2",
  GOATSEUS: "Goatseus Maximus",
  FWOG2: "Fwog 2",
  ZEREBRO: "Zerebro",
};

export const CHAINS = ["Solana", "Ethereum", "Base", "BSC"];

export const DEXES = ["Pump.fun", "PumpSwap", "Raydium", "Meteora", "Uniswap", "Aerodrome", "Pancakeswap"];

export const SOL_ADDR_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789";
export const HEX_CHARS = "0123456789abcdef";

export function randomSolAddr(rng: () => number = Math.random): string {
  let out = "";
  for (let i = 0; i < 44; i++) {
    out += SOL_ADDR_CHARS[Math.floor(rng() * SOL_ADDR_CHARS.length)];
  }
  return out;
}

export function randomEthAddr(rng: () => number = Math.random): string {
  let out = "0x";
  for (let i = 0; i < 40; i++) {
    out += HEX_CHARS[Math.floor(rng() * HEX_CHARS.length)];
  }
  return out;
}

export function shortAddr(addr: string): string {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function pickN<T>(arr: readonly T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]!);
  }
  return out;
}

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randFloat(min: number, max: number, decimals = 2): number {
  const v = Math.random() * (max - min) + min;
  return Number(v.toFixed(decimals));
}

export function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export function fmtNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n.toFixed(0)}`;
}

export function timeAgo(): string {
  const r = Math.random();
  if (r < 0.25) return `${randInt(2, 59)}s ago`;
  if (r < 0.6) return `${randInt(1, 59)}m ago`;
  if (r < 0.9) return `${randInt(1, 23)}h ago`;
  return `${randInt(1, 5)}d ago`;
}

export const PROOF_IMAGES = [
  "proof_astropepe_109x.jpeg",
  "proof_asteroid_47x.png",
  "proof_chsn_196x.png",
  "proof_chsn_card.png",
  "proof_unc_222k.png",
  "proof_solana_42x.png",
  "proof_crashout_48x.png",
  "proof_stardi_111x.png",
  "proof_one_120x.png",
  "proof_unc_axiom.jpeg",
];

export const CALL_IMAGES = [
  "call_unc_play.png",
  "call_chibiland.png",
  "call_one_669pct.png",
  "call_unceroid.png",
];

export const DM_PROOF_IMAGES = [
  "dm_pitch_1.png",
  "dm_pitch_2.png",
  "dm_pitch_3.png",
  "dm_pitch_4.png",
  "dm_pitch_5.png",
];

export const COLORS = {
  green: 0x2ecc71,
  emerald: 0x10b981,
  red: 0xe74c3c,
  gold: 0xf1c40f,
  purple: 0x9b59b6,
  blue: 0x3498db,
  cyan: 0x1abc9c,
  pink: 0xff4d8b,
  orange: 0xff8a2b,
  dark: 0x111827,
  vipPurple: 0x7e22ce,
};

export const HYPE_LINES = [
  "Another one in the bag.",
  "We eat good in here.",
  "VIP printing again.",
  "Told you to load.",
  "Diamonds only.",
  "If you faded, that's on you.",
  "Easy money for the chat.",
  "We don't miss.",
  "Another sniper W.",
  "Insiders only.",
  "Locked in. Stay ready.",
  "VIP got fed first as always.",
  "Public didn't even see this one.",
  "Another VIP banger.",
  "Free chat got it. VIP got 10x earlier.",
  "Apex doesn't sleep.",
  "Caller of the year incoming.",
  "Bag secured.",
  "Tap in or stay broke.",
];

export const VIP_TEASES = [
  "VIP entry was 8x lower.",
  "VIP got the CA 14 minutes before this post.",
  "Public sees this. VIP already took profit.",
  "Want the early signal? DM the owner.",
  "Free calls = scraps. Real plays drop in VIP.",
  "VIP filled at sub-20k while you were sleeping.",
  "Imagine if you had the alert at 8k mc.",
  "Stop watching, start eating. VIP open.",
];
