import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BANKING_FEE_FIELDS, LOAN_TYPES } from './data/schema.js';
import {
  BANKING_FEE_LABELS,
  LOAN_TYPE_LABELS,
  bankingFee,
  bestRatesByTerm,
  formatAmount,
  formatBankingFee,
  formatMonths,
  isBestRate,
  listedTerms,
  loansOfType,
  lowestLoanRate,
  savingsRate,
  sortSavingsByTerm,
  yearlyBankingCost,
} from './ecosystem.js';

/** @typedef {import('./data/schema.js').Savings} Savings */
/** @typedef {import('./data/schema.js').Loans} Loans */
/** @typedef {import('./data/schema.js').Banking} Banking */

const provenance = { notes: [], sourceUrls: ['https://example.com'], lastVerified: '2026-11-01' };

/**
 * @param {string} bank
 * @param {[number, number|null][]} rates
 * @returns {Savings}
 */
const savings = (bank, rates) => ({
  id: bank,
  bank,
  channel: 'online',
  rates: rates.map(([termMonths, rate]) => ({ termMonths, rate })),
  minAmount: null,
  ...provenance,
});

/**
 * @param {string} bank
 * @param {[string, number|null][]} products
 * @returns {Loans}
 */
const loans = (bank, products) => ({
  id: bank,
  bank,
  products: products.map(([type, rateFrom], i) => ({
    type: /** @type {'unsecured'|'home'|'auto'} */ (type),
    name: `Loan ${i}`,
    rateFrom,
    fixedMonths: null,
    maxTermMonths: null,
    maxAmount: null,
  })),
  ...provenance,
});

/**
 * @param {Partial<Banking>} fields
 * @returns {Banking}
 */
const banking = (fields) => ({
  id: 'x',
  bank: 'x',
  accountMonthlyFee: 0,
  minBalance: 0,
  transferInternalFee: 0,
  transferInterbankFee: 0,
  atmOnUsFee: 0,
  atmOffUsFee: 0,
  smsFeeMonth: 0,
  digitalBankingFeeMonth: 0,
  feesFinal: true,
  perks: [],
  ...provenance,
  ...fields,
});

describe('labels', () => {
  it('labels every loan type and banking fee field', () => {
    for (const t of LOAN_TYPES) expect(LOAN_TYPE_LABELS[t]).toBeTruthy();
    for (const f of BANKING_FEE_FIELDS) expect(BANKING_FEE_LABELS[f]).toBeTruthy();
  });

  it('shows a zero minimum as not required, not as free', () => {
    expect(formatAmount(0)).toBe('Không yêu cầu');
    expect(formatBankingFee('minBalance', 0)).toBe('Không yêu cầu');
    expect(formatBankingFee('smsFeeMonth', 0)).toBe('Miễn phí');
    expect(formatBankingFee('smsFeeMonth', null)).toBe('chưa rõ');
  });

  it('reads a banking fee field', () => {
    expect(bankingFee(banking({ atmOffUsFee: 3300 }), 'atmOffUsFee')).toBe(3300);
    expect(bankingFee(banking({ smsFeeMonth: null }), 'smsFeeMonth')).toBeNull();
  });

  it('shows whole years as years', () => {
    expect(formatMonths(240)).toBe('20 năm');
    expect(formatMonths(6)).toBe('6 tháng');
    expect(formatMonths(18)).toBe('18 tháng');
    expect(formatMonths(null)).toBe('chưa rõ');
  });
});

