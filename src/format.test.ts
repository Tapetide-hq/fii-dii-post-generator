import { describe, it, expect } from 'vitest';
import { formatIndian, formatDate, streakText } from './format';

describe('formatIndian', () => {
  it('formats positive numbers with + prefix', () => {
    expect(formatIndian(12034)).toBe('+12,034');
  });

  it('formats negative numbers with - prefix', () => {
    expect(formatIndian(-10414)).toBe('-10,414');
  });

  it('formats large numbers with Indian grouping (2,2,3)', () => {
    expect(formatIndian(-106481)).toBe('-1,06,481');
  });

  it('formats very large numbers', () => {
    expect(formatIndian(1234567)).toBe('+12,34,567');
  });

  it('formats zero as +0', () => {
    expect(formatIndian(0)).toBe('+0');
  });

  it('formats small numbers under 1000', () => {
    expect(formatIndian(42)).toBe('+42');
    expect(formatIndian(-7)).toBe('-7');
  });

  it('rounds decimals', () => {
    expect(formatIndian(10414.7)).toBe('+10,415');
    expect(formatIndian(-10414.3)).toBe('-10,414');
  });

  it('formats exactly 1000', () => {
    expect(formatIndian(1000)).toBe('+1,000');
  });

  it('formats crore-scale numbers', () => {
    expect(formatIndian(10000000)).toBe('+1,00,00,000');
  });
});

describe('formatDate', () => {
  it('converts ISO date to display format', () => {
    expect(formatDate('2026-03-24')).toBe('24 Mar 2026');
  });

  it('handles single-digit day', () => {
    expect(formatDate('2026-01-05')).toBe('5 Jan 2026');
  });

  it('handles December', () => {
    expect(formatDate('2025-12-31')).toBe('31 Dec 2025');
  });
});

describe('streakText', () => {
  it('returns buying for positive streak', () => {
    expect(streakText(19)).toBe('19 days buying');
  });

  it('returns selling for negative streak', () => {
    expect(streakText(-17)).toBe('17 days selling');
  });

  it('returns neutral for zero', () => {
    expect(streakText(0)).toBe('neutral');
  });

  it('handles singular day', () => {
    expect(streakText(1)).toBe('1 day buying');
    expect(streakText(-1)).toBe('1 day selling');
  });
});
