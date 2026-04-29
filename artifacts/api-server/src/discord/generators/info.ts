import type { WebhookPayload } from "../poster";
import { maybeAnimatedRenderUrl } from "../poster";

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
        title: `👋 Welcome to ${cfg.serverName}`,
        description:
          `You just walked into the room where the calls happen first.\n\n` +
          `**📊 free-calls** — public picks every day.\n` +
          `**🏆 proof-results** — receipts. We post the W's.\n` +
          `**💎 join-apex-vip** — earlier signals, deeper bags, sniped fills.\n` +
          `**📡 alerts** — when it's urgent, you'll know.\n\n` +
          `Step 1 — read **📜 rules**\n` +
          `Step 2 — react in **✅ get-verified**\n` +
          `Step 3 — DM ${dm} when you're ready for VIP.\n\n` +
          `If you're here to print, you're in the right place.`,
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
        title: "📜 House Rules",
        description:
          "**1.** No shilling other groups, paid or free. Instant ban.\n" +
          "**2.** No DM scams. We will never DM you first asking for funds.\n" +
          "**3.** Be respectful. No racism, no targeted harassment.\n" +
          "**4.** No FUD on our calls. Disagree with data, not insults.\n" +
          "**5.** Calls are for educational purposes. Trade your own size.\n" +
          "**6.** No leaking VIP signals. Permanent ban + IP block.\n" +
          "**7.** Keep chat in chat. Use ⛽ gas-tracker for gas, 📊 price-bot for prices.\n" +
          "**8.** Ask once. Mods will answer when free.\n\n" +
          `Need help? DM ${dm} — never anyone else claiming to be staff.`,
        footer: { text: `${cfg.serverName} • Rules` },
      },
    ],
  };
}

export async function getVerifiedPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  return {
    username: pick(INFO_NAMES),
    embeds: [
      {
        color: COLORS.green,
        title: "✅ Get Verified — required to enter",
        description:
          `**Right now you can only see this channel.** Verify to unlock the rest of ${cfg.serverName}.\n\n` +
          "**How to verify**\n" +
          "1. Read **📜 rules** above.\n" +
          "2. React **✅** to this message.\n" +
          "3. The bot gives you the **@Verified** role automatically.\n" +
          "4. Refresh Discord — every other channel appears.\n\n" +
          "**By reacting ✅ you confirm**\n" +
          "• You read and accept the rules.\n" +
          "• You are 18+.\n" +
          "• You understand crypto trading carries risk.\n" +
          "• You will not leak VIP signals.\n\n" +
          "**What unlocks after verify**\n" +
          "📊 free-calls · 📈 live-trades · 🐋 whale-tracker · 🏆 proof-results · 📡 alerts · 💬 chat rooms · 🤖 bot-commands\n\n" +
          `**Want the early signal?** After verifying, DM ${dm} for VIP.`,
        footer: { text: "React ✅ to continue • Without it you stay locked out" },
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
        title: "📊 How To Join VIP",
        description:
          `**Step 1 — See the proof.** Skim **🏆 apex-wins** and **📈 live-trades** so you know what you're paying for.\n\n` +
          `**Step 2 — DM ${dm}.** Say *"VIP"* and your timezone. We'll send pricing + the wallet to send to.\n\n` +
          `**Step 3 — Send + screenshot the tx.** Reply to the DM with the tx hash. We assign **@VIP** in under 10 minutes.\n\n` +
          `**What you unlock**\n` +
          `• 💎 vip-snipes — the calls before everyone else\n` +
          `• 🚀 early-access — pre-launch + private rounds\n` +
          `• 🐋 whale-tracker — the wallets we follow live\n` +
          `• 🧠 alpha-lounge — narratives, plays, deep dives\n\n` +
          `One ping, lifetime access. No subscriptions, no renewals.`,
        footer: { text: `${cfg.serverName} • DM ${dm} to upgrade` },
      },
    ],
  };
}

export async function openTicketPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  return {
    username: pick(INFO_NAMES),
    embeds: [
      {
        color: COLORS.blue,
        title: "🎟️ Open A Ticket",
        description:
          `Need help with payments, VIP access, or a bug?\n\n` +
          `**1.** DM ${dm} with the word **"TICKET"** in the first line.\n` +
          `**2.** Tell us your Discord username + what's going on. Screenshots help.\n` +
          `**3.** We respond within a few hours, every day.\n\n` +
          `**Common stuff we handle here**\n` +
          `• VIP role didn't apply after payment\n` +
          `• Lost access / re-verify on a new device\n` +
          `• Payment / wallet questions\n` +
          `• Refunds (within policy)\n\n` +
          `**Don't** post payment info or seed phrases in a ticket. We'll never ask.`,
        footer: { text: `${cfg.serverName} • Support` },
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
        title: "💡 Feedback",
        description:
          `This server is built **for you**. If something's missing, slow, confusing, or just wrong — tell us.\n\n` +
          `**What we want**\n` +
          `• Channels you wish existed\n` +
          `• Calls / formats you want more of\n` +
          `• Bots, tools, or alerts that would save you time\n` +
          `• Anything that felt off in your first week\n\n` +
          `**How to submit**\n` +
          `Reply right here in this channel — one message per idea is best.\n` +
          `For private feedback, DM ${dm}.\n\n` +
          `Top suggestions get implemented. We name-drop the contributor when we ship.`,
        footer: { text: `${cfg.serverName} • Feedback` },
      },
    ],
  };
}

export async function reportScamsPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  return {
    username: pick(INFO_NAMES),
    embeds: [
      {
        color: COLORS.red,
        title: "🚨 Report Scams & Impersonators",
        description:
          `Scammers copy our staff names, avatars, and even our colors. **We will never DM you first asking for money, seed phrases, or "verification" links.**\n\n` +
          `**Red flags**\n` +
          `• "Send 0.1 ETH to claim your VIP"\n` +
          `• "Connect your wallet to verify"\n` +
          `• "Click this link to keep your role"\n` +
          `• Anyone with **0 mutual servers** claiming to be staff\n\n` +
          `**How to report**\n` +
          `**1.** Screenshot the DM (full username + #ID visible).\n` +
          `**2.** Post it in this channel **or** DM ${dm}.\n` +
          `**3.** Block the account in Discord.\n\n` +
          `We ban impersonators server-wide and warn the community. Speed matters — the faster you report, the fewer people get hit.`,
        footer: { text: `${cfg.serverName} • Stay safe` },
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
        title: "🤖 Bot Commands",
        description:
          "Use these in **🤖 bot-commands** only.",
        fields: [
          { name: "`!price <ticker>`", value: "Get live price + 24h change.", inline: true },
          { name: "`!chart <ticker>`", value: "Pull a quick chart.", inline: true },
          { name: "`!ca <ticker>`", value: "Lookup contract address.", inline: true },
          { name: "`!gas`", value: "Solana + ETH fees right now.", inline: true },
          { name: "`!whales <ticker>`", value: "Top wallet activity.", inline: true },
          { name: "`!vip`", value: `DM info for ${dm}.`, inline: true },
          { name: "`!stats`", value: "Caller hit-rate this week.", inline: true },
          { name: "`!proof`", value: "Random recent W from the pile.", inline: true },
          { name: "`!rules`", value: "Show server rules.", inline: true },
        ],
        footer: { text: "Spam = mute. Use the right room." },
      },
    ],
  };
}
