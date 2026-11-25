import { describe, expect, it } from 'vitest';
import { validateAll, validateBank, validateCard } from './schema.js';

// Test fixtures only: made-up values that never ship as site data.
const bank = {
  id: 'test-bank',
  name: 'Ngân hàng Thử nghiệm',
  shortName: 'TestBank',
  officialUrl: 'https://bank.example.com',
  referral: null,
  sourceUrls: ['https://bank.example.com/about'],
  lastVerified: '2026-11-25',
};

const card = {
  id: 'test-bank-cashback',
  bank: 'test-bank',
  name: 'Thẻ Thử nghiệm Cashback',
  network: 'visa',
  tier: null,
  issuanceFee: 0,
  annualFee: null,
  feeWaiver: { text: 'Chi tiêu đủ ngưỡng', minSpendYear: null },
  rewards: [{ category: 'online', type: 'cashback', rate: 5, capMonth: null }],
  fxFee: null,
  interestRate: null,
  interestFreeDays: 45,
  minIncome: null,
  virtual: true,
  perks: [],
  sourceUrls: ['https://bank.example.com/card'],
  lastVerified: '2026-11-25',
};

describe('validateCard', () => {
  it('accepts a card with unknown figures left as null', () => {
    expect(validateCard(card)).toEqual([]);
  });

  it('rejects a card without a source', () => {
    expect(validateCard({ ...card, sourceUrls: [] })).toContain(
      'sourceUrls must list at least one source',
    );
  });

  it('rejects a missing or malformed lastVerified date', () => {
    expect(validateCard({ ...card, lastVerified: '25/11/2026' })).toContain(
      'lastVerified must be a YYYY-MM-DD date',
    );
  });

  it('rejects an unknown reward category', () => {
    const bad = {
      ...card,
      rewards: [{ category: 'casino', type: 'cashback', rate: 1, capMonth: null }],
    };
    expect(validateCard(bad)).toHaveLength(1);
  });

  it('rejects a negative fee', () => {
    expect(validateCard({ ...card, annualFee: -1 })).toContain(
      'annualFee must be a non-negative number or null',
    );
  });
});

describe('validateBank', () => {
  it('accepts a bank with a referral', () => {
    const withReferral = {
      ...bank,
      referral: { url: 'https://ref.example.com/x', code: null, note: 'Quà khi mở app' },
    };
    expect(validateBank(withReferral)).toEqual([]);
  });

  it('rejects a non-https referral link', () => {
    const bad = { ...bank, referral: { url: 'http://ref.example.com', code: null, note: '' } };
    expect(validateBank(bad)).toContain('referral must be null or { url, code, note }');
  });
});

describe('validateAll', () => {
  it('flags a card whose bank does not exist', () => {
    expect(validateAll({ cards: [{ ...card, bank: 'nope' }], banks: [bank] })).toContain(
      'card test-bank-cashback: unknown bank nope',
    );
  });

  it('flags duplicate ids', () => {
    expect(validateAll({ cards: [card, card], banks: [bank] })).toContain(
      'card test-bank-cashback: duplicate id',
    );
  });
});
