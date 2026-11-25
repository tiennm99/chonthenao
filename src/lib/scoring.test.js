import { describe, expect, it } from 'vitest';
import { ASSUMED_MILE_VND, rank, scoreCard } from './scoring.js';

// Test fixtures only: made-up cards that never ship as site data.
/** @type {import('./data/schema.js').Card} */
const base = {
  id: 'a',
  bank: 'bank-a',
  name: 'A',
  network: 'visa',
  tier: null,
  issuanceFee: 0,
  annualFee: 0,
  feesFinal: true,
  feeWaiver: null,
  rewards: [],
  sharedCaps: [],
  minSpendMonth: null,
  maxCategories: null,
  rewardsUntil: null,
  pointValueVnd: null,
  fxFee: 2,
  interestRate: 30,
  interestFreeDays: 45,
  minIncome: null,
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

/**
 * @param {string} category
 * @param {number} rate
 * @param {number|null} [capMonth]
 * @returns {import('./data/schema.js').Reward}
 */
const cash = (category, rate, capMonth = null) => ({
  category,
  type: 'cashback',
  rate,
  earn: null,
  capMonth,
});

const profile = (/** @type {Record<string, number>} */ spend, foreign = 0) => ({ spend, foreign });

describe('scoreCard', () => {
  it('applies a base-rate cap once across every category that falls back to it', () => {
    const c = card({ rewards: [cash('all', 1, 50000)] });
    const s = scoreCard(c, profile({ dining: 4_000_000, grocery: 4_000_000, all: 2_000_000 }));
    expect(s.rewards).toBe(50000 * 12);
  });

  it('trims rewards to a shared cap', () => {
    const c = card({
      rewards: [cash('grocery', 10), cash('dining', 10)],
      sharedCaps: [{ categories: ['grocery', 'dining'], capMonth: 300000 }],
    });
    const s = scoreCard(c, profile({ grocery: 3_000_000, dining: 3_000_000 }));
    expect(s.rewards).toBe(300000 * 12);
  });

  it('pays nothing below the minimum monthly spend', () => {
    const c = card({ rewards: [cash('online', 10)], minSpendMonth: 5_000_000 });
    const s = scoreCard(c, profile({ online: 1_000_000, all: 2_000_000 }));
    expect(s.rewards).toBe(0);
    expect(s.flags[0]).toMatch(/Chưa đạt chi tiêu tối thiểu/);
  });

  it('uses only the best N bonus categories', () => {
    const c = card({
      rewards: [cash('online', 10), cash('dining', 5), cash('all', 0)],
      maxCategories: 1,
    });
    const s = scoreCard(c, profile({ online: 1_000_000, dining: 4_000_000 }));
    expect(s.rewards).toBe(200000 * 12);
  });

  it('values miles at the assumed rate and says so', () => {
    const c = card({
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
    const s = scoreCard(c, profile({ all: 3_000_000 }));
    expect(s.rewards).toBe(100 * ASSUMED_MILE_VND * 12);
    expect(s.flags.some((f) => f.includes('giả định'))).toBe(true);
    expect(scoreCard(c, profile({ all: 3_000_000 }), { mileVnd: 300 }).rewards).toBe(360000);
  });

  it('adds VAT to a fee printed before VAT and waives it on enough spend', () => {
    const c = card({
      annualFee: 500000,
      feesFinal: false,
      feeWaiver: { text: 'x', minSpendYear: 100_000_000 },
    });
    expect(scoreCard(c, profile({ all: 1_000_000 })).cost).toBe(550000);
    expect(scoreCard(c, profile({ all: 10_000_000 })).cost).toBe(0);
  });

  it('leaves net unknown when foreign spend meets an unknown foreign fee', () => {
    const s = scoreCard(card({ fxFee: null }), profile({ all: 1_000_000 }, 1_000_000));
    expect(s.net).toBeNull();
  });

  it('marks expired reward terms', () => {
    const c = card({ rewardsUntil: '2026-11-20' });
    expect(scoreCard(c, profile({}), { today: '2026-11-25' }).expired).toBe(true);
  });
});

describe('rank', () => {
  it('puts expired terms after current ones and unknown values last', () => {
    const p = profile({ all: 10_000_000 });
    const today = '2026-11-25';
    const good = scoreCard(card({ id: 'g', name: 'G', rewards: [cash('all', 1)] }), p, { today });
    const expired = scoreCard(
      card({ id: 'e', name: 'E', rewards: [cash('all', 5)], rewardsUntil: '2026-11-01' }),
      p,
      { today },
    );
    const unknown = scoreCard(card({ id: 'u', name: 'U', annualFee: null }), p, { today });
    expect(rank([unknown, expired, good]).map((s) => s.card.id)).toEqual(['g', 'u', 'e']);
  });
});
