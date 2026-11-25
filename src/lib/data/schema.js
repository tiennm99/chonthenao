/**
 * Shape checks for the card and bank data files. Unknown figures are `null`, never guessed;
 * every record must name its sources and the date they were last checked.
 */

export const NETWORKS = ['visa', 'mastercard', 'jcb', 'amex', 'napas', 'unionpay'];
export const REWARD_TYPES = ['cashback', 'points', 'miles'];
/** Spending categories the quiz asks about; `all` is the base rate for any spend. */
export const CATEGORIES = ['all', 'dining', 'grocery', 'online', 'fuel', 'travel', 'foreign'];

const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * @typedef {object} Reward
 * @property {string} category
 * @property {string} type
 * @property {number} rate Percent of spend, or points or miles per 100 VND spent.
 * @property {number|null} capMonth Monthly cap in VND of reward, or null when none or unknown.
 * @property {string} [note]
 */

/**
 * @typedef {object} Card
 * @property {string} id
 * @property {string} bank Bank id.
 * @property {string} name
 * @property {string} network
 * @property {string|null} tier
 * @property {number|null} issuanceFee VND.
 * @property {number|null} annualFee VND per year.
 * @property {{ text: string, minSpendYear: number|null }|null} feeWaiver
 * @property {Reward[]} rewards
 * @property {number|null} fxFee Percent.
 * @property {number|null} interestRate Percent per year.
 * @property {number|null} interestFreeDays
 * @property {number|null} minIncome VND per month.
 * @property {boolean|null} virtual
 * @property {string[]} perks
 * @property {string[]} sourceUrls
 * @property {string} lastVerified YYYY-MM-DD.
 */

/**
 * @typedef {object} Referral
 * @property {string} url
 * @property {string|null} code
 * @property {string} note
 */

/**
 * @typedef {object} Bank
 * @property {string} id
 * @property {string} name
 * @property {string} shortName
 * @property {string} officialUrl
 * @property {string|null} cardsUrl The bank's credit card listing page.
 * @property {string|null} feeScheduleUrl The bank's fee schedule (biểu phí) landing page.
 * @property {Referral|null} referral
 * @property {string[]} sourceUrls
 * @property {string} lastVerified
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
  if (typeof c.network !== 'string' || !NETWORKS.includes(c.network)) {
    errors.push(`network must be one of ${NETWORKS.join(', ')}`);
  }
  if (c.tier !== null && typeof c.tier !== 'string') errors.push('tier must be a string or null');
  for (const key of [
    'issuanceFee',
    'annualFee',
    'fxFee',
    'interestRate',
    'interestFreeDays',
    'minIncome',
  ]) {
    if (!isNonNegOrNull(c[key])) errors.push(`${key} must be a non-negative number or null`);
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
      if (
        !isObject(r) ||
        typeof r.category !== 'string' ||
        !CATEGORIES.includes(r.category) ||
        typeof r.type !== 'string' ||
        !REWARD_TYPES.includes(r.type) ||
        typeof r.rate !== 'number' ||
        !(r.rate >= 0) ||
        !isNonNegOrNull(r.capMonth)
      ) {
        errors.push(`rewards[${i}] needs a known category and type, a rate and capMonth`);
      }
    });
  }
  if (c.virtual !== null && typeof c.virtual !== 'boolean') {
    errors.push('virtual must be true, false or null');
  }
  if (!Array.isArray(c.perks) || !c.perks.every((p) => typeof p === 'string')) {
    errors.push('perks must be an array of strings');
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
  if (b.referral !== null) {
    const r = b.referral;
    if (
      !isObject(r) ||
      !isHttpsUrl(r.url) ||
      (r.code !== null && typeof r.code !== 'string') ||
      typeof r.note !== 'string'
    ) {
      errors.push('referral must be null or { url, code, note }');
    }
  }
  checkProvenance(b, errors);
  return errors;
}

/**
 * Checks every record and the links between them.
 * @param {{ cards: unknown[], banks: unknown[] }} data
 * @returns {string[]} Problems, each prefixed with the record it belongs to.
 */
export function validateAll({ cards, banks }) {
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
  return errors;
}
