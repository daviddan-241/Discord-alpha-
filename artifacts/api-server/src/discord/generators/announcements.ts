import type { WebhookPayload } from "../poster";
import { renderUrl, maybeAnimatedRenderUrl } from "../poster";
import { COLORS, pick, pickN, randInt, randFloat } from "../data";
import { loadConfig, dmTarget } from "../config";

export async function announcementPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  const variants = [
    {
      title: "📢 VIP slots reopened — limited",
      tag: "VIP SLOTS",
      body:
        `We just opened **${randInt(5, 14)} new VIP seats**.\n\n` +
        `Closing again once filled. We keep VIP small on purpose so signals don't move the chart against us.\n\n` +
        `To get in: DM ${dm} → mention you saw this in **📢 apex-announcements**.`,
    },
    {
      title: "📢 Last week recap",
      tag: "WEEKLY RECAP",
      body:
        `**Top public W's:**\n` +
        `• $${pick(["MOON", "GIGA", "PEPE2", "FROG", "TURBO"])} — ${randFloat(8, 60, 1)}x\n` +
        `• $${pick(["DEGEN", "SIGMA", "KING", "WIF2", "CAT2"])} — ${randFloat(4, 25, 1)}x\n` +
        `• $${pick(["ALPHA", "OMEGA", "REKT", "WAGMI"])} — ${randFloat(2, 15, 1)}x\n\n` +
        `**VIP** ate harder. Receipts in 🏆 proof-results.\n` +
        `Want next week's W's? DM ${dm}.`,
    },
    {
      title: "📢 New caller onboarded",
      tag: "TEAM UPDATE",
      body:
        `Just added a sniper to the VIP team — solana micro-cap specialist. Hit-rate above ${randInt(62, 78)}% over the last ${randInt(60, 140)} calls.\n\n` +
        `VIP gets every entry he posts. Public sees blurred previews in 💎 vip-snipes.\n\n` +
        `Open seats today only. DM ${dm}.`,
    },
    {
      title: "📢 Server is locked down",
      tag: "ANNOUNCEMENT",
      body:
        `We trimmed inactive members today. Back under capacity.\n\n` +
        `If you got nuked but still want in — re-verify in ✅ get-verified and you'll be back.\n\n` +
        `If you want VIP, DM ${dm} now while seats are open.`,
    },
  ];
  const v = pick(variants);
  const img = await maybeAnimatedRenderUrl("announce", {
    title: v.title.replace(/^📢 /, ""),
    body: v.body.split("\n")[0] ?? "",
    server: cfg.serverName,
  });
  return {
    username: `${cfg.serverName} Announcements`,
    embeds: [
      {
        color: COLORS.vipPurple,
        title: v.title,
        description: v.body,
        image: { url: img },
        footer: { text: `${cfg.serverName} • Official` },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export async function joinVipPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  const xWins = pickN(["196x", "120x", "111x", "109x", "67x", "48x", "47x", "42x"] as const, 3);
  const img = await maybeAnimatedRenderUrl("vip", {
    handle: cfg.ownerHandle,
    server: cfg.serverName,
    wins: xWins.join(","),
  });

  const variants = [
    {
      title: "💎 Why people keep upgrading to VIP",
      desc:
        `Public chat gets the **scraps**. VIP gets the **first 10 minutes**, where the multiples actually live.\n\n` +
        `**Recent VIP wins:** ${xWins.join(" • ")}\n\n` +
        `**What you get inside:**\n` +
        `• 🎯 Early CA before public rooms\n` +
        `• 🐋 Whale wallet copy-trade list\n` +
        `• 📈 Live entries + exits in real time\n` +
        `• 🧠 Daily alpha briefing\n` +
        `• 🤝 Direct line to the caller\n\n` +
        `**How to join:**\n` +
        `1. DM ${dm}\n` +
        `2. Say "VIP from Apex"\n` +
        `3. You'll be in within minutes.`,
    },
    {
      title: "💎 Stop fading the calls. Get the early entry.",
      desc:
        `If you're tired of seeing **"called at 12k, now 1.2M"** AFTER it happened — VIP fixes that.\n\n` +
        `VIP signals drop **before** the public chart wakes up.\n\n` +
        `Real members. Real fills. Real receipts.\n\n` +
        `> DM ${dm} now. We don't keep slots open long.`,
    },
    {
      title: "💎 VIP — read this if you actually want to print",
      desc:
        `We're not a "signals group" pumping their own bags. We trade **with** you, not against you.\n\n` +
        `**Last 7 days inside VIP:**\n` +
        `• ${randInt(8, 22)} calls posted\n` +
        `• ${randInt(58, 78)}% finished green\n` +
        `• Top hit: ${pick(xWins)}\n\n` +
        `One week of VIP usually pays itself back on a single call.\n\n` +
        `Ready? DM ${dm}.`,
    },
  ];

  const v = pick(variants);
  return {
    username: `${cfg.serverName} VIP`,
    embeds: [
      {
        color: COLORS.vipPurple,
        title: v.title,
        description: v.desc,
        image: { url: img },
        footer: { text: `${cfg.serverName} • Join VIP — DM ${dm}` },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}
