import type { Embed, WebhookPayload } from "./poster";

/* ─── Mature 11-year crypto veteran language ───────────────────────────────── */

const VETERAN_PHRASES = [
  "been in this game since 2013",
  "seen every cycle",
  "this is how you actually make it",
  "real ones know",
  "this is the edge",
  "been calling these since before most of you were trading",
  "this is why position sizing matters",
  "most people fomo at the top",
  "the ones who wait win",
  "this is what conviction looks like",
  "you either get it or you don't",
  "this is how the game actually works",
  "been through 3 bear markets",
  "this is why I size properly",
  "the market doesn't care about your feelings",
  "patience is the only real edge",
];

const VETERAN_OPENERS = [
  "real talk — ",
  "listen, ",
  "here's the thing — ",
  "been saying this for years — ",
  "most won't understand this but — ",
  "this is exactly why — ",
  "the ones who get it already know — ",
  "this is how you actually win — ",
];

const VETERAN_CLOSERS = [
  "that's how this works.",
  "been doing this long enough to know.",
  "this is why the patient ones win.",
  "real ones already loaded.",
  "most will miss it.",
  "this is the game.",
];

/* ─── ChatGPT-isms to strip ─────────────────────────────────────── */

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

/* ─── Mature text pools ─────────────────────────────────────────────────────── */

const MATURE_LINES = [
  "Been in this game since 2013. This is how you actually make it.",
  "Seen every cycle. The ones who wait win.",
  "This is exactly why position sizing matters.",
  "Most people fomo at the top. Real ones already loaded.",
  "Been calling these since before most of you were trading.",
  "This is what conviction looks like.",
  "You either get it or you don't.",
  "This is how the game actually works.",
  "Been through 3 bear markets. This is why I size properly.",
  "The market doesn't care about your feelings.",
  "Patience is the only real edge left.",
  "This is why the patient ones win.",
];

export function humanizeEmbed(embed: Embed): Embed {
  if (!embed.description) return embed;

  let text = embed.description;

  // Remove AI phrases
  for (const regex of AI_PHRASES) {
    text = text.replace(regex, "");
  }

  // Apply replacements
  for (const [phrase, replacement] of Object.entries(AI_REPLACEMENTS)) {
    const regex = new RegExp(phrase, "gi");
    text = text.replace(regex, replacement);
  }

  // Add veteran tone randomly
  if (Math.random() < 0.4) {
    const opener = VETERAN_OPENERS[Math.floor(Math.random() * VETERAN_OPENERS.length)];
    text = opener + text;
  }

  if (Math.random() < 0.3) {
    const closer = VETERAN_CLOSERS[Math.floor(Math.random() * VETERAN_CLOSERS.length)];
    text = text + " " + closer;
  }

  embed.description = text.trim();
  return embed;
}

export async function humanDelay(ms = 800): Promise<void> {
  const delay = ms + Math.random() * 1200;
  return new Promise(resolve => setTimeout(resolve, delay));
}

export function addMatureTone(text: string): string {
  if (Math.random() < 0.35) {
    const line = MATURE_LINES[Math.floor(Math.random() * MATURE_LINES.length)];
    return text + "\n\n" + line;
  }
  return text;
}
