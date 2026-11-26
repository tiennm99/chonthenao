/**
 * Shape checks for the data files: cards, banks, and each bank's everyday banking fees, savings
 * rates and loan rates. Unknown figures are `null`, never guessed; every record must name its
 * sources and the date they were last checked.
 */

export const NETWORKS = ['visa', 'mastercard', 'jcb', 'amex', 'napas', 'unionpay'];
/** `credit`: thẻ tín dụng. `debit`: thẻ ghi nợ, spending from the cardholder's own account. */
export const CARD_KINDS = ['credit', 'debit'];
/**
 * Fields that only a credit card has. A debit card leaves them out entirely, which the site shows
 * as "không áp dụng"; `null` on a credit card still means unknown.
 */
export const CREDIT_ONLY_FIELDS = ['interestRate', 'interestFreeDays', 'minIncome'];
/** Term-deposit terms, in months, that a savings record may list. */
export const SAVINGS_TERMS = [1, 3, 6, 9, 12, 18, 24, 36];
/** `online`: opened in the bank's app or internet banking. `counter`: opened at a branch. */
export const SAVINGS_CHANNELS = ['online', 'counter'];
/** `unsecured`: vay tín chấp tiêu dùng. `home`: vay mua nhà. `auto`: vay mua ô tô. */
export const LOAN_TYPES = ['unsecured', 'home', 'auto'];
/** Everyday banking fees in a banking record, all VND, `null` when unknown. */
export const BANKING_FEE_FIELDS = [
  'accountMonthlyFee',
  'minBalance',
  'transferInternalFee',
  'transferInterbankFee',
  'atmOnUsFee',
  'atmOffUsFee',
  'smsFeeMonth',
  'digitalBankingFeeMonth',
];
export const REWARD_TYPES = ['cashback', 'points', 'miles'];
/** Spending categories the quiz asks about; `all` is the base rate for any spend. */
export const CATEGORIES = [
  'all',
  'dining',
  'grocery',
  'online',
  'fuel',
  'travel',
  'foreign',
  'transport',
  'education',
  'health',
];

const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * @typedef {object} Reward
 * @property {string} category
 * @property {string} type
 * @property {number|null} rate Cashback: percent of spend. Points and miles: null.
 * @property {{ units: number, perVnd: number }|null} earn Points and miles as published, such as
 *   1 mile per 30.000 VND: `{ units: 1, perVnd: 30000 }`. Cashback: null.
 * @property {number|null} capMonth This reward's own monthly cap in VND, or null when none or unknown.
 * @property {string} [note] Conditions the numbers cannot hold, such as a bonus tied to payroll.
 */

/**
 * One monthly cap shared by several reward categories.
 * @typedef {object} SharedCap
 * @property {string[]} categories
 * @property {number} capMonth VND of reward per month.
 * @property {string} [note]
 */

/**
 * @typedef {object} Card
 * @property {string} id
 * @property {string} bank Bank id.
 * @property {string} name
 * @property {'credit'|'debit'} kind
 * @property {string} network
 * @property {string|null} tier
 * @property {number|null} issuanceFee VND.
 * @property {number|null} annualFee VND per year, primary card, for a customer with no special segment.
 * @property {boolean|null} feesFinal True when the printed fees are what the cardholder pays (VAT
 *   included, or the fee is not subject to VAT); false when VAT is added on top.
 * @property {{ text: string, minSpendYear: number|null }|null} feeWaiver
 * @property {Reward[]} rewards
 * @property {SharedCap[]} sharedCaps
 * @property {number|null} minSpendMonth Total spend per month or statement below which the card's
 *   category rewards pay nothing.
 * @property {number|null} maxCategories How many bonus categories the cardholder can use at once.
 * @property {string|null} rewardsUntil YYYY-MM-DD the published reward terms end, when they do.
 * @property {number|null} pointValueVnd VND value of one point or mile, when the bank publishes it.
 * @property {number|null} fxFee Total percent charged on a foreign-currency purchase at a merchant
 *   abroad: the sum of every per-transaction percentage fee the schedule applies to it.
 * @property {number|null} [interestRate] Percent per year. Credit cards only.
 * @property {number|null} [interestFreeDays] The published maximum ("tối đa N ngày"); otherwise
 *   null. Credit cards only.
 * @property {number|null} [minIncome] VND per month. Credit cards only.
 * @property {boolean|null} virtual True when the bank issues a virtual card usable before or without
 *   a physical one.
 * @property {string[]} perks
 * @property {string[]} notes Caveats for the reader: source conflicts, terms the fields cannot hold.
 * @property {string[]} sourceUrls
 * @property {string} lastVerified YYYY-MM-DD.
 */

