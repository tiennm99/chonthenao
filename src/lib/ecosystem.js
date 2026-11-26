/**
 * Pure helpers behind the bank-ecosystem pages: labels, savings and loan rate lookups and sorting,
 * and an estimated yearly cost of everyday banking. Like the catalog, they never treat an unknown
 * value as 0. They take records as arguments and never load data or bank details themselves.
 */

import { UNKNOWN, VAT_RATE, formatVnd } from './catalog.js';
import { SAVINGS_TERMS } from './data/schema.js';

/** @typedef {import('./data/schema.js').Banking} Banking */
/** @typedef {import('./data/schema.js').Savings} Savings */
/** @typedef {import('./data/schema.js').Loans} Loans */
/** @typedef {import('./data/schema.js').LoanProduct} LoanProduct */

/** @type {Record<string, string>} */
export const LOAN_TYPE_LABELS = {
  unsecured: 'Vay tín chấp',
  home: 'Vay mua nhà',
  auto: 'Vay mua ô tô',
};

/** @type {Record<string, string>} */
export const CHANNEL_LABELS = {
  online: 'Online',
  counter: 'Tại quầy',
};

/** @type {Record<string, string>} Labels for the fields in BANKING_FEE_FIELDS. */
export const BANKING_FEE_LABELS = {
  accountMonthlyFee: 'Phí quản lý tài khoản (tháng)',
  minBalance: 'Số dư tối thiểu',
  transferInternalFee: 'Chuyển khoản online cùng ngân hàng (lần)',
  transferInterbankFee: 'Chuyển khoản online liên ngân hàng Napas 24/7 (lần)',
  atmOnUsFee: 'Rút tiền ATM cùng ngân hàng (lần)',
  atmOffUsFee: 'Rút tiền ATM ngân hàng khác (lần)',
  smsFeeMonth: 'SMS báo số dư (tháng)',
  digitalBankingFeeMonth: 'Ngân hàng số: app, internet banking (tháng)',
};

/**
 * Interbank transfers a year assumed by the yearly cost estimate: 10 a month.
 * Pages print this assumption next to the estimate.
 */
export const YEARLY_INTERBANK_TRANSFERS = 120;

/**
 * One of a banking record's BANKING_FEE_FIELDS.
 * @param {Banking} record
 * @param {string} field
 * @returns {number|null}
 */
export const bankingFee = (record, field) =>
  /** @type {Record<string, number|null>} */ (/** @type {unknown} */ (record))[field] ?? null;

/**
 * A banking fee for display. `minBalance` is an amount to keep, not a fee, so 0 reads
 * "Không yêu cầu" rather than "Miễn phí".
 * @param {string} field One of BANKING_FEE_FIELDS.
 * @param {number|null} value
 * @returns {string}
 */
export const formatBankingFee = (field, value) =>
  field === 'minBalance' ? formatAmount(value) : formatVnd(value);

/**
 * An amount such as a minimum balance or deposit; 0 means no minimum.
 * @param {number|null} n
 * @returns {string}
 */
export const formatAmount = (n) => (n === 0 ? 'Không yêu cầu' : formatVnd(n));

/**
 * A duration in months: whole years read as years ("20 năm"), the rest as months.
 * @param {number|null} months
 * @returns {string}
 */
export const formatMonths = (months) =>
  months === null
    ? UNKNOWN
    : months >= 12 && months % 12 === 0
      ? `${months / 12} năm`
      : `${months} tháng`;

/**
 * The savings rate for a term, percent per year.
 * @param {Savings|null|undefined} record
 * @param {number} termMonths
 * @returns {number|null} null when there is no record, the term is not listed, or its rate is unknown.
 */
export function savingsRate(record, termMonths) {
  return record?.rates.find((r) => r.termMonths === termMonths)?.rate ?? null;
}

/**
 * Compares two possibly-unknown numbers; unknowns go last whatever the direction.
 * @param {number|null} a
 * @param {number|null} b
 * @param {1|-1} dir 1 ascending, -1 descending.
 * @returns {number}
 */
function nullsLast(a, b, dir) {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return (a - b) * dir;
}

/**
 * Sorts a copy of the savings records by their rate for a term, highest first. A record that does
 * not list the term, or lists it with an unknown rate, sorts last.
 * @param {Savings[]} records
 * @param {number} termMonths
 * @param {(r: Savings) => string} [nameOf] Tie-break name, such as the bank's short name.
 * @returns {Savings[]}
 */
