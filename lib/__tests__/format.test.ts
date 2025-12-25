import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatCompactCurrency,
  formatNumber,
  formatPercent,
  formatPercentRaw,
  formatQuantity,
  formatVolume,
  formatTimeAgo,
} from '../format';

describe('formatCurrency', () => {
  it('formats positive numbers correctly', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(1000000)).toBe('$1,000,000.00');
  });

  it('formats negative numbers correctly', () => {
    expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
  });
});

describe('formatCompactCurrency', () => {
  it('formats billions correctly', () => {
    expect(formatCompactCurrency(1500000000)).toBe('$1.50B');
  });

  it('formats millions correctly', () => {
    expect(formatCompactCurrency(2500000)).toBe('$2.50M');
  });

  it('formats thousands correctly', () => {
    expect(formatCompactCurrency(5500)).toBe('$5.50K');
  });

  it('formats small numbers as regular currency', () => {
    expect(formatCompactCurrency(500)).toBe('$500.00');
  });
});

describe('formatNumber', () => {
  it('formats numbers with default decimals', () => {
    expect(formatNumber(1234.5678)).toBe('1,234.57');
  });

  it('formats numbers with custom decimals', () => {
    expect(formatNumber(1234.5678, 4)).toBe('1,234.5678');
  });
});

describe('formatPercent', () => {
  it('formats positive percentages with plus sign', () => {
    expect(formatPercent(5.25)).toBe('+5.25%');
  });

  it('formats negative percentages', () => {
    expect(formatPercent(-3.5)).toBe('-3.50%');
  });

  it('formats zero', () => {
    expect(formatPercent(0)).toBe('+0.00%');
  });
});

describe('formatPercentRaw', () => {
  it('converts decimal to percentage', () => {
    expect(formatPercentRaw(0.25)).toBe('25.00%');
    expect(formatPercentRaw(0.628)).toBe('62.80%');
  });
});

describe('formatQuantity', () => {
  it('formats very small quantities in exponential', () => {
    expect(formatQuantity(0.00001)).toMatch(/e/);
  });

  it('formats small quantities with 6 decimals', () => {
    expect(formatQuantity(0.123456)).toBe('0.123456');
  });

  it('formats medium quantities with 4 decimals', () => {
    expect(formatQuantity(12.3456)).toBe('12.3456');
  });

  it('formats large quantities with 2 decimals', () => {
    expect(formatQuantity(1234.56)).toBe('1,234.56');
  });
});

describe('formatVolume', () => {
  it('formats trillions', () => {
    expect(formatVolume(1500000000000)).toBe('1.50T');
  });

  it('formats billions', () => {
    expect(formatVolume(2500000000)).toBe('2.50B');
  });

  it('formats millions', () => {
    expect(formatVolume(3500000)).toBe('3.50M');
  });

  it('formats thousands', () => {
    expect(formatVolume(4500)).toBe('4.50K');
  });

  it('formats small numbers', () => {
    expect(formatVolume(500)).toBe('500');
  });
});

describe('formatTimeAgo', () => {
  it('formats recent times as "Just now"', () => {
    const now = new Date();
    expect(formatTimeAgo(now)).toBe('Just now');
  });

  it('formats minutes ago', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatTimeAgo(fiveMinutesAgo)).toBe('5m ago');
  });

  it('formats hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(formatTimeAgo(twoHoursAgo)).toBe('2h ago');
  });

  it('formats days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(formatTimeAgo(threeDaysAgo)).toBe('3d ago');
  });
});
