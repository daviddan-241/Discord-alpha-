import type { WebhookPayload } from "../poster";
import { maybeAnimatedRenderUrl } from "../poster";
import { COLORS, pick, pickN, randInt, randFloat } from "../data";
import { loadConfig, dmTarget, pingContent, loadHistory } from "../config";
import { topByGain24h, fmtUsd } from "../marketdata";

export async function announcementPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  const variants = [
    {
      title: "📢 VIP slots just reopened — I only have a few",
      tag: "VIP SLOTS OPEN",
      body:
        `Just opened **${randInt(4, 9)} new VIP seats.** That's it.\n\n` +
        `I keep VIP intentionally small — too many members and the calls get front-run. When it fills, I close it and I don't reopen until someone leaves.\n\n` +
        `People have been DMing me for weeks asking when the next window opens. This is it.\n\n` +
        `**If you've been watching the calls hit from the outside — this is your moment.**\n\n` +
        `DM ${dm} right now and say **"VIP"**. First ${randInt(3, 6)} get in automatically. Rest go on a list.\n\n` +
        `Don't screenshot this for later. The seats don't wait.`,
    },
    {
      title: "📢 This week's results — let the numbers do the talking",
      tag: "WEEKLY RECAP",
      body:
        `**Real W's posted this week:**\n` +
        `• $${pick(["MOON", "GIGA", "PEPEX", "FROG2", "TURBO"])} — **${randFloat(9, 65, 1)}x** ✅\n` +
        `• $${pick(["DEGEN", "SIGMA", "KNGZ", "WIF2", "CAT2"])} — **${randFloat(4, 28, 1)}x** ✅\n` +
        `• $${pick(["ALPHA", "OMEGA", "REKT2", "WAGMI"])} — **${randFloat(3, 16, 1)}x** ✅\n\n` +
        `**That's free chat.** VIP got all of those entries ${randInt(15, 45)} minutes earlier, sized bigger, and trimmed on the way up before the chart topped.\n\n` +
        `Every receipt is in 🏆 proof-results. Time-stamped. Verifiable. Real.\n\n` +
        `Next week's entries start posting in VIP tomorrow. DM ${dm} to be inside them — not watching from the outside.`,
    },
    {
      title: "📢 I said I'd be straight with you — so here it is",
      tag: "REAL TALK",
      body:
        `I close VIP with zero notice when it fills. No countdown timer. No second DM.\n\n` +
        `Hit rate last **${randInt(60, 120)} calls: ${randInt(67, 82)}% green.**\n` +
        `Average multiple on green calls: **${randFloat(5, 13, 1)}x**.\n` +
        `Best call this month: **${pick(["196x", "120x", "111x", "88x", "67x"])}.**\n\n` +
        `One call like that pays for years of VIP. Most members recoup the fee in the first week alone.\n\n` +
        `If you're in here reading this and you haven't DMed me yet — you are the reason this message exists.\n\n` +
        `**DM ${dm} before the seat count hits zero.**`,
    },
    {
      title: "📢 Cleaned up the server — seats opened",
      tag: "SERVER UPDATE",
      body:
        `Just removed dead weight — inactive accounts, lurkers, people who never verified.\n\n` +
        `This server is for people who are locked in. Not for passive observers.\n\n` +
        `**VIP seats freed up from the purge.** Usually these go within hours.\n\n` +
        `If you got removed but you're still here — re-verify in ✅ get-verified and you're back.\n\n` +
        `If you want VIP: DM ${dm} **right now** while the window is actually open.`,
    },
    {
      title: "📢 Why people who DM me stop missing calls",
      tag: "VIP RESULTS",
      body:
        `I get messages every week from people saying the same thing:\n\n` +
        `_"I saw the call in free chat and it was already 3x. Why didn't I join VIP sooner?"_\n\n` +
        `The answer is simple. VIP gets:\n` +
        `→ Full CA before I post anything publicly\n` +
        `→ My exact entry price and position size\n` +
        `→ Direct access to me — I answer VIP members personally\n` +
        `→ Trim alerts so you know when I'm taking profit\n\n` +
        `By the time free chat sees a call, VIP has already been in it for 20-40 minutes.\n\n` +
        `**DM ${dm} and say "VIP". It's one message. Stop watching the calls print without you.**`,
    },
  ];
  const v = pick(variants);
  const img = await maybeAnimatedRenderUrl("announce", {
    title: v.tag, body: v.body.slice(0, 100), server: cfg.serverName,
  });
  return {
    username: cfg.ownerHandle,
    content: pingContent(cfg),
    allowed_mentions: { parse: ["everyone"] },
    embeds: [{
      color: COLORS.vipPurple,
      title: v.title,
      description: v.body,
      image: { url: img },
      footer: { text: `${cfg.serverName} • Official • DM ${dm} to get in` },
      timestamp: new Date().toISOString(),
    }],
  };
}

