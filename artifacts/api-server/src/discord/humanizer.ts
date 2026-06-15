import type { Embed, WebhookPayload } from "./poster";

/* ─── ChatGPT-isms to strip or replace ─────────────────────────────────────── */

const AI_PHRASES = [
  /\b(in conclusion|to sum up|in summary|bottom line|the takeaway)\b/gi,
  /\b(delve(d?|ing)|tapestry|testament|buckle up|fasten your seatbelt)\b/gi,
  /\b(it('s| is) important to note|it('s| is) worth noting)\b/gi,
  /\b(navigate|navigate the (complex|ever-)?changing|landscape|realm)\b/gi,
  /\b(a testament to|a true testament)\b/gi,
  /\b(twist of fate|buckle up|hold on to your|rollercoaster)\b/gi,
  /\b(ready to dive in|let('s| us) dive in|let's get started|without further ado)\b/gi,
  /\b(look no further|here('s| is) the deal|here('s| is) a quick)\b/gi,
  /\b(feel free to|don('t|'t)? hesitate to|reach out|ping me|hit me up)\b/gi,
  /\b(moreover|furthermore|additionally|consequently|thus|therefore|indeed|undoubtedly)\b/gi,
  /\b(it is crucial|it is essential|it is vital|one must consider)\b/gi,
  /\b(in today('s| 's)? (fast-paced|digital|modern|ever-evolving|dynamic))\b/gi,
  /\b(game-changer|game changer|paradigm shift|cutting-edge|state-of-the-art)\b/gi,
  /\b(buckle up (for|because|as)|strap in|hold on)\b/gi,
];

const AI_REPLACEMENTS: Record<string, string> = {
  "in conclusion": "so yeah",
  "to sum up": "tl;dr",
  "in summary": "basically",
  "bottom line": "real talk",
  "the takeaway": "main point",
  "delve": "dig into",
  "delved": "dug into",
  "delving": "digging into",
  "tapestry": "mix",
  "testament": "proof",
  "buckle up": "get ready",
  "it's important to note": "note",
  "it is important to note": "note",
  "it's worth noting": "fyi",
  "it is worth noting": "fyi",
  "navigate": "deal with",
  "landscape": "space",
  "realm": "world",
  "a testament to": "shows",
  "twist of fate": "crazy thing",
  "rollercoaster": "wild ride",
  "ready to dive in": "let's go",
  "let's dive in": "let's go",
  "let us dive in": "let's get into it",
  "let's get started": "let's go",
  "without further ado": "anyway",
  "look no further": "this is it",
  "here's the deal": "so here's the thing",
  "here is the deal": "so here's the thing",
  "here's a quick": "here's a",
  "feel free to": "you can",
  "don't hesitate to": "just",
  "do not hesitate to": "just",
  "reach out": "hit up",
  "moreover": "also",
  "furthermore": "plus",
  "additionally": "also",
  "consequently": "so",
  "thus": "so",
  "therefore": "that's why",
  "indeed": "fr",
  "undoubtedly": "definitely",
  "it is crucial": "key thing",
  "it is essential": "key thing",
  "it is vital": "key thing",
  "one must consider": "gotta think about",
  "in today's fast-paced": "these days",
  "in today's digital": "nowadays",
  "in today's modern": "now",
  "in today's ever-evolving": "these days",
  "in today's dynamic": "right now",
  "game-changer": "big deal",
  "game changer": "big deal",
  "paradigm shift": "shift",
  "cutting-edge": "solid",
  "state-of-the-art": "top-tier",
  "strap in": "get ready",
  "hold on": "wait",
};

/* ─── Slang pool ───────────────────────────────────────────────────────────── */

const SLANG_OPENERS = [
  "ngl, ",
  "tbh, ",
  "fr ",
  "lfg ",
  "lowkey ",
  "honestly ",
  "imo ",
  "not gonna lie, ",
  "real talk ",
  "yea ",
  "nah ",
  "so like, ",
  "just saying but ",
  "ok so ",
];

const MID_SLANG = [" ngl", " fr", " tbh", " lowkey", " honestly", " nvm", " dw", " ik", " smh", " rn"];

/* ─── Typo generator ───────────────────────────────────────────────────────── */

const TYPO_CHANCE = 0.12; // 12% chance of a light typo per eligible word

function randomTypo(word: string): string {
  if (word.length <= 2) return word;
  // 50% chance: double a random letter
  if (Math.random() < 0.5) {
    const idx = Math.floor(Math.random() * word.length);
    return word.slice(0, idx) + word[idx] + word.slice(idx);
  }
  // Swap two adjacent letters
  const idx = Math.floor(Math.random() * (word.length - 1));
  return word.slice(0, idx) + word[idx + 1] + word[idx] + word.slice(idx + 2);
}

/* ─── Human delay ──────────────────────────────────────────────────────────── */

/**
 * Random delay between 50ms and 2400ms — simulates a human "typing" pause
 * before sending. Use before outbound posts.
 */
export function humanDelay(): Promise<void> {
  const ms = 50 + Math.floor(Math.random() * 2350);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ─── Human timestamp ──────────────────────────────────────────────────────── */

/**
 * Returns an ISO timestamp jittered by ±60 seconds so posts don't look
 * bot-scheduled (Discord would still sort them correctly).
 */
export function humanTimestamp(base?: string): string {
  const jitter = Math.floor(Math.random() * 120_000) - 60_000; // ±60s in ms
  const d = base ? new Date(base) : new Date(Date.now() + jitter);
  return d.toISOString();
}

/* ─── Core humanizer ───────────────────────────────────────────────────────── */

function stripAIPhrases(text: string): string {
  let result = text;
  for (const pattern of AI_PHRASES) {
    result = result.replace(pattern, (match) => {
      const replacement = AI_REPLACEMENTS[match.toLowerCase()] || match.toLowerCase();
      // Preserve original capitalization pattern
      if (match[0] === match[0].toUpperCase()) {
        return replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }
      return replacement;
    });
  }
  return result;
}

function addSlang(text: string): string {
  // 30% chance: prepend a slang opener
  if (Math.random() < 0.30 && text.length > 20) {
    const opener = SLANG_OPENERS[Math.floor(Math.random() * SLANG_OPENERS.length)];
    // Random lowercase start: 50% chance to lowercase the first letter
    if (Math.random() < 0.5) {
      text = text.charAt(0).toLowerCase() + text.slice(1);
    }
    text = opener + text;
  }
  return text;
}

function addMidSlang(text: string): string {
  // 20% chance: insert a mid-message slang at a sentence boundary
  if (Math.random() < 0.20) {
    const slang = MID_SLANG[Math.floor(Math.random() * MID_SLANG.length)];
    // Insert before the last sentence or at a period
    const lastPeriod = text.lastIndexOf(".");
    if (lastPeriod > text.length * 0.4) {
      text = text.slice(0, lastPeriod + 1) + slang + text.slice(lastPeriod + 1);
    } else {
      text = text + slang;
    }
  }
  return text;
}

function addTypos(text: string): string {
  const words = text.split(/(\s+)/); // preserve whitespace
  return words
    .map((w) => {
      // Only typo alphabetic words > 3 chars
      if (w.length <= 3 || !/^[a-zA-Z]+$/.test(w)) return w;
      if (Math.random() < TYPO_CHANCE) {
        return randomTypo(w);
      }
      return w;
    })
    .join("");
}

function humanizeText(text: string): string {
  if (!text || text.length < 10) return text;
  let result = stripAIPhrases(text);
  result = addSlang(result);
  result = addMidSlang(result);
  result = addTypos(result);
  return result;
}

/* ─── Embed humanizer ──────────────────────────────────────────────────────── */

/**
 * Run an entire WebhookPayload through the humanizer. Returns a new payload
 * so the caller can safely pass it to both Discord and Telegram.
 */
export function humanizeEmbed(payload: WebhookPayload): WebhookPayload {
  const result: WebhookPayload = { ...payload };

  // Humanize top-level content
  if (result.content) {
    result.content = humanizeText(result.content);
  }

  // Humanize each embed
  if (result.embeds) {
    result.embeds = result.embeds.map((embed) => {
      const e: Embed = { ...embed };
      if (e.title) e.title = humanizeText(e.title);
      if (e.description) e.description = humanizeText(e.description);
      if (e.footer) e.footer = { ...e.footer, text: humanizeText(e.footer.text) };
      if (e.author) e.author = { ...e.author, name: humanizeText(e.author.name) };
      if (e.fields) {
        e.fields = e.fields.map((f) => ({ ...f, value: humanizeText(f.value) }));
      }
      // Jitter the timestamp
      if (e.timestamp) {
        e.timestamp = humanTimestamp(e.timestamp);
      }
      return e;
    });
  }

  return result;
}
