import type { WebhookPayload } from "../poster";
import { renderUrl } from "../poster";
import { COLORS } from "../data";
import { loadConfig, dmTarget } from "../config";

export async function welcomePost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  const img = await renderUrl("info", {
    tag: "WELCOME",
    title: `WELCOME TO ${cfg.serverName.toUpperCase()}`,
    subtitle: "where the calls happen first",
    server: cfg.serverName,
  });
  return {
    username: `${cfg.serverName} Bot`,
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
        image: { url: img },
        footer: { text: `${cfg.serverName} • Welcome` },
      },
    ],
  };
}

export async function rulesPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  const img = await renderUrl("info", {
    tag: "RULES",
    title: "HOUSE RULES",
    subtitle: "read these once. enforced always.",
    server: cfg.serverName,
  });
  return {
    username: `${cfg.serverName} Bot`,
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
        image: { url: img },
        footer: { text: `${cfg.serverName} • Rules` },
      },
    ],
  };
}

export async function getVerifiedPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  const img = await renderUrl("info", {
    tag: "VERIFY",
    title: "GET VERIFIED",
    subtitle: "react below to unlock the server",
    server: cfg.serverName,
  });
  return {
    username: `${cfg.serverName} Bot`,
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
        image: { url: img },
        footer: { text: "React ✅ to continue • Without it you stay locked out" },
      },
    ],
  };
}

export async function botCommandsPost(): Promise<WebhookPayload> {
  const cfg = await loadConfig();
  const dm = dmTarget(cfg);
  const img = await renderUrl("info", {
    tag: "COMMANDS",
    title: "BOT COMMANDS",
    subtitle: "use these in #bot-commands only",
    server: cfg.serverName,
  });
  return {
    username: `${cfg.serverName} Bot`,
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
        image: { url: img },
        footer: { text: "Spam = mute. Use the right room." },
      },
    ],
  };
}