export async function joinVipPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  const xWins = pickN(["196x", "120x", "111x", "109x", "67x", "48x", "47x", "42x"] as const, 3);

  const variants = [
    {
      title: "💎 This is what you're actually missing every single day",
      desc:
        `I'll be direct. Free chat gets the **leftovers**. VIP gets the **signal** — the CA, the entry, the exact size I'm going in with, before the chart moves.\n\n` +
        `**Recent VIP calls:** ${xWins.join(" • ")} ✅\n\n` +
        `**What's inside VIP right now:**\n` +
        `→ 🎯 Full CA sent before I post anything in public channels\n` +
        `→ 🐋 Whale wallets I track daily — copy-tradeable directly\n` +
        `→ 📈 My live entries AND exits — zero delays\n` +
        `→ 🧠 Daily narrative — where the smart money is flowing before it goes public\n` +
        `→ 💬 Direct access to me — I respond inside VIP personally\n\n` +
        `**How to join:**\n` +
        `1. DM ${dm}\n` +
        `2. Say **"VIP"** and your timezone\n` +
        `3. You're in within the hour — no waiting list if seats are open.\n\n` +
        `**Stop reading about other people's wins. DM me now.**`,
    },
    {
      title: "💎 You've seen the calls hit. You were watching instead of in them.",
      desc:
        `Called at 12k mcap. Hit 1.2M. You saw the post after it was already **10x.**\n\n` +
        `VIP members got that at **12k.** That is the only difference between them and you.\n\n` +
        `I've been doing this consistently for ${randInt(18, 36)} months. Every call that matters — the ones that go 10x, 20x, 100x — goes to VIP first. Every single time. No exceptions.\n\n` +
        `Real entries. Real members. Real receipts in 🏆 proof-results — time-stamped and verifiable.\n\n` +
        `The gap between VIP and free chat is not a few minutes. It's the difference between being in a bag and watching a bag.\n\n` +
        `> **DM ${dm} now. Seats close without warning.**`,
    },
    {
      title: "💎 I trade WITH my members. Here's what that means.",
      desc:
        `Most signal groups dump their bags on you. I don't do that. When I post a CA in VIP, I'm already in it with my own money.\n\n` +
        `**VIP results from the last 7 days:**\n` +
        `• ${randInt(8, 22)} calls posted\n` +
        `• ${randInt(67, 81)}% finished green\n` +
        `• Top call this week: **${pick(xWins)}**\n` +
        `• Members who followed all calls: up **${randFloat(2.5, 8, 1)}x** on average\n\n` +
        `**One good call pays for months.** Most members recoup the fee in the first week.\n\n` +
        `I'm not selling you hope. Check proof-results. The track record is in there, post by post.\n\n` +
        `**Ready to stop fading? DM ${dm} right now.**`,
    },
    {
      title: "💎 The people messaging me every day understand something you don't yet",
      desc:
        `Every day I get DMs from VIP members saying the same thing:\n\n` +
        `_"That call just 8x'd. I'm up ${randFloat(3, 15, 1)}x this week alone. Why did I wait so long to join?"_\n\n` +
        `The answer is always the same — they were watching from free chat, thinking about it, waiting for the "right time."\n\n` +
        `There is no right time. There's only in or out.\n\n` +
        `**Wins VIP got this month:** ${xWins.join(" · ")}\n\n` +
        `Every one of those started with a DM to me.\n\n` +
        `**DM ${dm}. Two letters: "VIP". That's the whole process.**`,
    },
  ];

  const v = pick(variants);
  const vipImg = await maybeAnimatedRenderUrl("vip", {
    handle: dm, server: cfg.serverName, wins: xWins.join(","),
  });
  return {
    username: cfg.ownerHandle,
    content: pingContent(cfg),
    allowed_mentions: { parse: ["everyone"] },
    embeds: [{
      color: COLORS.vipPurple,
      title: v.title,
      description: v.desc,
      image: { url: vipImg },
      footer: { text: `${cfg.serverName} • DM ${dm} — Join VIP today` },
      timestamp: new Date().toISOString(),
    }],
  };
}

