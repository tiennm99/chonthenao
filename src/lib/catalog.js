/**
 * Pure helpers behind the card catalog, card pages and bank pages: labels, formatting, the reward
 * that applies to a category, and filtering and sorting that never treat an unknown value as 0.
 */

/** @typedef {import('./data/schema.js').Card} Card */
/** @typedef {import('./data/schema.js').Reward} Reward */

/** @type {Record<string, string>} */
export const CATEGORY_LABELS = {
  all: 'Mọi chi tiêu',
  dining: 'Ăn uống',
  grocery: 'Siêu thị',
  online: 'Mua sắm online',
  fuel: 'Xăng dầu',
  travel: 'Du lịch',
  foreign: 'Chi tiêu nước ngoài',
  transport: 'Di chuyển',
  education: 'Giáo dục',
  health: 'Y tế, sức khỏe',
};

/** @type {Record<string, string>} */
export const NETWORK_LABELS = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  jcb: 'JCB',
  amex: 'American Express',
  napas: 'Napas',
  unionpay: 'UnionPay',
};

/** @type {Record<string, string>} */
export const REWARD_TYPE_LABELS = {
  cashback: 'Hoàn tiền',
  points: 'Điểm thưởng',
  miles: 'Dặm bay',
};

/** Text shown for a figure the bank's sources do not state. */
export const UNKNOWN = 'chưa rõ';

const vnd = new Intl.NumberFormat('vi-VN');

/**
 * @param {number|null} n
 * @returns {string}
 */
export const formatVnd = (n) =>
  n === null ? UNKNOWN : n === 0 ? 'Miễn phí' : `${vnd.format(n)} đ`;

/**
 * @param {number|null} n
 * @returns {string}
 */
export const formatPercent = (n) =>
  n === null ? UNKNOWN : `${vnd.format(Math.round(n * 100) / 100)}%`;

/**
 * Formats YYYY-MM-DD as DD/MM/YYYY from the string itself, so every time zone shows the same day.
 * @param {string} iso
 * @returns {string}
 */
export const formatDate = (iso) => iso.split('-').reverse().join('/');

/**
 * @param {string} type
 * @returns {string}
 */
const unitName = (type) => (type === 'miles' ? 'dặm' : 'điểm');

/**
 * A reward's rate as the bank publishes it: "6%" or "1 dặm / 30.000 đ".
 * @param {Reward} r
 * @returns {string}
 */
export function describeRate(r) {
  if (r.type === 'cashback') return formatPercent(r.rate);
  if (!r.earn) return UNKNOWN;
  return `${vnd.format(r.earn.units)} ${unitName(r.type)} / ${vnd.format(r.earn.perVnd)} đ`;
}

/**
 * A cap in the reward's own unit: VND for cashback, points or miles otherwise.
 * @param {number} cap
 * @param {string} type
 * @returns {string}
 */
export const formatCap = (cap, type) =>
  type === 'cashback' ? `${vnd.format(cap)} đ` : `${vnd.format(cap)} ${unitName(type)}`;

/**
 * Percent of spend a reward returns. Points and miles count only when the bank publishes what one
 * unit is worth; otherwise the value is unknown.
 * @param {Reward} r
 * @param {Card} card
 * @returns {number|null}
 */
export function effectiveRate(r, card) {
  if (r.type === 'cashback') return r.rate;
  if (!r.earn || card.pointValueVnd === null) return null;
  return ((r.earn.units * card.pointValueVnd) / r.earn.perVnd) * 100;
}

/**
 * The reward that applies to spend in a category: its own entry, else the card's base rate.
 * @param {Card} card
 * @param {string} category
 * @returns {Reward|null} null when the card earns nothing there.
 */
export function rewardFor(card, category) {
  return (
    card.rewards.find((r) => r.category === category) ??
    card.rewards.find((r) => r.category === 'all') ??
    null
  );
}

/**
 * Whether a reward comes with a cap or condition the reader must check.
 * @param {Card} card
 * @param {Reward} r
 * @returns {boolean}
 */
