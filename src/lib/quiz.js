/**
 * The "Tìm thẻ cho tôi" questionnaire: at most 20 questions of 2 to 4 answers each. Questions that
 * cannot change the result are skipped, and the quiz ends as soon as one card or none is left.
 */

import { CATEGORY_LABELS } from './catalog.js';
import { rank, scoreCard } from './scoring.js';

/** @typedef {import('./data/schema.js').Card} Card */
/** @typedef {Record<string, string>} Answers Question id to the chosen option value. */

/**
 * @typedef {object} Option
 * @property {string} value
 * @property {string} label
 */

/**
 * @typedef {object} Question
 * @property {string} id
 * @property {string} text
 * @property {string} [help]
 * @property {Option[] | ((ctx: Context) => Option[])} options
 * @property {(ctx: Context) => boolean} [when] Asked only when this returns true.
 */

/**
 * @typedef {object} Context
 * @property {Answers} answers
 * @property {Card[]} candidates Cards still eligible under the answers so far.
 * @property {Card[]} cards Every card.
 * @property {(id: string) => string} bankName
 */

/** Spend brackets: the label, and the VND per month the estimate uses. */
export const SPEND = {
  lt5: { label: 'Dưới 5 triệu', vnd: 3_000_000 },
  '5to10': { label: '5 – 10 triệu', vnd: 7_500_000 },
  '10to20': { label: '10 – 20 triệu', vnd: 15_000_000 },
  gt20: { label: 'Trên 20 triệu', vnd: 30_000_000 },
};

/** Income brackets in VND per month. */
export const INCOME = {
  lt7: { label: 'Dưới 7 triệu', min: 0, max: 7_000_000 },
  '7to10': { label: '7 – 10 triệu', min: 7_000_000, max: 10_000_000 },
  '10to20': { label: '10 – 20 triệu', min: 10_000_000, max: 20_000_000 },
  gt20: { label: 'Trên 20 triệu', min: 20_000_000, max: Infinity },
};

/** Share of total monthly spend per answer to a category question. */
export const SHARE = { none: 0, some: 0.1, lots: 0.3 };
/** Share of total monthly spend paid in foreign currency abroad. */
export const FOREIGN_SHARE = { none: 0, some: 0.03, lots: 0.15 };

/** Categories asked about, in order; each is skipped when no remaining card rewards it. */
export const ASKED_CATEGORIES = [
  'online',
  'grocery',
  'dining',
  'travel',
  'transport',
  'education',
  'health',
  'fuel',
];

const notRevolving = (/** @type {Context} */ c) => c.answers.goal !== 'revolve';

/** @type {Question[]} */
export const QUESTIONS = [
  {
    id: 'goal',
    text: 'Bạn muốn thẻ tín dụng giúp mình điều gì nhất?',
    options: [
      { value: 'cashback', label: 'Hoàn tiền khi chi tiêu' },
      { value: 'miles', label: 'Tích dặm bay' },
      { value: 'lowFee', label: 'Tốn ít phí nhất' },
      { value: 'revolve', label: 'Tôi thường không trả hết dư nợ mỗi tháng' },
    ],
  },
  {
    id: 'income',
    text: 'Thu nhập hằng tháng của bạn khoảng bao nhiêu?',
    help: 'Ngân hàng xét thu nhập tối thiểu khi mở thẻ.',
    options: Object.entries(INCOME).map(([value, b]) => ({ value, label: b.label })),
  },
  {
    id: 'spend',
    text: 'Mỗi tháng bạn định chi tiêu qua thẻ khoảng bao nhiêu?',
    options: Object.entries(SPEND).map(([value, b]) => ({ value, label: b.label })),
    when: notRevolving,
  },
  {
    id: 'foreign',
    text: 'Bạn có chi tiêu bằng ngoại tệ ở nước ngoài (du lịch, mua hàng quốc tế) không?',
    options: [
      { value: 'none', label: 'Hầu như không' },
      { value: 'some', label: 'Vài lần mỗi năm' },
      { value: 'lots', label: 'Thường xuyên' },
    ],
    when: notRevolving,
  },
  ...ASKED_CATEGORIES.map(
    (category) =>
      /** @type {Question} */ ({
        id: `cat-${category}`,
        text: `Trong số đó, bạn chi cho ${CATEGORY_LABELS[category].toLowerCase()} (trong nước) nhiều không?`,
        options: [
          { value: 'none', label: 'Gần như không' },
          { value: 'some', label: 'Một ít (khoảng 10%)' },
          { value: 'lots', label: 'Khá nhiều (khoảng 30%)' },
        ],
        when: (c) =>
          notRevolving(c) &&
          c.answers.goal !== 'lowFee' &&
          c.candidates.some((card) => card.rewards.some((r) => r.category === category)),
      }),
  ),
  {
    id: 'virtual',
    text: 'Bạn có cần thẻ ảo để dùng ngay khi mở thẻ không?',
    options: [
      { value: 'need', label: 'Có, cần dùng ngay' },
      { value: 'any', label: 'Không quan trọng' },
    ],
    when: (c) =>
      notRevolving(c) &&
      c.candidates.some((card) => card.virtual === true) &&
      c.candidates.some((card) => card.virtual !== true),
  },
  {
    id: 'bank',
    text: 'Bạn đang dùng ngân hàng nào trong số này?',
    help: 'Mở thẻ ở ngân hàng đang dùng thường tiện hơn. Câu trả lời không làm thay đổi thứ hạng.',
    options: (c) => [
      ...topBanks(c).map((id) => ({ value: id, label: c.bankName(id) })),
      { value: 'none', label: 'Không ngân hàng nào' },
    ],
    when: (c) => notRevolving(c) && topBanks(c).length >= 2,
  },
];