/**
 * End-of-day recap — fired once per day at 22:00 UTC. Summarises the last 24h
 * of posts: total VIP snipes, total free calls, biggest VIP win (extracted
 * from the snipe titles in history), and the day's top mover from DexScreener.
 */
export async function dailyRecapPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  const history = await loadHistory();
  const cutoff = Date.now() - 24 * 60 * 60_000;
  const recent = history.filter((h) => h.ts >= cutoff && h.ok);

  const vipSnipes = recent.filter((h) => h.channel === "vip_snipes" && h.message.includes("VIP SNIPE"));
  const freeCalls = recent.filter((h) => h.channel === "free_calls" && h.message.includes("CALL"));
  const proofPosts = recent.filter((h) => h.channel === "proof_results");

  // Pull a representative VIP win from snipe titles like "💎 VIP SNIPE — $BULL filled @ $6.46M mcap"
  const snipeRegex = /\$([A-Z0-9]+)\s+filled\s+@\s+\$([0-9.]+[KMB]?)\s+mcap/i;
  const snipeWins = vipSnipes
    .map((h) => h.message.match(snipeRegex))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => ({ symbol: m[1], mcap: m[2] }));
  const featuredWin = snipeWins[0];

  // Top mover from DexScreener for the bonus "today's biggest mover" line
  let topMover: Awaited<ReturnType<typeof topByGain24h>>[number] | undefined;
  try {
    const movers = await topByGain24h(1, { minLiqUsd: 25_000 });
    topMover = movers[0];
  } catch { /* ok */ }

  const dateStr = new Date().toUTCString().split(" ").slice(0, 4).join(" "); // e.g. "Wed, 30 Apr 2026"

  const lines: string[] = [];
  lines.push(`**📅 ${dateStr}** — here's everything that dropped in the last 24h:\n`);
  lines.push(`💎 **VIP snipes posted:** ${vipSnipes.length}`);
  lines.push(`🚨 **Free calls posted:** ${freeCalls.length}`);
  lines.push(`📸 **Receipts dropped:** ${proofPosts.length}`);
  lines.push("");

  if (featuredWin) {
    lines.push(`🏆 **Featured VIP fill of the day:**`);
    lines.push(`   $${featuredWin.symbol} sniped @ $${featuredWin.mcap} mcap`);
    lines.push("");
  }
  if (topMover) {
    lines.push(`🔥 **Biggest 24h mover today:**`);
    lines.push(`   $${topMover.symbol} on ${topMover.chain} — ${topMover.priceChange24h >= 0 ? "+" : ""}${topMover.priceChange24h.toFixed(0)}% • ${fmtUsd(topMover.marketCap)} mcap`);
    lines.push(`   [Open chart](${topMover.url})`);
    lines.push("");
  }

  lines.push(`👀 **Tomorrow:** more snipes, more receipts, same setup — VIP fills first, free chat sees the teaser shortly after.`);
  lines.push("");
  lines.push(`💎 **Want tomorrow's calls before they print?** DM ${dm} — say "VIP".`);

  return {
    username: cfg.ownerHandle,
    content: pingContent(cfg),
    allowed_mentions: { parse: ["everyone"] },
    embeds: [{
      color: COLORS.vipPurple,
      title: "📊 DAILY RECAP — that's a wrap",
      description: lines.join("\n"),
      footer: { text: `${cfg.serverName} • Daily recap • DM ${dm} for VIP` },
      timestamp: new Date().toISOString(),
    }],
  };
}
