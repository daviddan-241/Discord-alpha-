import type { ChannelKey } from "../config";
import type { WebhookPayload } from "../poster";
import { welcomePost, rulesPost, getVerifiedPost, botCommandsPost } from "./info";
import { freeCallPost, proofResultsPost, vipSnipePost, earlyAccessPost, liveTradePost } from "./calls";
import { announcementPost, joinVipPost } from "./announcements";
import { generalChatPost, marketChatPost, trendingCoinsPost } from "./chat";
import { whaleTrackerPost, priceBotPost, gasTrackerPost, alertsPost } from "./trackers";
import { alphaLoungePost } from "./alpha";

export type Generator = () => Promise<WebhookPayload>;

export const GENERATORS: Record<ChannelKey, Generator> = {
  welcome: welcomePost,
  rules: rulesPost,
  get_verified: getVerifiedPost,
  bot_commands: botCommandsPost,
  announcements: announcementPost,
  join_vip: joinVipPost,
  free_calls: freeCallPost,
  proof_results: proofResultsPost,
  vip_snipes: vipSnipePost,
  early_access: earlyAccessPost,
  live_trades: liveTradePost,
  general_chat: generalChatPost,
  market_chat: marketChatPost,
  trending_coins: trendingCoinsPost,
  whale_tracker: whaleTrackerPost,
  price_bot: priceBotPost,
  gas_tracker: gasTrackerPost,
  alerts: alertsPost,
  alpha_lounge: alphaLoungePost,
};