/**
 * The issuers of the current top cards, at most three.
 * @param {Context} c
 * @returns {string[]}
 */
function topBanks(c) {
  const ids = results(c.answers, c.candidates).map((s) => s.card.bank);
  return [...new Set(ids)].slice(0, 3);
}

/**
 * Cards that suit the answers so far.
 * @param {Answers} a
 * @param {Card[]} cards
 * @returns {Card[]}
 */
export function candidatesFor(a, cards) {
  const income = a.income ? INCOME[/** @type {keyof typeof INCOME} */ (a.income)] : null;
  return cards.filter((c) => {
    if (a.goal === 'miles' && !c.rewards.some((r) => r.type === 'miles')) return false;
    if (
      a.goal === 'cashback' &&
      !c.rewards.some(
        (r) => r.type === 'cashback' || (r.type === 'points' && c.pointValueVnd !== null),
      )
    ) {
      return false;
    }
    if (income && c.minIncome !== null && c.minIncome > income.max) return false;
    if (a.virtual === 'need' && c.virtual !== true) return false;
    return true;
  });
}

/**
 * The next question to ask, or null when the quiz is done.
 * @param {Answers} answers
 * @param {Card[]} cards
 * @param {(id: string) => string} bankName
 * @returns {{ question: Question, options: Option[] } | null}
 */
export function nextQuestion(answers, cards, bankName) {
  const candidates = candidatesFor(answers, cards);
  if ('goal' in answers && candidates.length <= 1) return null;
  /** @type {Context} */
  const ctx = { answers, candidates, cards, bankName };
  for (const q of QUESTIONS) {
    if (q.id in answers) continue;
    if (q.when && !q.when(ctx)) continue;
    const options = typeof q.options === 'function' ? q.options(ctx) : q.options;
    return { question: q, options };
  }
  return null;
}

/**
 * Turns the answers into a monthly spending profile. Category shares above 90% of the total are
 * scaled down; whatever is left counts as other spend.
 * @param {Answers} a
 * @returns {import('./scoring.js').Profile}
 */
export function profileFor(a) {
  const total = SPEND[/** @type {keyof typeof SPEND} */ (a.spend)]?.vnd ?? 0;
  const foreignShare = FOREIGN_SHARE[/** @type {keyof typeof FOREIGN_SHARE} */ (a.foreign)] ?? 0;
  /** @type {Record<string, number>} */
  const shares = {};
  for (const category of ASKED_CATEGORIES) {
    const s = SHARE[/** @type {keyof typeof SHARE} */ (a[`cat-${category}`])] ?? 0;
    if (s > 0) shares[category] = s;
  }
  const sum = Object.values(shares).reduce((x, y) => x + y, 0) + foreignShare;
  const scale = sum > 0.9 ? 0.9 / sum : 1;
  /** @type {Record<string, number>} */
  const spend = {};
  for (const [k, s] of Object.entries(shares)) spend[k] = Math.round(total * s * scale);
  spend.all = Math.round(total * (1 - sum * scale));
  return { spend, foreign: Math.round(total * foreignShare * scale) };
}

/**
 * Ranked results for the answers. A reader who carries a balance gets cards by interest rate,
 * since interest outweighs any reward.
 * @param {Answers} answers
 * @param {Card[]} candidates
 * @param {{ mileVnd?: number, today?: string }} [opts]
 * @returns {import('./scoring.js').Score[]}
 */
export function results(answers, candidates, opts = {}) {
  const p = profileFor(answers);
  const scores = candidates.map((c) => scoreCard(c, p, opts));
  if (answers.goal === 'revolve') {
    return [...scores].sort(
      (a, b) =>
        (a.card.interestRate ?? Infinity) - (b.card.interestRate ?? Infinity) ||
        a.card.name.localeCompare(b.card.name, 'vi'),
    );
  }
  return rank(scores, answers.goal === 'lowFee' ? 'cost' : 'net');
}

/**
 * Income warning for a card: the bracket's lower bound is below the card's published minimum.
 * @param {Answers} a
 * @param {Card} card
 * @returns {string|null}
 */
export function incomeWarning(a, card) {
  const income = a.income ? INCOME[/** @type {keyof typeof INCOME} */ (a.income)] : null;
  if (!income || card.minIncome === null || card.minIncome <= income.min) return null;
  return `Cần thu nhập từ ${new Intl.NumberFormat('vi-VN').format(card.minIncome)} đ/tháng; hãy kiểm tra bạn có đủ không.`;
}
