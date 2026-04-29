import type { WebhookPayload } from "../poster";

import { COLORS } from "../data";
import { loadConfig, dmTarget } from "../config";

const INFO_NAMES    = ["Server Info", "Guide", "Setup", "Welcome Desk", "Info"];
const VERIFY_NAMES  = ["Gate ✅", "Verify", "Access Control", "Entry", "Welcome Gate"];
const SUPPORT_NAMES = ["Support 🎟️", "Help Desk", "Ticket System", "Staff", "Admin Support"];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]!; }

export async function welcomePost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  return {
    username: pick(INFO_NAMES),
    embeds: [
      {
        color: COLORS.vipPurple,
        title: `👋 You just found the right server — ${cfg.serverName}`,
        description:
          `This is where the calls happen before everyone else finds them.\n\n` +
          `**📊 free-calls** — real public picks, posted daily.\n` +
          `**🏆 proof-results** — every W, receipted and time-stamped.\n` +
          `**💎 join-apex-vip** — the full signal: CA + entry + sizing before anyone else.\n` +
          `**📡 alerts** — when something is urgent, you'll know it first.\n\n` +
          `**Start here:**\n` +
          `Step 1 — Read **📜 rules** (takes 60 seconds)\n` +
          `Step 2 — React ✅ in **get-verified** to unlock all channels\n` +
          `Step 3 — Check **proof-results** and see the track record yourself\n` +
          `Step 4 — When you're ready to stop watching from the outside, DM ${dm}.\n\n` +
          `The calls in VIP are not the ones in free chat. Free chat is the preview. VIP is the product.\n\n` +
          `Welcome. Make yourself at home — but don't stay in free chat too long.`,
        footer: { text: `${cfg.serverName} • Welcome` },
      },
    ],
  };
}

export async function rulesPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  return {
    username: pick(INFO_NAMES),
    embeds: [
      {
        color: COLORS.dark,
        title: "📜 House Rules — read before anything else",
        description:
          "**1.** No shilling other groups, paid or free. Instant, permanent ban.\n" +
          "**2.** No DM scams. We will never DM you first asking for money or a wallet.\n" +
          "**3.** Be respectful. No racism. No targeted harassment. No exceptions.\n" +
          "**4.** No FUD on calls. Disagree with data, not insults.\n" +
          "**5.** All calls are for educational purposes. Manage your own risk.\n" +
          "**6.** No leaking VIP signals. Permanent ban — no appeal.\n" +
          "**7.** Keep chat clean. Gas in ⛽ gas-tracker. Prices in 📊 price-bot.\n" +
          "**8.** Ask once. Mods respond when available. Don't spam.\n\n" +
          `If you have a problem, need help, or want to report something — DM ${dm}. Never anyone else claiming to be staff.`,
        footer: { text: `${cfg.serverName} • Rules` },
      },
    ],
  };
}

export async function getVerifiedPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  return {
    username: pick(VERIFY_NAMES),
    embeds: [
      {
        color: COLORS.green,
        title: "✅ Verify here — you're locked out until you do this",
        description:
          `**You can only see this channel right now.** Everything else — the calls, the trades, the alpha — is behind verification.\n\n` +
          `**It takes 20 seconds:**\n` +
          `1. Read **📜 rules** above this message.\n` +
          `2. React ✅ to **this message**.\n` +
          `3. The bot gives you **@Verified** automatically.\n` +
          `4. Refresh Discord — every channel appears.\n\n` +
          `**By reacting ✅ you confirm:**\n` +
          `• You've read and accept the rules.\n` +
          `• You are 18+.\n` +
          `• You understand crypto trading carries real risk.\n` +
          `• You will never leak VIP signals.\n\n` +
          `**What unlocks after verify:**\n` +
          `📊 free-calls · 📈 live-trades · 🐋 whale-tracker · 🏆 proof-results · 📡 alerts · 💬 chat · 🤖 bot-commands\n\n` +
          `**Want the early signal on every call?** After verifying, DM ${dm} and say "VIP".`,
        footer: { text: "React ✅ to unlock the server — without it you're locked out forever" },
      },
    ],
  };
}

