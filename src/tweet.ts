import type { PostData } from './types';
import { formatIndian, formatDate, streakText, formatLakhCr } from './format';

/** Pick a short one-liner insight based on the data */
function insight(data: PostData): string {
  // Both selling
  if (data.fiiStreak < 0 && data.diiStreak < 0) {
    return 'Both FIIs and DIIs in sell mode.';
  }
  // Both buying
  if (data.fiiStreak > 0 && data.diiStreak > 0) {
    return 'Both FIIs and DIIs in buy mode — strong inflows.';
  }
  // FII buying, DII selling
  if (data.fiiStreak > 0 && data.diiStreak < 0) {
    return 'FIIs turning buyers while DIIs book profits.';
  }
  // Long FII selling streak with DII support
  if (Math.abs(data.fiiStreak) >= 10 && data.fiiStreak < 0) {
    return `FII selling streak extends to ${Math.abs(data.fiiStreak)} days.`;
  }
  // DII absorbing FII outflows
  if (data.fiiStreak < 0 && data.diiStreak > 0 && data.diiNet > 0) {
    return 'DIIs absorbing consistent FII outflows.';
  }
  return `30-day FII net: ${formatLakhCr(data.fiiNet30d)}`;
}

/**
 * Compose caption text from FII/DII data.
 * Used for Twitter (≤280 chars) and as base for Instagram captions.
 */
export function composeTweet(data: PostData): string {
  const date = formatDate(data.date);
  const fii = formatIndian(data.fiiNet);
  const dii = formatIndian(data.diiNet);
  const combined = formatIndian(data.combined);
  const fiiSk = Math.abs(data.fiiStreak);
  const diiSk = Math.abs(data.diiStreak);
  const fiiDir = data.fiiStreak >= 0 ? 'buying' : 'selling';
  const diiDir = data.diiStreak >= 0 ? 'buying' : 'selling';
  const fii30d = formatLakhCr(data.fiiNet30d);

  const lines = [
    `📊 FII/DII Data | ${date}`,
    '',
    `FIIs: ₹${fii} Cr (${fiiSk}${ordinal(fiiSk)} day ${fiiDir})`,
    `DIIs: ₹${dii} Cr (${diiSk}${ordinal(diiSk)} day ${diiDir})`,
    `Net: ₹${combined} Cr`,
    '',
    `${insight(data)} 30-day FII net: ${fii30d}`,
    '',
    'tapetide.com/fii-dii-data',
  ];

  return lines.join('\n');
}

function ordinal(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}
