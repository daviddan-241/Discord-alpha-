/**
 * Optional Discord verification bot.
 *
 * Stays dormant unless the user sets the env vars:
 *   - DISCORD_BOT_TOKEN      (Bot token from https://discord.com/developers/applications)
 *   - DISCORD_GUILD_ID       (Server ID — right-click your server icon → Copy Server ID)
 *   - DISCORD_VERIFIED_ROLE_ID (Role to grant — Server Settings → Roles → … → Copy ID)
 *   - DISCORD_VERIFY_CHANNEL_ID (The #get-verified channel ID — right-click → Copy ID)
 *
 * When all four are present the bot:
 *   1. Connects to Discord Gateway
 *   2. Listens for ✅ reactions added in the verify channel
 *   3. Grants the @Verified role to whoever reacted
 *   4. Exposes status + a "seed reaction on a message" helper to the rest of the app
 *
 * Required bot permissions: Manage Roles, Read Messages, Add Reactions.
 * Required gateway intents: Guilds, GuildMessages, GuildMessageReactions.
 * In Developer Portal → Bot → Privileged Gateway Intents — none required.
 */
import { Client, GatewayIntentBits, Partials } from "discord.js";
import { logger } from "../lib/logger";

const TARGET_EMOJI = "✅";

type BotStatus = {
  enabled: boolean;
  connected: boolean;
  username?: string;
  guildId?: string;
  verifiedRoleId?: string;
  verifyChannelId?: string;
  lastError?: string;
  grants: number;
  /** Why the bot isn't running, when not connected. */
  reason?: string;
};

const status: BotStatus = {
  enabled: false,
  connected: false,
  grants: 0,
};

let client: Client | null = null;

export function getVerifyBotStatus(): BotStatus {
  return { ...status };
}

export function startVerifyBot(): void {
  const token = process.env["DISCORD_BOT_TOKEN"];
  const guildId = process.env["DISCORD_GUILD_ID"];
  const verifiedRoleId = process.env["DISCORD_VERIFIED_ROLE_ID"];
  const verifyChannelId = process.env["DISCORD_VERIFY_CHANNEL_ID"];

  status.guildId = guildId;
  status.verifiedRoleId = verifiedRoleId;
  status.verifyChannelId = verifyChannelId;

  const missing: string[] = [];
  if (!token) missing.push("DISCORD_BOT_TOKEN");
  if (!guildId) missing.push("DISCORD_GUILD_ID");
  if (!verifiedRoleId) missing.push("DISCORD_VERIFIED_ROLE_ID");
  if (!verifyChannelId) missing.push("DISCORD_VERIFY_CHANNEL_ID");

  if (missing.length) {
    status.enabled = false;
    status.reason = `set ${missing.join(", ")} to enable role auto-assignment`;
    logger.info({ missing }, "verify-bot: disabled (env vars not set)");
    return;
  }

  status.enabled = true;

  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
    ],
    // Partials let us receive reactions on messages we haven't cached
    // (e.g. the verify message that was sent before the bot started).
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User],
  });

  client.on("ready", (c) => {
    status.connected = true;
    status.username = c.user.tag;
    status.lastError = undefined;
    logger.info({ as: c.user.tag }, "verify-bot: connected");
  });

  client.on("error", (err) => {
    status.lastError = err.message;
    logger.error({ err }, "verify-bot: client error");
  });

  client.on("messageReactionAdd", async (reaction, user) => {
    try {
      if (user.bot) return;
      if (reaction.partial) await reaction.fetch();
      if (reaction.message.partial) await reaction.message.fetch();

      // Only act in the configured verify channel
      if (reaction.message.channelId !== verifyChannelId) return;

      const emojiName = reaction.emoji.name;
      if (emojiName !== TARGET_EMOJI) return;

      const guild = reaction.message.guild;
      if (!guild) return;
      if (guild.id !== guildId) return;

      const member = await guild.members.fetch(user.id);
      if (member.roles.cache.has(verifiedRoleId!)) {
        logger.info({ user: user.tag }, "verify-bot: already verified");
        return;
      }
      await member.roles.add(verifiedRoleId!, "Verified via ✅ reaction");
      status.grants += 1;
      logger.info({ user: user.tag, roleId: verifiedRoleId }, "verify-bot: granted role");
    } catch (err) {
      status.lastError = (err as Error).message;
      logger.error({ err }, "verify-bot: failed to grant role");
    }
  });

  client.login(token).catch((err) => {
    status.connected = false;
    status.lastError = (err as Error).message;
    status.reason = `login failed: ${(err as Error).message}`;
    logger.error({ err }, "verify-bot: login failed");
  });
}

/**
 * Add a ✅ reaction to a message so users have something to tap.
 * Looks up the most recent message authored by anyone (webhook included)
 * in the verify channel whose first embed title contains "Get Verified".
 *
 * Returns the message id we reacted to, or null on failure.
 */
export async function seedVerifyReaction(): Promise<string | null> {
  if (!client || !status.connected) return null;
  const channelId = status.verifyChannelId;
  if (!channelId) return null;
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !("messages" in channel)) return null;
    const messages = await channel.messages.fetch({ limit: 25 });
    const target = messages.find((m) =>
      m.embeds.some((e) => (e.title ?? "").toLowerCase().includes("get verified")),
    );
    if (!target) return null;
    await target.react(TARGET_EMOJI);
    return target.id;
  } catch (err) {
    status.lastError = (err as Error).message;
    logger.error({ err }, "verify-bot: seed reaction failed");
    return null;
  }
}