/**
 * @typedef {object} Referral
 * @property {string} url
 * @property {null} code Always null: the site publishes referral links, never codes.
 * @property {string} note
 */

/**
 * @typedef {object} Bank
 * @property {string} id
 * @property {string} name
 * @property {string} shortName
 * @property {string} officialUrl
 * @property {string|null} cardsUrl The bank's credit card listing page.
 * @property {string|null} [debitCardsUrl] The bank's debit card listing page.
 * @property {string|null} feeScheduleUrl The bank's fee schedule (biểu phí) landing page.
 * @property {Referral|null} referral
 * @property {string[]} sourceUrls
 * @property {string} lastVerified
 */

/**
 * Everyday banking fees for an individual's VND payment account (tài khoản thanh toán), the
 * standard package with no priority or payroll segment. Online transfers, lowest amount tier.
 * @typedef {object} Banking
 * @property {string} id Equals `bank`.
 * @property {string} bank Bank id.
 * @property {number|null} accountMonthlyFee Phí quản lý tài khoản per month.
 * @property {number|null} minBalance Số dư tối thiểu the account must keep.
 * @property {number|null} transferInternalFee Online transfer within the bank, per transaction.
 * @property {number|null} transferInterbankFee Online Napas 24/7 transfer to another bank, per
 *   transaction.
 * @property {number|null} atmOnUsFee Cash withdrawal at the bank's own ATM with its domestic debit
 *   card, per withdrawal.
 * @property {number|null} atmOffUsFee Cash withdrawal at another bank's ATM in Vietnam, per
 *   withdrawal.
 * @property {number|null} smsFeeMonth SMS balance alerts per month.
 * @property {number|null} digitalBankingFeeMonth App or internet banking per month.
 * @property {boolean|null} feesFinal Same meaning as on a card.
 * @property {string[]} perks
 * @property {string[]} notes
 * @property {string[]} sourceUrls
 * @property {string} lastVerified YYYY-MM-DD.
 */

/**
 * @typedef {object} SavingsRate
 * @property {number} termMonths One of SAVINGS_TERMS.
 * @property {number|null} rate Percent per year, interest paid at the end of the term.
 */

/**
 * Term-deposit rates for an individual saving VND, interest paid at maturity, the lowest amount
 * tier.
 * @typedef {object} Savings
 * @property {string} id Equals `bank`.
 * @property {string} bank Bank id.
 * @property {'online'|'counter'} channel Online when the bank publishes online rates.
 * @property {SavingsRate[]} rates One entry per published term, each term once.
 * @property {number|null} minAmount Smallest deposit in VND.
 * @property {string[]} notes
 * @property {string[]} sourceUrls
 * @property {string} lastVerified YYYY-MM-DD.
 */

/**
 * @typedef {object} LoanProduct
 * @property {'unsecured'|'home'|'auto'} type
 * @property {string} name The product name as the bank prints it.
 * @property {number|null} rateFrom The lowest published rate, percent per year ("lãi suất từ").
 * @property {number|null} fixedMonths How long `rateFrom` is fixed, in months, when stated.
 * @property {number|null} maxTermMonths Longest loan term in months.
 * @property {number|null} maxAmount Largest loan in VND, when stated as an amount.
 * @property {string} [note]
 */

/**
 * @typedef {object} Loans
 * @property {string} id Equals `bank`.
 * @property {string} bank Bank id.
 * @property {LoanProduct[]} products
 * @property {string[]} notes
 * @property {string[]} sourceUrls
 * @property {string} lastVerified YYYY-MM-DD.
 */

/**
 * @param {unknown} v
 * @returns {v is Record<string, unknown>}
 */
const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * @param {unknown} v
 * @returns {boolean}
 */
const isHttpsUrl = (v) => typeof v === 'string' && /^https:\/\/\S+$/.test(v);

/**
 * @param {unknown} v
 * @returns {boolean}
 */
const isNonNegOrNull = (v) => v === null || (typeof v === 'number' && Number.isFinite(v) && v >= 0);

/**
 * @param {unknown} v
 * @returns {boolean}
 */
const isPositive = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;

/**
 * @param {unknown} v
 * @returns {boolean}
 */
const isStringArray = (v) => Array.isArray(v) && v.every((s) => typeof s === 'string');

