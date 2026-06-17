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


export async function announcementPost(): Promise<any> {
  return {
    username: "Announcement",
    content: "New announcement coming soon.",
    embeds: [],
  };
}

export async function joinVipPost(): Promise<any> {
  return {
    username: "Join VIP",
    content: "Join our VIP for exclusive alpha.",
    embeds: [],
  };
}
