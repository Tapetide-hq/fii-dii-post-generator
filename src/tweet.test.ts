import { describe, it, expect } from 'vitest';
import { composeTweet } from './tweet';
import type { PostData } from './types';

const mockData: PostData = {
  date: '2026-03-24',
  fiiNet: -10414,
  diiNet: 12034,
  combined: 1620,
  fiiBuy: 14200,
  fiiSell: 24614,
  diiBuy: 18500,
  diiSell: 6466,
  fiiStreak: -17,
  diiStreak: 19,
  fiiNet5d: -34215,
  diiNet5d: 30724,
  fiiNet30d: -106481,
  diiNet30d: 89200,
  fiiStreakTotal: -156200,
  diiStreakTotal: 178450,
  fiiIdxFutLongPct: 34,
};

describe('composeTweet', () => {
  it('includes date in header', () => {
    const tweet = composeTweet(mockData);
    expect(tweet).toContain('24 Mar 2026');
  });

  it('includes FII net with streak day count', () => {
    const tweet = composeTweet(mockData);
    expect(tweet).toContain('FIIs: ₹-10,414 Cr (17th day selling)');
  });

  it('includes DII net with streak day count', () => {
    const tweet = composeTweet(mockData);
    expect(tweet).toContain('DIIs: ₹+12,034 Cr (19th day buying)');
  });

  it('includes combined net', () => {
    const tweet = composeTweet(mockData);
    expect(tweet).toContain('Net: ₹+1,620 Cr');
  });

  it('includes insight about FII selling streak', () => {
    const tweet = composeTweet(mockData);
    expect(tweet).toContain('FII selling streak extends to 17 days.');
  });

  it('includes 30-day FII net in Lakh Cr format', () => {
    const tweet = composeTweet(mockData);
    expect(tweet).toContain('30-day FII net: -₹1.06 Lakh Cr');
  });

  it('includes tapetide link', () => {
    const tweet = composeTweet(mockData);
    expect(tweet).toContain('tapetide.com/fii-dii-data');
  });

  it('stays under 280 characters', () => {
    const tweet = composeTweet(mockData);
    expect(tweet.length).toBeLessThanOrEqual(280);
  });

  it('handles all-positive data (both buying)', () => {
    const positiveData: PostData = {
      ...mockData,
      fiiNet: 5000,
      diiNet: 8000,
      combined: 13000,
      fiiStreak: 5,
      diiStreak: 10,
      fiiNet30d: 45000,
    };
    const tweet = composeTweet(positiveData);
    expect(tweet).toContain('FIIs: ₹+5,000 Cr (5th day buying)');
    expect(tweet).toContain('Both FIIs and DIIs in buy mode');
  });

  it('uses ordinals correctly (1st, 2nd, 3rd)', () => {
    const d1: PostData = { ...mockData, fiiStreak: -1, diiStreak: 2 };
    const t1 = composeTweet(d1);
    expect(t1).toContain('1st day selling');
    expect(t1).toContain('2nd day buying');

    const d3: PostData = { ...mockData, fiiStreak: -3, diiStreak: 3 };
    const t3 = composeTweet(d3);
    expect(t3).toContain('3rd day selling');
    expect(t3).toContain('3rd day buying');
  });
});