/**
 * @param {unknown} r
 * @returns {boolean}
 */
function isValidReward(r) {
  if (!isObject(r)) return false;
  if (typeof r.category !== 'string' || !CATEGORIES.includes(r.category)) return false;
  if (!isNonNegOrNull(r.capMonth)) return false;
  if (r.note !== undefined && typeof r.note !== 'string') return false;
  if (r.type === 'cashback') return isNonNegOrNull(r.rate) && r.rate !== null && r.earn === null;
  if (r.type === 'points' || r.type === 'miles') {
    const e = r.earn;
    return r.rate === null && isObject(e) && isPositive(e.units) && isPositive(e.perVnd);
  }
  return false;
}

/**
 * @param {Record<string, unknown>} r
 * @param {string[]} errors
 */
function checkProvenance(r, errors) {
  if (!Array.isArray(r.sourceUrls) || r.sourceUrls.length === 0) {
    errors.push('sourceUrls must list at least one source');
  } else if (!r.sourceUrls.every(isHttpsUrl)) {
    errors.push('every sourceUrls entry must be an https URL');
  }
  if (typeof r.lastVerified !== 'string' || !DATE_RE.test(r.lastVerified)) {
    errors.push('lastVerified must be a YYYY-MM-DD date');
  } else if (Number.isNaN(Date.parse(`${r.lastVerified}T00:00:00Z`))) {
    errors.push('lastVerified is not a real date');
  }
}

/**
 * @param {unknown} card
 * @returns {string[]} Problems found; empty when the card is valid.
 */
export function validateCard(card) {
  /** @type {string[]} */
  const errors = [];
  if (!isObject(card)) return ['card must be an object'];
  const c = card;
  if (typeof c.id !== 'string' || !ID_RE.test(c.id)) errors.push('id must be kebab-case');
  if (typeof c.bank !== 'string' || !ID_RE.test(c.bank)) errors.push('bank must be a bank id');
  if (typeof c.name !== 'string' || c.name.trim() === '') errors.push('name is required');
  if (typeof c.kind !== 'string' || !CARD_KINDS.includes(c.kind)) {
    errors.push(`kind must be one of ${CARD_KINDS.join(', ')}`);
  } else if (c.kind === 'credit') {
    for (const key of CREDIT_ONLY_FIELDS) {
      if (!(key in c)) errors.push(`${key} is required on a credit card (null when unknown)`);
    }
  } else {
    for (const key of CREDIT_ONLY_FIELDS) {
      if (key in c) errors.push(`${key} does not apply to a debit card; leave it out`);
    }
  }
  if (typeof c.network !== 'string' || !NETWORKS.includes(c.network)) {
    errors.push(`network must be one of ${NETWORKS.join(', ')}`);
  }
  if (c.tier !== null && typeof c.tier !== 'string') errors.push('tier must be a string or null');
  for (const key of ['issuanceFee', 'annualFee', 'fxFee', 'pointValueVnd']) {
    if (!isNonNegOrNull(c[key])) errors.push(`${key} must be a non-negative number or null`);
  }
  for (const key of CREDIT_ONLY_FIELDS) {
    if (key in c && !isNonNegOrNull(c[key])) {
      errors.push(`${key} must be a non-negative number or null`);
    }
  }
  if (c.feeWaiver !== null) {
    const w = c.feeWaiver;
    if (!isObject(w) || typeof w.text !== 'string' || !isNonNegOrNull(w.minSpendYear)) {
      errors.push('feeWaiver must be null or { text, minSpendYear }');
    }
  }
  if (!Array.isArray(c.rewards)) {
    errors.push('rewards must be an array');
  } else {
    c.rewards.forEach((r, i) => {
      if (!isValidReward(r)) {
        errors.push(
          `rewards[${i}] needs a known category and type, a rate (cashback) or earn (points, miles), and capMonth`,
        );
      }
    });
  }
  if (!Array.isArray(c.sharedCaps)) {
    errors.push('sharedCaps must be an array');
  } else {
    c.sharedCaps.forEach((cap, i) => {
      if (
        !isObject(cap) ||
        !Array.isArray(cap.categories) ||
        cap.categories.length < 2 ||
        !cap.categories.every((k) => CATEGORIES.includes(String(k))) ||
        !isPositive(cap.capMonth)
      ) {
        errors.push(`sharedCaps[${i}] needs two or more known categories and a capMonth`);
      }
    });
  }
  if (!isNonNegOrNull(c.minSpendMonth))
    errors.push('minSpendMonth must be a non-negative number or null');
  if (
    c.maxCategories !== null &&
    !(Number.isInteger(c.maxCategories) && Number(c.maxCategories) > 0)
  ) {
    errors.push('maxCategories must be a positive integer or null');
  }
  if (
    c.rewardsUntil !== null &&
    (typeof c.rewardsUntil !== 'string' || !DATE_RE.test(c.rewardsUntil))
  ) {
    errors.push('rewardsUntil must be a YYYY-MM-DD date or null');
  }
  if (c.feesFinal !== null && typeof c.feesFinal !== 'boolean') {
    errors.push('feesFinal must be true, false or null');
  }
  if (c.virtual !== null && typeof c.virtual !== 'boolean') {
    errors.push('virtual must be true, false or null');
  }
  for (const key of ['perks', 'notes']) {
    if (!isStringArray(c[key])) errors.push(`${key} must be an array of strings`);
  }
  checkProvenance(c, errors);
  return errors;
}