describe('savings', () => {
  const a = savings('a', [
    [6, 5],
    [12, 6],
  ]);
  const b = savings('b', [
    [6, 5.5],
    [12, null],
  ]);
  const c = savings('c', [[6, 4]]);
  const d = savings('d', [
    [12, 6],
    [36, 7],
  ]);

  it('looks up a rate by term, null when missing or unknown', () => {
    expect(savingsRate(a, 12)).toBe(6);
    expect(savingsRate(b, 12)).toBeNull();
    expect(savingsRate(c, 12)).toBeNull();
    expect(savingsRate(undefined, 12)).toBeNull();
  });

  it('sorts by a term, highest first, unknown and missing last', () => {
    expect(sortSavingsByTerm([b, c, a, d], 12).map((r) => r.bank)).toEqual(['a', 'd', 'b', 'c']);
    expect(sortSavingsByTerm([c, a, b], 6).map((r) => r.bank)).toEqual(['b', 'a', 'c']);
    expect(sortSavingsByTerm([], 6)).toEqual([]);
  });

  it('lists only terms some record has, in order', () => {
    expect(listedTerms([d, a])).toEqual([6, 12, 36]);
    expect(listedTerms([])).toEqual([]);
  });

  it('finds the best rate per term and highlights every tie, never a null', () => {
    const best = bestRatesByTerm([a, b, c, d]);
    expect(best.get(6)).toBe(5.5);
    expect(best.get(12)).toBe(6);
    expect(isBestRate(best, 12, savingsRate(a, 12))).toBe(true);
    expect(isBestRate(best, 12, savingsRate(d, 12))).toBe(true);
    expect(isBestRate(best, 12, null)).toBe(false);
    expect(bestRatesByTerm([savings('e', [[1, null]])]).has(1)).toBe(false);
    expect(bestRatesByTerm([]).size).toBe(0);
  });
});

describe('loans', () => {
  const x = loans('x', [
    ['home', 8],
    ['home', 6],
    ['auto', null],
  ]);
  const y = loans('y', [
    ['home', null],
    ['home', 7],
    ['unsecured', 20],
  ]);

  it('lists one row per product of a type, lowest rateFrom first, unknown last', () => {
    expect(loansOfType([x, y], 'home').map((r) => [r.bank, r.product.rateFrom])).toEqual([
      ['x', 6],
      ['y', 7],
      ['x', 8],
      ['y', null],
    ]);
    expect(loansOfType([x, y], 'auto').map((r) => r.bank)).toEqual(['x']);
    expect(loansOfType([], 'home')).toEqual([]);
  });

  it('finds the lowest known rate a bank publishes for a type', () => {
    expect(lowestLoanRate(x, 'home')).toBe(6);
    expect(lowestLoanRate(x, 'auto')).toBeNull();
    expect(lowestLoanRate(x, 'unsecured')).toBeNull();
    expect(lowestLoanRate(undefined, 'home')).toBeNull();
  });
});

describe('yearlyBankingCost', () => {
  it('adds 12 months of fees and the interbank transfers', () => {
    const r = banking({ accountMonthlyFee: 10000, smsFeeMonth: 5000, transferInterbankFee: 1000 });
    expect(yearlyBankingCost(r, 10)).toBe((10000 + 5000) * 12 + 10 * 1000);
  });

  it('adds VAT only when fees are printed before VAT', () => {
    const fields = { accountMonthlyFee: 10000 };
    expect(yearlyBankingCost(banking({ ...fields, feesFinal: false }), 0)).toBe(132000);
    expect(yearlyBankingCost(banking({ ...fields, feesFinal: null }), 0)).toBe(120000);
  });

  it('is unknown when any part is unknown or there is no record', () => {
    expect(yearlyBankingCost(banking({ smsFeeMonth: null }))).toBeNull();
    expect(yearlyBankingCost(banking({ transferInterbankFee: null }))).toBeNull();
    expect(yearlyBankingCost(banking({ digitalBankingFeeMonth: null }))).toBeNull();
    expect(yearlyBankingCost(undefined)).toBeNull();
  });

  it('is 0 when every part is free', () => {
    expect(yearlyBankingCost(banking({}))).toBe(0);
  });
});

it('never loads data or reads referral links', () => {
  const src = readFileSync(new URL('./ecosystem.js', import.meta.url), 'utf8');
  expect(src).not.toMatch(/\.referral|import[^;]*data\/index/);
});
