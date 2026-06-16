$(cat /home/user/discord-alpha/artifacts/api-server/src/discord/generators/announcements.ts)

// Re-export topByGain24h for the index
export { topByGain24h };

/** Placeholder daily recap post to fix build error */
export async function dailyRecapPost(): Promise<any> {
  return {
    username: "Daily Recap",
    content: "Daily market recap coming soon.",
    embeds: [],
  };
}