/**
 * @param {unknown} bank
 * @returns {string[]} Problems found; empty when the bank is valid.
 */
export function validateBank(bank) {
  /** @type {string[]} */
  const errors = [];
  if (!isObject(bank)) return ['bank must be an object'];
  const b = bank;
  if (typeof b.id !== 'string' || !ID_RE.test(b.id)) errors.push('id must be kebab-case');
  for (const key of ['name', 'shortName']) {
    if (typeof b[key] !== 'string' || b[key].trim() === '') errors.push(`${key} is required`);
  }
  if (!isHttpsUrl(b.officialUrl)) errors.push('officialUrl must be an https URL');
  for (const key of ['cardsUrl', 'feeScheduleUrl']) {
    if (b[key] !== null && !isHttpsUrl(b[key])) errors.push(`${key} must be an https URL or null`);
  }
  if ('debitCardsUrl' in b && b.debitCardsUrl !== null && !isHttpsUrl(b.debitCardsUrl)) {
    errors.push('debitCardsUrl must be an https URL or null');
  }
  if (b.referral !== null) {
    const r = b.referral;
    if (!isObject(r) || !isHttpsUrl(r.url) || r.code !== null || typeof r.note !== 'string') {
      errors.push('referral must be null or { url, code: null, note }; never publish a code');
    }
  }
  checkProvenance(b, errors);
  return errors;
}

/**
 * Checks the fields every per-bank record shares: `id` equal to `bank`, notes and provenance.
 * @param {Record<string, unknown>} r
 * @param {string[]} errors
 */
function checkPerBank(r, errors) {
  if (typeof r.bank !== 'string' || !ID_RE.test(r.bank)) errors.push('bank must be a bank id');
  if (r.id !== r.bank) errors.push('id must equal bank');
  if (!isStringArray(r.notes)) errors.push('notes must be an array of strings');
  checkProvenance(r, errors);
}

/**
 * @param {unknown} record
 * @returns {string[]} Problems found; empty when the banking record is valid.
 */
export function validateBanking(record) {
  /** @type {string[]} */
  const errors = [];
  if (!isObject(record)) return ['banking record must be an object'];
  const r = record;
  for (const key of BANKING_FEE_FIELDS) {
    if (!(key in r) || !isNonNegOrNull(r[key])) {
      errors.push(`${key} must be a non-negative number or null`);
    }
  }
  if (r.feesFinal !== null && typeof r.feesFinal !== 'boolean') {
    errors.push('feesFinal must be true, false or null');
  }
  if (!isStringArray(r.perks)) errors.push('perks must be an array of strings');
  checkPerBank(r, errors);
  return errors;
}

/**
 * @param {unknown} record
 * @returns {string[]} Problems found; empty when the savings record is valid.
 */
