import { describe, expect, it } from 'vitest';
import {
  validateAll,
  validateBank,
  validateBanking,
  validateCard,
  validateLoans,
  validateSavings,
} from './schema.js';

// Test fixtures only: made-up values that never ship as site data.
const bank = {
  id: 'test-bank',
  name: 'Ngân hàng Thử nghiệm',
  shortName: 'TestBank',
  officialUrl: 'https://bank.example.com',
  cardsUrl: null,
  feeScheduleUrl: 'https://bank.example.com/fees',
  referral: null,
  sourceUrls: ['https://bank.example.com/about'],
  lastVerified: '2026-11-25',
};

const card = {
  id: 'test-bank-cashback',
  bank: 'test-bank',
  name: 'Thẻ Thử nghiệm Cashback',
  kind: 'credit',
  network: 'visa',
  tier: null,
  issuanceFee: 0,
  annualFee: null,
  feesFinal: true,
  feeWaiver: { text: 'Chi tiêu đủ ngưỡng', minSpendYear: null },
  rewards: [
    { category: 'online', type: 'cashback', rate: 5, earn: null, capMonth: null },
    { category: 'grocery', type: 'cashback', rate: 5, earn: null, capMonth: null },
  ],
  sharedCaps: [{ categories: ['online', 'grocery'], capMonth: 100000 }],
  minSpendMonth: null,
  maxCategories: null,
  rewardsUntil: null,
  pointValueVnd: null,
  fxFee: null,
  interestRate: null,
  interestFreeDays: 45,
  minIncome: null,
  virtual: true,
  perks: [],
  notes: [],
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
      rewards: [{ category: 'casino', type: 'cashback', rate: 1, earn: null, capMonth: null }],
    };
    expect(validateCard(bad)).toHaveLength(1);
  });

  it('accepts miles earned as published units per VND', () => {
    const miles = {
      ...card,
      rewards: [
        {
          category: 'all',
          type: 'miles',
          rate: null,
          earn: { units: 1, perVnd: 30000 },
          capMonth: null,
        },
      ],
      sharedCaps: [],
    };
    expect(validateCard(miles)).toEqual([]);
  });

  it('rejects miles stored as a percent rate', () => {
    const bad = {
      ...card,
      rewards: [{ category: 'all', type: 'miles', rate: 1, earn: null, capMonth: null }],
      sharedCaps: [],
    };
    expect(validateCard(bad)).toHaveLength(1);
  });

  it('rejects a shared cap over a single category', () => {
    const bad = { ...card, sharedCaps: [{ categories: ['online'], capMonth: 100000 }] };
    expect(validateCard(bad)).toEqual([
      'sharedCaps[0] needs two or more known categories and a capMonth',
    ]);
  });

  it('rejects a negative fee', () => {
    expect(validateCard({ ...card, annualFee: -1 })).toContain(
      'annualFee must be a non-negative number or null',
    );
  });
});

describe('card kinds', () => {
  const { interestRate, interestFreeDays, minIncome, ...debitBase } = card;
  const debit = { ...debitBase, id: 'test-bank-debit', kind: 'debit' };

  it('accepts a debit card that leaves out the credit-only fields', () => {
    expect([interestRate, interestFreeDays, minIncome]).toEqual([null, 45, null]);
    expect(validateCard(debit)).toEqual([]);
  });

  it('rejects a debit card that carries a credit-only field', () => {
    expect(validateCard({ ...debit, interestRate: null })).toContain(
      'interestRate does not apply to a debit card; leave it out',
    );
  });

  it('rejects a credit card missing a credit-only field', () => {
    expect(validateCard({ ...debit, kind: 'credit' })).toContain(
      'interestRate is required on a credit card (null when unknown)',
    );
  });

  it('rejects an unknown kind', () => {
    expect(validateCard({ ...card, kind: 'prepaid' })).toContain(
      'kind must be one of credit, debit',
    );
  });
});

const banking = {
  id: 'test-bank',
  bank: 'test-bank',
  accountMonthlyFee: 0,
  minBalance: null,
  transferInternalFee: 0,
  transferInterbankFee: 0,
  atmOnUsFee: 1100,
  atmOffUsFee: 3300,
  smsFeeMonth: 11000,
  digitalBankingFeeMonth: 0,
  feesFinal: true,
  perks: [],
  notes: [],
  sourceUrls: ['https://bank.example.com/fees'],
  lastVerified: '2026-11-26',
};

const savings = {
  id: 'test-bank',
  bank: 'test-bank',
  channel: 'online',
  rates: [
    { termMonths: 1, rate: 3.1 },
    { termMonths: 12, rate: null },
  ],
  minAmount: 1000000,
  notes: [],
  sourceUrls: ['https://bank.example.com/rates'],
  lastVerified: '2026-11-26',
};

const loans = {
  id: 'test-bank',
  bank: 'test-bank',
  products: [
    {
      type: 'home',
      name: 'Vay mua nhà',
      rateFrom: 6.5,
      fixedMonths: 12,
      maxTermMonths: 300,
      maxAmount: null,
    },
  ],
  notes: [],
  sourceUrls: ['https://bank.example.com/loans'],
  lastVerified: '2026-11-26',
};

describe('per-bank records', () => {
  it('accepts banking, savings and loans records', () => {
    expect(validateBanking(banking)).toEqual([]);
    expect(validateSavings(savings)).toEqual([]);
    expect(validateLoans(loans)).toEqual([]);
  });

  it('requires every banking fee key, null when unknown', () => {
    const { smsFeeMonth, ...bad } = banking;
    expect(smsFeeMonth).toBe(11000);
    expect(validateBanking(bad)).toContain('smsFeeMonth must be a non-negative number or null');
  });

  it('requires id to equal bank', () => {
    expect(validateSavings({ ...savings, id: 'other' })).toContain('id must equal bank');
  });

  it('rejects an unlisted or repeated savings term', () => {
    expect(validateSavings({ ...savings, rates: [{ termMonths: 5, rate: 4 }] })).toHaveLength(1);
    const twice = { ...savings, rates: [savings.rates[0], savings.rates[0]] };
    expect(validateSavings(twice)).toContain('rates[1]: term 1 is listed twice');
  });

  it('rejects an unknown loan type', () => {
    const bad = { ...loans, products: [{ ...loans.products[0], type: 'payday' }] };
    expect(validateLoans(bad)).toContain('products[0].type must be one of unsecured, home, auto');
  });

  it('flags a per-bank record whose bank does not exist', () => {
    const errors = validateAll({
      cards: [],
      banks: [bank],
      savings: [{ ...savings, id: 'x', bank: 'x' }],
    });
    expect(errors).toContain('savings x: unknown bank x');
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

  it('rejects a referral that publishes a code', () => {
    const bad = { ...bank, referral: { url: 'https://ref.example.com/x', code: 'ABC', note: '' } };
    expect(validateBank(bad)).toHaveLength(1);
  });

  it('rejects a non-https referral link', () => {
    const bad = { ...bank, referral: { url: 'http://ref.example.com', code: null, note: '' } };
    expect(validateBank(bad)).toContain(
      'referral must be null or { url, code: null, note }; never publish a code',
    );
  });

  it('rejects a non-https cards page', () => {
    expect(validateBank({ ...bank, cardsUrl: 'http://bank.example.com/cards' })).toContain(
      'cardsUrl must be an https URL or null',
    );
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