export const isConditional = (card, r) =>
  r.capMonth !== null ||
  Boolean(r.note) ||
  card.sharedCaps.some((c) => c.categories.includes(r.category));

/**
 * The card's highest-value reward, for the catalog row: cashback and points with a known value
 * rank by percent; miles and unvalued points come after them.
 * @param {Card} card
 * @returns {Reward|null}
 */
export function headlineReward(card) {
  if (card.rewards.length === 0) return null;
  return [...card.rewards].sort((a, b) =>
    nullsLast(effectiveRate(a, card), effectiveRate(b, card), -1),
  )[0];
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
 * @typedef {object} Filters
 * @property {string} [bank] Bank id, or '' for any.
 * @property {string} [network]
 * @property {string} [rewardType]
 * @property {number|null} [maxAnnualFee] VND; a card with an unknown fee never matches.
 * @property {boolean} [waiverOnly] Only cards with a published fee waiver.
 * @property {number|null} [myIncome] VND per month; hides cards whose published minimum is higher.
 *   A card with an unknown minimum stays listed, since the bank may still accept the reader.
 * @property {boolean} [virtualOnly]
 */

/**
 * @param {Card[]} cards
 * @param {Filters} f
 * @returns {Card[]}
 */
export function filterCards(cards, f) {
  return cards.filter(
    (c) =>
      (!f.bank || c.bank === f.bank) &&
      (!f.network || c.network === f.network) &&
      (!f.rewardType || c.rewards.some((r) => r.type === f.rewardType)) &&
      (f.maxAnnualFee == null || (c.annualFee !== null && c.annualFee <= f.maxAnnualFee)) &&
      (!f.waiverOnly || c.feeWaiver !== null) &&
      (f.myIncome == null || c.minIncome === null || c.minIncome <= f.myIncome) &&
      (!f.virtualOnly || c.virtual === true),
  );
}

/** @type {Record<string, string>} */
export const SORT_LABELS = {
  rate: 'Tỷ lệ hoàn cao nhất cho danh mục',
  annualFee: 'Phí thường niên thấp nhất',
  fxFee: 'Phí giao dịch nước ngoài thấp nhất',
  interestRate: 'Lãi suất thấp nhất',
  interestFreeDays: 'Số ngày miễn lãi nhiều nhất',
  name: 'Tên thẻ (A–Z)',
};

/**
 * Sorts a copy of the cards. Unknown values always sort last. For `rate`, a card that earns
 * nothing in the category counts as 0; one whose reward value is unknown sorts after it.
 * @param {Card[]} cards
 * @param {string} key One of the SORT_LABELS keys.
 * @param {string} [category] For `rate`: the spending category to rank by.
 * @returns {Card[]}
 */
export function sortCards(cards, key, category = 'all') {
  /**
   * @param {Card} c
   * @returns {number|null}
   */
  const rateOf = (c) => {
    const r = rewardFor(c, category);
    return r === null ? 0 : effectiveRate(r, c);
  };
  /** @type {Record<string, (a: Card, b: Card) => number>} */
  const comparators = {
    rate: (/** @type {Card} */ a, /** @type {Card} */ b) => nullsLast(rateOf(a), rateOf(b), -1),
    annualFee: (/** @type {Card} */ a, /** @type {Card} */ b) =>
      nullsLast(a.annualFee, b.annualFee, 1),
    fxFee: (/** @type {Card} */ a, /** @type {Card} */ b) => nullsLast(a.fxFee, b.fxFee, 1),
    interestRate: (/** @type {Card} */ a, /** @type {Card} */ b) =>
      nullsLast(a.interestRate, b.interestRate, 1),
    interestFreeDays: (/** @type {Card} */ a, /** @type {Card} */ b) =>
      nullsLast(a.interestFreeDays, b.interestFreeDays, -1),
    name: () => 0,
  };
  const cmp = Object.hasOwn(comparators, key) ? comparators[key] : undefined;
  if (!cmp) throw new Error(`unknown sort key: ${key}`);
  return [...cards].sort((a, b) => cmp(a, b) || a.name.localeCompare(b.name, 'vi'));
}
