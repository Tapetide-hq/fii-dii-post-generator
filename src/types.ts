import type { Container } from '@cloudflare/containers';

export interface Env {
  TAPETIDE_API_URL: string;
  ENVIRONMENT: string;
  SCREENSHOT_CONTAINER: DurableObjectNamespace<Container>;
}

/** F&O participant positioning */
export interface FaoParticipant {
  idx_fut_long: number;
  idx_fut_short: number;
  stk_fut_long: number;
  stk_fut_short: number;
  idx_call_long: number;
  idx_call_short: number;
  idx_put_long: number;
  idx_put_short: number;
  stk_call_long: number;
  stk_call_short: number;
  stk_put_long: number;
  stk_put_short: number;
  total_long: number;
  total_short: number;
}

export interface FaoDayData {
  fii: FaoParticipant | null;
  dii: FaoParticipant | null;
  pro: FaoParticipant | null;
  client: FaoParticipant | null;
}

/** Single day from /api/v1/insight/fii-dii */
export interface FiiDiiDay {
  trade_date: string;
  fii_buy: number;
  fii_sell: number;
  fii_net: number;
  dii_buy: number;
  dii_sell: number;
  dii_net: number;
  fao: FaoDayData | null;
}

export interface FiiDiiSummary {
  period_days: number;
  fii_total_net: number;
  dii_total_net: number;
  fii_streak: number;
  dii_streak: number;
  fii_net_5d: number;
  dii_net_5d: number;
  fii_net_30d: number;
  dii_net_30d: number;
  fii_1yr_cumulative: number;
  dii_1yr_cumulative: number;
}

export interface FiiDiiApiResponse {
  data: FiiDiiDay[];
  summary: FiiDiiSummary;
}

/** Data for image generation */
export interface PostData {
  date: string;
  fiiNet: number;
  diiNet: number;
  combined: number;
  fiiBuy: number;
  fiiSell: number;
  diiBuy: number;
  diiSell: number;
  fiiStreak: number;
  diiStreak: number;
  fiiNet5d: number;
  diiNet5d: number;
  fiiNet30d: number;
  diiNet30d: number;
  fiiStreakTotal: number;
  diiStreakTotal: number;
  /** FII Index Futures long % (0-100). null if no F&O data */
  fiiIdxFutLongPct: number | null;
}
