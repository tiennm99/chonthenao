import { describe, expect, it } from 'vitest';
import {
  describeRate,
  effectiveRate,
  filterCards,
  formatCap,
  formatCreditField,
  formatDate,
  formatVnd,
  headlineReward,
  isConditional,
  kindStats,
  paidAnnualFee,
  rewardFor,
  sortCards,
} from './catalog.js';

// Test fixtures only: made-up cards that never ship as site data.
/** @type {import('./data/schema.js').Card} */
const base = {
  id: 'a',
  bank: 'bank-a',
  name: 'A',
  kind: 'credit',
  network: 'visa',
  tier: null,
  issuanceFee: 0,
  annualFee: 500000,
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

/**
 * A debit card: the credit-only fields are left out, as in the data files.
 * @param {Partial<import('./data/schema.js').Card>} over
 * @returns {import('./data/schema.js').Card}
 */
const debitCard = (over) => {
  /** @type {import('./data/schema.js').Card} */
  const c = { ...base, kind: 'debit', ...over };
  delete c.interestRate;
  delete c.interestFreeDays;
  delete c.minIncome;
  return c;
};

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

const debit = debitCard({ id: 'g', name: 'Debit', annualFee: 0, rewards: [cash('online', 1)] });

describe('credit-only fields', () => {
  it('reads "không áp dụng" on a debit card and the value or unknown on a credit card', () => {
    expect('interestRate' in debit).toBe(false);
    expect(formatCreditField(debit, 'interestRate')).toBe('không áp dụng');
    expect(formatCreditField(debit, 'minIncome')).toBe('không áp dụng');
    expect(formatCreditField(flat, 'interestRate')).toBe('30%/năm');
    expect(formatCreditField(flat, 'interestFreeDays')).toBe('45 ngày');
    expect(formatCreditField(flat, 'minIncome')).toBe('10.000.000 đ/tháng');
    expect(formatCreditField(card({ interestFreeDays: null }), 'interestFreeDays')).toBe('chưa rõ');
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

  it('filters by kind', () => {
    expect(filterCards([flat, debit], { kind: 'debit' }).map((c) => c.id)).toEqual(['g']);
    expect(filterCards([flat, debit], { kind: 'credit' }).map((c) => c.id)).toEqual(['f']);
    expect(filterCards([flat, debit], { kind: '' })).toHaveLength(2);
  });

  it('keeps debit cards when filtering on income, since they have no income minimum', () => {
    expect(filterCards([flat, debit], { myIncome: 50000000 }).map((c) => c.id)).toEqual(['f', 'g']);
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

  it('puts debit cards after unknowns on credit-only sorts', () => {
    const unknown = card({ id: 'u', name: 'Unknown', interestRate: null, interestFreeDays: null });
    const low = card({ id: 'l', name: 'Low', interestRate: 20, interestFreeDays: 55 });
    const byRate = sortCards([debit, unknown, flat, low], 'interestRate').map((c) => c.id);
    expect(byRate).toEqual(['l', 'f', 'u', 'g']);
    const byDays = sortCards([debit, unknown, flat, low], 'interestFreeDays').map((c) => c.id);
    expect(byDays).toEqual(['l', 'f', 'u', 'g']);
  });

  it('rejects an unknown sort key', () => {
    expect(() => sortCards([flat], 'nope')).toThrow();
  });
});

describe('kindStats', () => {
  it('summarises one kind from known values only', () => {
    const s = kindStats(
      [flat, dining, points, debit, debitCard({ id: 'h', annualFee: null })],
      'credit',
    );
    expect(s.count).toBe(3);
    expect(s.banks).toBe(1);
    expect(s.minAnnualFee).toBe(500000);
    expect(s.maxAnnualFee).toBe(500000);
    expect(s.knownAnnualFee).toBe(2);
    expect(s.freeAnnualFee).toBe(0);
    expect(s.bestCashback).toBe(6);
    expect(s.withRewards).toBe(3);
    expect(s.virtual).toBe(0);
    expect(s.virtualUnknown).toBe(3);
    expect(s.minInterestRate).toBe(30);
    expect(s.maxInterestFreeDays).toBe(45);
  });

  it('keeps unknown debit fees out of the range and counts free fees', () => {
    const s = kindStats(
      [flat, debit, debitCard({ id: 'h', annualFee: null, virtual: true })],
      'debit',
    );
    expect(s.count).toBe(2);
    expect(s.minAnnualFee).toBe(0);
    expect(s.maxAnnualFee).toBe(0);
    expect(s.freeAnnualFee).toBe(1);
    expect(s.knownAnnualFee).toBe(1);
    expect(s.bestCashback).toBe(1);
    expect(s.virtual).toBe(1);
    expect(s.minInterestRate).toBeNull();
    expect(s.maxInterestFreeDays).toBeNull();
  });

  it('returns no range for a kind with no cards', () => {
    const s = kindStats([flat], 'debit');
    expect(s.count).toBe(0);
    expect(s.minAnnualFee).toBeNull();
    expect(s.bestCashback).toBeNull();
    expect(s.minFxFee).toBeNull();
  });
});

describe('paidAnnualFee', () => {
  it('adds VAT only to a fee printed before VAT, and ranks and filters by it', () => {
    const net = card({ id: 'net', annualFee: 99000, feesFinal: false });
    const gross = card({ id: 'gross', annualFee: 100000, feesFinal: true });
    expect(paidAnnualFee(net)).toBe(108900);
    expect(paidAnnualFee(gross)).toBe(100000);
    expect(paidAnnualFee(card({ annualFee: null }))).toBeNull();
    expect(sortCards([net, gross], 'annualFee').map((c) => c.id)).toEqual(['gross', 'net']);
    expect(filterCards([net, gross], { maxAnnualFee: 100000 }).map((c) => c.id)).toEqual(['gross']);
    expect(kindStats([net, gross], 'credit').maxAnnualFee).toBe(108900);
  });
});