export async function howToJoinVipPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  return {
    username: pick(INFO_NAMES),
    embeds: [
      {
        color: COLORS.vipPurple,
        title: "💎 How To Join VIP — read this before you DM me",
        description:
          `**Step 1 — See the proof first.** Open 🏆 proof-results. Every W is there — time-stamped and verifiable. I don't ask you to trust me blind.\n\n` +
          `**Step 2 — DM ${dm}.** Say **"VIP"** and your timezone. I reply personally. I'll send you the details.\n\n` +
          `**Step 3 — Complete the payment.** I'll give you a wallet address. Send the fee + screenshot the tx. You get **@VIP** assigned in under 10 minutes.\n\n` +
          `**What you unlock the moment you're in:**\n` +
          `→ 💎 **vip-snipes** — the calls before I post anywhere public\n` +
          `→ 🚀 **early-access** — pre-launch tokens and private rounds\n` +
          `→ 🐋 **whale-tracker** — the wallets I copy-trade, live\n` +
          `→ 🧠 **alpha-lounge** — full narratives, plays, sizing breakdown\n` +
          `→ 💬 **Direct DM access to me** — I respond in VIP personally\n\n` +
          `**One payment. Lifetime access. No subscriptions. No renewals.**\n\n` +
          `Most members make their fee back in the first week. One good call covers it entirely.\n\n` +
          `DM ${dm} and say **"VIP"** — that's all you need to do.`,
        footer: { text: `${cfg.serverName} • DM ${dm} to join VIP today` },
      },
    ],
  };
}

export async function openTicketPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  return {
    username: pick(SUPPORT_NAMES),
    embeds: [
      {
        color: COLORS.blue,
        title: "🎟️ Need help? Open a ticket here",
        description:
          `**1.** DM ${dm} with **"TICKET"** as the first word.\n` +
          `**2.** Include your Discord username + what's going on. Screenshots help.\n` +
          `**3.** We respond within a few hours, every day of the week.\n\n` +
          `**What we handle:**\n` +
          `• VIP role didn't apply after payment\n` +
          `• Lost access or re-verifying on a new device\n` +
          `• Payment or wallet questions\n` +
          `• Refund requests (within policy)\n` +
          `• Any technical issue with the server\n\n` +
          `**Never** post payment info or seed phrases anywhere in this server. We will never ask.`,
        footer: { text: `${cfg.serverName} • Support — DM ${dm}` },
      },
    ],
  };
}

export async function feedbackPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  return {
    username: pick(INFO_NAMES),
    embeds: [
      {
        color: COLORS.gold,
        title: "💡 Feedback — this server is built for you",
        description:
          `If something is missing, slow, confusing, or just wrong — I want to know.\n\n` +
          `**What I want to hear:**\n` +
          `• Channels you wish existed\n` +
          `• Call formats you want more of\n` +
          `• Bots, tools, or alerts that would save you time\n` +
          `• Anything that felt off in your first week\n\n` +
          `**How to submit:**\n` +
          `Reply in this channel — one message per idea.\n` +
          `For private feedback, DM ${dm} directly.\n\n` +
          `Top suggestions get built. I'll name-drop you when I ship it.`,
        footer: { text: `${cfg.serverName} • Feedback` },
      },
    ],
  };
}

export async function reportScamsPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  return {
    username: pick(SUPPORT_NAMES),
    embeds: [
      {
        color: COLORS.red,
        title: "🚨 Report Scams & Impersonators — read this",
        description:
          `Scammers copy our staff names, avatars, and server colors. **We will NEVER DM you first asking for money, seed phrases, or "verification" links.**\n\n` +
          `**Classic red flags — report these immediately:**\n` +
          `• "Send 0.1 ETH to claim your VIP"\n` +
          `• "Connect your wallet to verify your account"\n` +
          `• "Click this link to keep your server role"\n` +
          `• Anyone with 0 mutual servers claiming to be staff\n` +
          `• Anyone DMing you unsolicited about money\n\n` +
          `**How to report:**\n` +
          `**1.** Screenshot the full DM (username + ID visible).\n` +
          `**2.** Post it here OR DM ${dm} directly.\n` +
          `**3.** Block and report the account in Discord.\n\n` +
          `Speed matters. The faster you report, the fewer people get hit. We ban on sight and warn the whole community.`,
        footer: { text: `${cfg.serverName} • Stay safe — real staff never DM you first` },
      },
    ],
  };
}

export async function botCommandsPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  return {
    username: pick(INFO_NAMES),
    embeds: [
      {
        color: COLORS.blue,
        title: "🤖 Bot Commands — use in bot-commands channel only",
        description:
          "Use these in **🤖 bot-commands** only. Spamming in other channels = mute.",
        fields: [
          { name: "`!price <ticker>`", value: "Live price + 24h change.", inline: true },
          { name: "`!chart <ticker>`", value: "Quick chart pull.", inline: true },
          { name: "`!ca <ticker>`", value: "Look up contract address.", inline: true },
          { name: "`!gas`", value: "Solana + ETH fees right now.", inline: true },
          { name: "`!whales <ticker>`", value: "Top wallet activity.", inline: true },
          { name: "`!vip`", value: `DM info — ${dm}.`, inline: true },
          { name: "`!stats`", value: "Caller hit-rate this week.", inline: true },
          { name: "`!proof`", value: "Random recent W from the pile.", inline: true },
          { name: "`!rules`", value: "Pull server rules.", inline: true },
        ],
        footer: { text: "Wrong channel = mute. Use the right room." },
      },
    ],
  };
}
