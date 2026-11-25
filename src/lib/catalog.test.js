import { describe, expect, it } from 'vitest';
import {
  describeRate,
  effectiveRate,
  filterCards,
  formatCap,
  formatDate,
  formatVnd,
  headlineReward,
  isConditional,
  rewardFor,
  sortCards,
} from './catalog.js';

// Test fixtures only: made-up cards that never ship as site data.
/** @type {import('./data/schema.js').Card} */
const base = {
  id: 'a',
  bank: 'bank-a',
  name: 'A',
  network: 'visa',
  tier: null,
  issuanceFee: 0,
  annualFee: 500000,
  feesFinal: true,
  feeWaiver: null,
  rewards: [],
  sharedCaps: [],
  pointValueVnd: null,
  fxFee: 2,
  interestRate: 30,
  interestFreeDays: 45,
  minIncome: 10000000,
  virtual: null,
  perks: [],
  notes: [],
  sourceUrls: ['https://bank.example.com'],
  lastVerified: '2026-11-25',
};

/**
 * @param {Partial<import('./data/schema.js').Card>} over
 * @returns {import('./data/schema.js').Card}
 */
const card = (over) => ({ ...base, ...over });

const cash = (/** @type {string} */ category, /** @type {number} */ rate) => ({
  category,
  type: 'cashback',
  rate,
  earn: null,
  capMonth: null,
});

const miles = card({
  id: 'm',
  name: 'Miles',
  rewards: [
    {
      category: 'all',
      type: 'miles',
      rate: null,
      earn: { units: 1, perVnd: 30000 },
      capMonth: null,
    },
  ],
});
const points = card({
  id: 'p',
  name: 'Points',
  pointValueVnd: 1,
  rewards: [
    {
      category: 'dining',
      type: 'points',
      rate: null,
      earn: { units: 20, perVnd: 1000 },
      capMonth: 300000,
    },
  ],
});
const flat = card({ id: 'f', name: 'Flat', rewards: [cash('all', 0.5)] });
const dining = card({
  id: 'd',
  name: 'Dining',
  annualFee: null,
  rewards: [cash('dining', 6), cash('all', 0.1)],
});

describe('formatting', () => {
  it('formats VND, free fees and unknowns', () => {
    expect(formatVnd(599000)).toBe('599.000 đ');
    expect(formatVnd(0)).toBe('Miễn phí');
    expect(formatVnd(null)).toBe('chưa rõ');
  });

  it('formats a date from its string without time zones', () => {
    expect(formatDate('2026-11-25')).toBe('25/11/2026');
  });

  it('describes points and miles as published, with caps in their own unit', () => {
    expect(describeRate(miles.rewards[0])).toBe('1 dặm / 30.000 đ');
    expect(formatCap(300000, 'points')).toBe('300.000 điểm');
    expect(formatCap(300000, 'cashback')).toBe('300.000 đ');
  });
});

describe('effectiveRate', () => {
  it('converts points only when the bank publishes their value', () => {
    expect(effectiveRate(points.rewards[0], points)).toBe(2);
    expect(effectiveRate(miles.rewards[0], miles)).toBeNull();
  });
});

describe('rewardFor', () => {
  it('uses the category reward, then the base rate, then nothing', () => {
    expect(rewardFor(dining, 'dining')?.rate).toBe(6);
    expect(rewardFor(dining, 'grocery')?.rate).toBe(0.1);
    expect(rewardFor(points, 'grocery')).toBeNull();
  });
});

describe('isConditional and headlineReward', () => {
  it('flags capped rewards and picks the highest known rate', () => {
    expect(isConditional(points, points.rewards[0])).toBe(true);
    expect(isConditional(flat, flat.rewards[0])).toBe(false);
    expect(headlineReward(dining)?.rate).toBe(6);
    expect(headlineReward(card({ rewards: [] }))).toBeNull();
  });
});

describe('filterCards', () => {
  const all = [miles, points, flat, dining];

  it('never treats an unknown annual fee as free', () => {
    const ids = filterCards(all, { maxAnnualFee: 1000000 }).map((c) => c.id);
    expect(ids).not.toContain('d');
  });

  it('filters by reward type', () => {
    expect(filterCards(all, { rewardType: 'miles' }).map((c) => c.id)).toEqual(['m']);
  });

  it('keeps cards with an unknown minimum income', () => {
    const unknown = card({ id: 'u', minIncome: null });
    const ids = filterCards([flat, unknown], { myIncome: 5000000 }).map((c) => c.id);
    expect(ids).toEqual(['u']);
  });
});

describe('sortCards', () => {
  it('ranks by category rate, earning nothing as 0 and unknown values last', () => {
    const ids = sortCards([miles, flat, points, dining], 'rate', 'dining').map((c) => c.id);
    expect(ids).toEqual(['d', 'p', 'f', 'm']);
  });

  it('puts unknown fees last when sorting cheapest first', () => {
    const ids = sortCards([dining, flat], 'annualFee').map((c) => c.id);
    expect(ids).toEqual(['f', 'd']);
  });

  it('rejects an unknown sort key', () => {
    expect(() => sortCards([flat], 'nope')).toThrow();
  });
});
