import type { Container } from '@cloudflare/containers';

export interface Env {
  TAPETIDE_API_URL: string;
  ENVIRONMENT: string;
  SCREENSHOT_CONTAINER: DurableObjectNamespace<Container>;
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
