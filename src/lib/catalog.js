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

/** @type {Record<string, string>} */
export const KIND_LABELS = {
  credit: 'Thẻ tín dụng',
  debit: 'Thẻ ghi nợ',
};

/** Text shown for a figure the bank's sources do not state. */
export const UNKNOWN = 'chưa rõ';

/** Text shown for a credit-only figure on a debit card. */
export const NOT_APPLICABLE = 'không áp dụng';

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
 * A credit-only figure: `null` on a debit card, which has none, else the value or null when
 * unknown. Decided by `kind`, so a credit card missing the field still reads as unknown.
 * @param {Card} card
 * @param {'interestRate'|'interestFreeDays'|'minIncome'} key
 * @returns {number|null}
 */
const creditValue = (card, key) => (card.kind === 'debit' ? null : (card[key] ?? null));

/** VAT the site adds when a fee schedule prints fees before VAT. */
export const VAT_RATE = 0.1;

/**
 * The annual fee the cardholder pays: VAT is added when the bank prints the fee before VAT.
 * @param {Card} card
 * @returns {number|null} VND, rounded; null when the fee is unknown.
 */
export const paidAnnualFee = (card) =>
  card.annualFee === null
    ? null
    : Math.round(card.feesFinal === false ? card.annualFee * (1 + VAT_RATE) : card.annualFee);

/**
 * A credit-only field as text: "không áp dụng" for a debit card, "chưa rõ" when unknown.
 * @param {Card} card
 * @param {'interestRate'|'interestFreeDays'|'minIncome'} key
 * @returns {string}
 */
export function formatCreditField(card, key) {
  if (card.kind === 'debit') return NOT_APPLICABLE;
  const n = creditValue(card, key);
  if (n === null) return UNKNOWN;
  if (key === 'interestRate') return `${formatPercent(n)}/năm`;
  if (key === 'interestFreeDays') return `${n} ngày`;
  return `${formatVnd(n)}/tháng`;
}

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
 * Puts debit cards after credit cards, for sorts on a credit-only field.
 * @param {Card} a
 * @param {Card} b
 * @returns {number}
 */
const debitLast = (a, b) => Number(a.kind === 'debit') - Number(b.kind === 'debit');

/**
 * @typedef {object} Filters
 * @property {string} [kind] `credit` or `debit`, or '' for any.
 * @property {string} [bank] Bank id, or '' for any.
 * @property {string} [network]
 * @property {string} [rewardType]
 * @property {number|null} [maxAnnualFee] VND, VAT included; a card with an unknown fee never
 *   matches.
 * @property {boolean} [waiverOnly] Only cards with a published fee waiver.
 * @property {number|null} [myIncome] VND per month; hides cards whose published minimum is higher.
 *   A card with an unknown minimum stays listed, since the bank may still accept the reader. The
 *   minimum is credit-only, so a debit card always stays listed.
 * @property {boolean} [virtualOnly]
 */

/**
 * @param {Card} c
 * @param {number} income
 * @returns {boolean}
 */
function incomeFits(c, income) {
  const min = creditValue(c, 'minIncome');
  return min === null || min <= income;
}

/**
 * @param {Card[]} cards
 * @param {Filters} f
 * @returns {Card[]}
 */