export function sortSavingsByTerm(records, termMonths, nameOf = (r) => r.bank) {
  return [...records].sort(
    (a, b) =>
      nullsLast(savingsRate(a, termMonths), savingsRate(b, termMonths), -1) ||
      nameOf(a).localeCompare(nameOf(b), 'vi'),
  );
}

/**
 * The terms that at least one record lists, in SAVINGS_TERMS order.
 * @param {Savings[]} records
 * @returns {number[]}
 */
export const listedTerms = (records) =>
  SAVINGS_TERMS.filter((t) => records.some((r) => r.rates.some((x) => x.termMonths === t)));

/**
 * The best known rate for each term across the records. A term no record knows a rate for is
 * absent, so it never highlights anything.
 * @param {Savings[]} records
 * @returns {Map<number, number>} termMonths to the highest rate.
 */
export function bestRatesByTerm(records) {
  /** @type {Map<number, number>} */
  const best = new Map();
  for (const r of records) {
    for (const { termMonths, rate } of r.rates) {
      if (rate === null) continue;
      const cur = best.get(termMonths);
      if (cur === undefined || rate > cur) best.set(termMonths, rate);
    }
  }
  return best;
}

/**
 * Whether a rate is the best known one for its term; every bank tied for best counts.
 * @param {Map<number, number>} best From bestRatesByTerm.
 * @param {number} termMonths
 * @param {number|null} rate
 * @returns {boolean}
 */
export const isBestRate = (best, termMonths, rate) =>
  rate !== null && best.get(termMonths) === rate;

/**
 * @typedef {object} LoanRow
 * @property {string} bank Bank id.
 * @property {LoanProduct} product
 * @property {number} index The product's position in its record, for a unique key.
 * @property {Loans} record
 */

/**
 * Every product of a loan type across the records, one row per product, lowest `rateFrom` first.
 * Unknown rates sort last.
 * @param {Loans[]} records
 * @param {string} type One of LOAN_TYPES.
 * @param {(bankId: string) => string} [nameOf] Tie-break name for a bank id.
 * @returns {LoanRow[]}
 */
export function loansOfType(records, type, nameOf = (id) => id) {
  return records
    .flatMap((record) =>
      record.products
        .map((product, index) => ({ bank: record.bank, product, index, record }))
        .filter((row) => row.product.type === type),
    )
    .sort(
      (a, b) =>
        nullsLast(a.product.rateFrom, b.product.rateFrom, 1) ||
        nameOf(a.bank).localeCompare(nameOf(b.bank), 'vi') ||
        a.index - b.index,
    );
}

/**
 * The lowest known `rateFrom` a bank publishes for a loan type.
 * @param {Loans|null|undefined} record
 * @param {string} type
 * @returns {number|null} null when there is no record, no product of the type, or no known rate.
 */
export function lowestLoanRate(record, type) {
  const rates = (record?.products ?? [])
    .filter((p) => p.type === type && p.rateFrom !== null)
    .map((p) => /** @type {number} */ (p.rateFrom));
  return rates.length === 0 ? null : Math.min(...rates);
}

/**
 * Estimated yearly cost of everyday banking: the monthly account, SMS and digital banking fees
 * for 12 months, plus `transfers` online interbank transfers. VAT is added when the fees are
 * printed before VAT. Any unknown part makes the total unknown.
 * @param {Banking|null|undefined} record
 * @param {number} [transfers] Interbank transfers a year.
 * @returns {number|null} VND, rounded.
 */
export function yearlyBankingCost(record, transfers = YEARLY_INTERBANK_TRANSFERS) {
  if (!record) return null;
  const { accountMonthlyFee, smsFeeMonth, digitalBankingFeeMonth, transferInterbankFee } = record;
  if (
    accountMonthlyFee === null ||
    smsFeeMonth === null ||
    digitalBankingFeeMonth === null ||
    transferInterbankFee === null
  ) {
    return null;
  }
  const printed =
    (accountMonthlyFee + smsFeeMonth + digitalBankingFeeMonth) * 12 +
    transfers * transferInterbankFee;
  const total = record.feesFinal === false ? printed * (1 + VAT_RATE) : printed;
  return Math.round(total);
}