export function validateSavings(record) {
  /** @type {string[]} */
  const errors = [];
  if (!isObject(record)) return ['savings record must be an object'];
  const r = record;
  if (typeof r.channel !== 'string' || !SAVINGS_CHANNELS.includes(r.channel)) {
    errors.push(`channel must be one of ${SAVINGS_CHANNELS.join(', ')}`);
  }
  if (!Array.isArray(r.rates) || r.rates.length === 0) {
    errors.push('rates must list at least one term');
  } else {
    const seen = new Set();
    r.rates.forEach((x, i) => {
      if (
        !isObject(x) ||
        !SAVINGS_TERMS.includes(Number(x.termMonths)) ||
        !isNonNegOrNull(x.rate)
      ) {
        errors.push(
          `rates[${i}] needs a termMonths in ${SAVINGS_TERMS.join(', ')} and a rate or null`,
        );
      } else if (seen.has(x.termMonths)) {
        errors.push(`rates[${i}]: term ${x.termMonths} is listed twice`);
      } else {
        seen.add(x.termMonths);
      }
      if (isObject(x) && typeof x.rate === 'number' && x.rate > 20) {
        errors.push(`rates[${i}]: ${x.rate}% per year is not a plausible deposit rate`);
      }
    });
  }
  if (!isNonNegOrNull(r.minAmount)) errors.push('minAmount must be a non-negative number or null');
  checkPerBank(r, errors);
  return errors;
}

/**
 * @param {unknown} record
 * @returns {string[]} Problems found; empty when the loans record is valid.
 */
export function validateLoans(record) {
  /** @type {string[]} */
  const errors = [];
  if (!isObject(record)) return ['loans record must be an object'];
  const r = record;
  if (!Array.isArray(r.products) || r.products.length === 0) {
    errors.push('products must list at least one loan');
  } else {
    r.products.forEach((p, i) => {
      if (!isObject(p)) {
        errors.push(`products[${i}] must be an object`);
        return;
      }
      if (typeof p.type !== 'string' || !LOAN_TYPES.includes(p.type)) {
        errors.push(`products[${i}].type must be one of ${LOAN_TYPES.join(', ')}`);
      }
      if (typeof p.name !== 'string' || p.name.trim() === '') {
        errors.push(`products[${i}].name is required`);
      }
      for (const key of ['rateFrom', 'fixedMonths', 'maxTermMonths', 'maxAmount']) {
        if (!(key in p) || !isNonNegOrNull(p[key])) {
          errors.push(`products[${i}].${key} must be a non-negative number or null`);
        }
      }
      if (typeof p.rateFrom === 'number' && p.rateFrom > 60) {
        errors.push(`products[${i}].rateFrom ${p.rateFrom}% per year is not plausible`);
      }
      if (p.note !== undefined && typeof p.note !== 'string') {
        errors.push(`products[${i}].note must be a string`);
      }
    });
  }
  checkPerBank(r, errors);
  return errors;
}

/**
 * Checks every record and the links between them.
 * @param {{ cards: unknown[], banks: unknown[], banking?: unknown[], savings?: unknown[],
 *   loans?: unknown[] }} data
 * @returns {string[]} Problems, each prefixed with the record it belongs to.
 */
export function validateAll({ cards, banks, banking = [], savings = [], loans = [] }) {
  /** @type {string[]} */
  const errors = [];
  const bankIds = new Set();
  banks.forEach((b, i) => {
    const id = isObject(b) && typeof b.id === 'string' ? b.id : `#${i}`;
    for (const e of validateBank(b)) errors.push(`bank ${id}: ${e}`);
    if (bankIds.has(id)) errors.push(`bank ${id}: duplicate id`);
    bankIds.add(id);
  });
  const cardIds = new Set();
  cards.forEach((c, i) => {
    const id = isObject(c) && typeof c.id === 'string' ? c.id : `#${i}`;
    for (const e of validateCard(c)) errors.push(`card ${id}: ${e}`);
    if (cardIds.has(id)) errors.push(`card ${id}: duplicate id`);
    cardIds.add(id);
    if (isObject(c) && typeof c.bank === 'string' && !bankIds.has(c.bank)) {
      errors.push(`card ${id}: unknown bank ${c.bank}`);
    }
  });
  /** @type {[string, unknown[], (r: unknown) => string[]][]} */
  const perBank = [
    ['banking', banking, validateBanking],
    ['savings', savings, validateSavings],
    ['loans', loans, validateLoans],
  ];
  for (const [label, records, validate] of perBank) {
    const ids = new Set();
    records.forEach((r, i) => {
      const id = isObject(r) && typeof r.id === 'string' ? r.id : `#${i}`;
      for (const e of validate(r)) errors.push(`${label} ${id}: ${e}`);
      if (ids.has(id)) errors.push(`${label} ${id}: duplicate id`);
      ids.add(id);
      if (isObject(r) && typeof r.bank === 'string' && !bankIds.has(r.bank)) {
        errors.push(`${label} ${id}: unknown bank ${r.bank}`);
      }
    });
  }
  return errors;
}