export function filterCards(cards, f) {
  return cards.filter(
    (c) =>
      (!f.kind || c.kind === f.kind) &&
      (!f.bank || c.bank === f.bank) &&
      (!f.network || c.network === f.network) &&
      (!f.rewardType || c.rewards.some((r) => r.type === f.rewardType)) &&
      (f.maxAnnualFee == null || (paidAnnualFee(c) ?? Infinity) <= f.maxAnnualFee) &&
      (!f.waiverOnly || c.feeWaiver !== null) &&
      (f.myIncome == null || incomeFits(c, f.myIncome)) &&
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
 * Sorts a copy of the cards. Unknown values always sort last; on a credit-only key, debit cards
 * sort after them. For `rate`, a card that earns
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
      nullsLast(paidAnnualFee(a), paidAnnualFee(b), 1),
    fxFee: (/** @type {Card} */ a, /** @type {Card} */ b) => nullsLast(a.fxFee, b.fxFee, 1),
    interestRate: (/** @type {Card} */ a, /** @type {Card} */ b) =>
      debitLast(a, b) ||
      nullsLast(creditValue(a, 'interestRate'), creditValue(b, 'interestRate'), 1),
    interestFreeDays: (/** @type {Card} */ a, /** @type {Card} */ b) =>
      debitLast(a, b) ||
      nullsLast(creditValue(a, 'interestFreeDays'), creditValue(b, 'interestFreeDays'), -1),
    name: () => 0,
  };
  const cmp = Object.hasOwn(comparators, key) ? comparators[key] : undefined;
  if (!cmp) throw new Error(`unknown sort key: ${key}`);
  return [...cards].sort((a, b) => cmp(a, b) || a.name.localeCompare(b.name, 'vi'));
}

/**
 * @typedef {object} KindStats
 * @property {number} count
 * @property {number} banks How many banks issue a card of this kind.
 * @property {number|null} minAnnualFee Lowest known annual fee the cardholder pays (VAT included),
 *   VND; null when none is known.
 * @property {number|null} maxAnnualFee Highest known annual fee, VND.
 * @property {number} freeAnnualFee Cards whose known annual fee is 0.
 * @property {number} knownAnnualFee Cards whose annual fee is known.
 * @property {number} withRewards Cards that publish any reward.
 * @property {number|null} bestCashback Highest published cashback rate in any category, percent.
 * @property {number|null} minFxFee Lowest known total foreign-purchase fee, percent.
 * @property {number|null} maxFxFee Highest known total foreign-purchase fee, percent.
 * @property {number|null} minInterestRate Lowest known interest rate, percent per year; null for
 *   debit cards, which have none.
 * @property {number|null} maxInterestRate Highest known interest rate.
 * @property {number|null} maxInterestFreeDays Longest published interest-free period, days.
 * @property {number} virtual Cards with a virtual card (`virtual === true`).
 * @property {number} virtualUnknown Cards whose sources do not say.
 */

/**
 * Summary figures for one kind of card, from the card data only. Unknown values never count as 0
 * or "no": ranges and the best rate use known values, and counts of unknowns are kept apart.
 * @param {Card[]} cards
 * @param {'credit'|'debit'} kind
 * @returns {KindStats}
 */
export function kindStats(cards, kind) {
  const of = cards.filter((c) => c.kind === kind);
  /**
   * @param {(number|null)[]} xs
   * @returns {number[]}
   */
  const known = (xs) => xs.filter((x) => x !== null);
  const fees = known(of.map(paidAnnualFee));
  const fx = known(of.map((c) => c.fxFee));
  const interest = known(of.map((c) => creditValue(c, 'interestRate')));
  const freeDays = known(of.map((c) => creditValue(c, 'interestFreeDays')));
  const cashback = known(
    of.flatMap((c) => c.rewards.filter((r) => r.type === 'cashback').map((r) => r.rate)),
  );
  /**
   * @param {number[]} xs
   * @param {(...n: number[]) => number} pick
   * @returns {number|null}
   */
  const range = (xs, pick) => (xs.length === 0 ? null : pick(...xs));
  return {
    count: of.length,
    banks: new Set(of.map((c) => c.bank)).size,
    minAnnualFee: range(fees, Math.min),
    maxAnnualFee: range(fees, Math.max),
    freeAnnualFee: fees.filter((x) => x === 0).length,
    knownAnnualFee: fees.length,
    withRewards: of.filter((c) => c.rewards.length > 0).length,
    bestCashback: range(cashback, Math.max),
    minFxFee: range(fx, Math.min),
    maxFxFee: range(fx, Math.max),
    minInterestRate: range(interest, Math.min),
    maxInterestRate: range(interest, Math.max),
    maxInterestFreeDays: range(freeDays, Math.max),
    virtual: of.filter((c) => c.virtual === true).length,
    virtualUnknown: of.filter((c) => c.virtual === null).length,
  };
}
