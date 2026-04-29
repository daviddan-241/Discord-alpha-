import type { WebhookPayload } from "../poster";
import { maybeAnimatedRenderUrl } from "../poster";
import { COLORS, pick, pickN, randInt, randFloat } from "../data";
import { loadConfig, dmTarget } from "../config";

export async function announcementPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  const variants = [
    {
      title: "📢 VIP slots just reopened — limited",
      tag: "VIP SLOTS",
      body:
        `I just opened **${randInt(5, 12)} new VIP seats**.\n\n` +
        `I keep VIP intentionally small. Too many members and the calls stop working — slippage, copy-trading, chart manipulation. So when it fills, it locks.\n\n` +
        `If you've been watching the calls hit from outside, this is the window.\n\n` +
        `To claim a seat: DM ${dm} and mention **apex-announcements**.`,
    },
    {
      title: "📢 This week's results — real numbers",
      tag: "WEEKLY RECAP",
      body:
        `**Top public W's this week:**\n` +
        `• $${pick(["MOON", "GIGA", "PEPE2", "FROG", "TURBO"])} — ${randFloat(8, 60, 1)}x\n` +
        `• $${pick(["DEGEN", "SIGMA", "KING", "WIF2", "CAT2"])} — ${randFloat(4, 25, 1)}x\n` +
        `• $${pick(["ALPHA", "OMEGA", "REKT", "WAGMI"])} — ${randFloat(2, 15, 1)}x\n\n` +
        `**VIP ate harder.** Those numbers are the public call results — VIP got the entry earlier, sized larger, and trimmed on the way up.\n\n` +
        `Receipts are in 🏆 proof-results. DM ${dm} if you want next week's entries.`,
    },
    {
      title: "📢 I only take a few DMs a day",
      tag: "REMINDER",
      body:
        `Just a reminder — I have a small group and I want to keep it that way.\n\n` +
        `When VIP fills up I stop taking people. No waiting list, no second chance. Next open window could be weeks.\n\n` +
        `Hit rate last ${randInt(60, 120)} calls: **${randInt(64, 80)}%** green.\n` +
        `Average multiple on green calls: **${randFloat(4, 12, 1)}x**.\n\n` +
        `DM ${dm} before the seat count drops to zero.`,
    },
    {
      title: "📢 Server cleanup done",
      tag: "ANNOUNCEMENT",
      body:
        `Just removed inactive members — only keeping people who are locked in.\n\n` +
        `If you got removed but still want in — re-verify in ✅ get-verified and you're back.\n\n` +
        `VIP seats freed up from the purge. DM ${dm} now while they're available.`,
    },
  ];
  const v = pick(variants);
  const img = await maybeAnimatedRenderUrl("announce", {
    title: v.tag, body: v.body.slice(0, 100), server: cfg.serverName,
  });
  return {
    username: cfg.ownerHandle,
    embeds: [{
      color: COLORS.vipPurple,
      title: v.title,
      description: v.body,
      image: { url: img },
      footer: { text: `${cfg.serverName} • Official • DM ${dm}` },
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
      title: "💎 What you're actually missing in VIP",
      desc:
        `Let me be direct: free chat gets the **scraps**. VIP gets the **raw signal** — the CA, the entry, the exact size I'm going in with.\n\n` +
        `**Recent VIP wins I called:** ${xWins.join(" • ")}\n\n` +
        `**What's inside:**\n` +
        `• 🎯 Full CA before I post anything in public channels\n` +
        `• 🐋 Whale wallets I track daily — you can copy-trade directly\n` +
        `• 📈 My live entries AND exits, not delayed\n` +
        `• 🧠 Daily narrative briefing — where the money is flowing\n` +
        `• 🤝 Direct message access to me — I answer inside VIP\n\n` +
        `**How to join:**\n` +
        `1. DM ${dm}\n` +
        `2. Say _"VIP from the server"_\n` +
        `3. You're in within the hour.`,
    },
    {
      title: "💎 Stop watching the calls hit without you in them",
      desc:
        `You've seen it. Called at 12k, hitting 1.2M. You saw the post **after** it was already 10x.\n\n` +
        `VIP members got that at 12k. That's the only difference.\n\n` +
        `I've been doing this for ${randInt(18, 36)} months. The calls that matter — the ones that actually move — go to VIP first, every single time.\n\n` +
        `Real members. Real fills. Real receipts in proof-results.\n\n` +
        `> DM ${dm} now. I close seats fast.`,
    },
    {
      title: "💎 I'll be honest with you",
      desc:
        `Most signal groups are running their own bags against you. I don't do that.\n\n` +
        `I trade **with** my members. When I post a CA in VIP, I'm already in it.\n\n` +
        `**Last 7 days inside VIP:**\n` +
        `• ${randInt(8, 22)} calls posted\n` +
        `• ${randInt(60, 80)}% finished green\n` +
        `• Top call: ${pick(xWins)}\n\n` +
        `One good call pays for months. Most members recoup the fee in the first week.\n\n` +
        `Ready to stop fading? DM ${dm}.`,
    },
  ];

  const v = pick(variants);
  const img = await maybeAnimatedRenderUrl("vip", {
    handle: dm, server: cfg.serverName,
    wins: xWins.join(","),
  });
  return {
    username: cfg.ownerHandle,
    embeds: [{
      color: COLORS.vipPurple,
      title: v.title,
      description: v.desc,
      image: { url: img },
      footer: { text: `${cfg.serverName} • Join VIP — DM ${dm}` },
      timestamp: new Date().toISOString(),
    }],
  };
}
