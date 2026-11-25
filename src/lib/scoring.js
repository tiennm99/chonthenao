/**
 * Estimates a card's yearly value for one spending profile: rewards earned minus the annual fee and
 * foreign transaction fees. It reads card records and the profile only, never bank records, so a
 * referral link can never change a result. Every figure it returns comes with its math.
 */

import { CATEGORY_LABELS } from './catalog.js';

/** @typedef {import('./data/schema.js').Card} Card */
/** @typedef {import('./data/schema.js').Reward} Reward */

/**
 * VND value the site assumes for one Lotusmiles mile, since no bank publishes one: a domestic
 * economy award ticket (11.000 to 15.000 miles Hà Nội – TP.HCM on Vietnam Airlines' award chart)
 * against the airline's published cash fare gives about 60 to 136 đ per mile, before the taxes and
 * fees an award still costs. Shown as an assumption on the result page, where the reader can change
 * it. Sources: docs/questionnaire.md.
 */
export const ASSUMED_MILE_VND = 100;

/** VAT the site adds when a fee schedule prints fees before VAT. */
export const VAT_RATE = 0.1;

/**
 * @typedef {object} Profile
 * @property {Record<string, number>} spend Domestic VND per month by category; `all` is spend
 *   outside the listed categories.
 * @property {number} foreign VND per month spent in foreign currency abroad.
 */

/**
 * @typedef {object} Line
 * @property {string} label
 * @property {number} amount VND per year; negative for costs.
 * @property {string} [note]
 */

/**
 * @typedef {object} Score
 * @property {Card} card
 * @property {number|null} rewards VND per year, or null when a reward's value is unknown.
 * @property {number|null} cost Annual fee plus foreign fees, VND per year, or null when unknown.
 * @property {number|null} net rewards minus cost, or null when either is unknown.
 * @property {Line[]} lines The math, one line per reward group and cost.
 * @property {string[]} flags Short warnings the reader must see beside the result.
 * @property {boolean} expired The published reward terms have ended, so the rates may be gone.
 */

/**
 * VND value of one unit of a reward.
 * @param {Reward} r
 * @param {Card} card
 * @param {number} mileVnd
 * @returns {number|null}
 */
function unitValue(r, card, mileVnd) {
  if (r.type === 'cashback') return 1;
  if (card.pointValueVnd !== null) return card.pointValueVnd;
  return r.type === 'miles' ? mileVnd : null;
}

/**
 * Units a reward earns on an amount: VND for cashback, points or miles otherwise.
 * @param {Reward} r
 * @param {number} vnd
 * @returns {number}
 */
function earned(r, vnd) {
  if (r.type === 'cashback') return (vnd * (r.rate ?? 0)) / 100;
  return r.earn ? (vnd * r.earn.units) / r.earn.perVnd : 0;
}

/**
 * Which reward each spend bucket lands on. A card limited to N bonus categories uses the N that
 * earn the reader the most; the rest fall back to the base rate.
 * @param {Card} card
 * @param {Profile} p
 * @param {number} mileVnd
 * @returns {Map<Reward, number>} VND per month routed to each reward.
 */
function route(card, p, mileVnd) {
  const base = card.rewards.find((r) => r.category === 'all') ?? null;
  /** @type {[string, number][]} */
  const buckets = [...Object.entries(p.spend), ['foreign', p.foreign]];
  /** @type {{ r: Reward, vnd: number, value: number }[]} */
  const bonus = [];
  /** @type {Map<Reward, number>} */
  const routed = new Map();
  const add = (/** @type {Reward|null} */ r, /** @type {number} */ vnd) => {
    if (r && vnd > 0) routed.set(r, (routed.get(r) ?? 0) + vnd);
  };
  for (const [category, vnd] of buckets) {
    if (vnd <= 0) continue;
    const own = category === 'all' ? null : card.rewards.find((r) => r.category === category);
    if (own) {
      bonus.push({ r: own, vnd, value: earned(own, vnd) * (unitValue(own, card, mileVnd) ?? 0) });
    } else {
      add(base, vnd);
    }
  }
  bonus.sort((a, b) => b.value - a.value);
  bonus.forEach((b, i) => {
    const usable = card.maxCategories === null || i < card.maxCategories;
    add(usable ? b.r : base, b.vnd);
  });
  return routed;
}

/**
 * Scores one card for one profile.
 * @param {Card} card
 * @param {Profile} p
 * @param {{ mileVnd?: number, today?: string }} [opts] `today` is YYYY-MM-DD.
 * @returns {Score}
 */
export function scoreCard(card, p, { mileVnd = ASSUMED_MILE_VND, today = '' } = {}) {
  /** @type {Line[]} */
  const lines = [];
  /** @type {string[]} */
  const flags = [];
  const total = Object.values(p.spend).reduce((a, b) => a + b, 0) + p.foreign;

  /** @type {number|null} */
  let rewards = 0;
  if (card.minSpendMonth !== null && total < card.minSpendMonth) {
    flags.push(
      `Chưa đạt chi tiêu tối thiểu ${fmt(card.minSpendMonth)}/tháng nên không được hoàn hay tích điểm.`,
    );
  } else {
    const routed = route(card, p, mileVnd);
    /** @type {Map<Reward, number>} units per month after each reward's own cap */
    const units = new Map();
    for (const [r, vnd] of routed) {
      const u = earned(r, vnd);
      units.set(r, r.capMonth === null ? u : Math.min(u, r.capMonth));
    }
    // A shared cap trims its rewards in proportion to what each earned.
    for (const cap of card.sharedCaps) {
      const inCap = [...units.keys()].filter((r) => cap.categories.includes(r.category));
      const sum = inCap.reduce((a, r) => a + (units.get(r) ?? 0), 0);
      if (sum > cap.capMonth) {
        for (const r of inCap) units.set(r, ((units.get(r) ?? 0) * cap.capMonth) / sum);
      }
    }
    for (const [r, u] of units) {
      const v = unitValue(r, card, mileVnd);
      const vnd = routed.get(r) ?? 0;
      if (v === null) {
        rewards = null;
        continue;
      }
      const yearly = Math.round(u * v * 12);
      if (rewards !== null) rewards += yearly;
      lines.push({
        label: `${CATEGORY_LABELS[r.category]}: ${fmt(vnd)}/tháng`,
        amount: yearly,
        ...(r.note ? { note: r.note } : {}),
      });
      if (r.type === 'miles' && card.pointValueVnd === null) {
        flags.push(
          mileVnd === ASSUMED_MILE_VND
            ? `Giá trị dặm là giả định của trang: ${fmt(mileVnd)}/dặm, ước tính từ vé thưởng phổ thông nội địa của Vietnam Airlines so với giá vé mua bằng tiền, chưa trừ thuế, phí bạn vẫn phải trả; bạn có thể đổi con số này.`
            : `Giá trị dặm do bạn nhập: ${fmt(mileVnd)}/dặm.`,
        );
      }
    }
    if (card.maxCategories !== null) {
      flags.push(
        `Mỗi lúc chỉ dùng được ${card.maxCategories} danh mục ưu đãi; đã chọn danh mục có lợi nhất cho bạn.`,
      );
    }
  }
  if (card.rewardsUntil !== null && today) {
    flags.push(
      card.rewardsUntil < today
        ? `Thể lệ ưu đãi đã hết hạn ngày ${card.rewardsUntil.split('-').reverse().join('/')}; mức hoàn có thể đã thay đổi.`
        : `Mức ưu đãi chỉ áp dụng đến ${card.rewardsUntil.split('-').reverse().join('/')}.`,
    );
  }

  /** @type {number|null} */
  let cost = 0;
  if (card.annualFee === null) {
    cost = null;
    flags.push('Phí thường niên chưa rõ.');
  } else {
    const fee = card.feesFinal === false ? card.annualFee * (1 + VAT_RATE) : card.annualFee;
    const waived =
      card.feeWaiver?.minSpendYear != null && total * 12 >= card.feeWaiver.minSpendYear;
    const charged = waived ? 0 : Math.round(fee);
    cost += charged;
    lines.push({
      label: waived ? 'Phí thường niên (được miễn từ năm 2 nhờ đủ chi tiêu)' : 'Phí thường niên',
      amount: -charged,
      ...(card.feesFinal === false && !waived ? { note: 'Đã cộng 10% VAT.' } : {}),
    });
  }
  if (p.foreign > 0) {
    if (card.fxFee === null) {
      cost = null;
      flags.push('Phí giao dịch nước ngoài chưa rõ.');
    } else {
      const fx = Math.round((p.foreign * 12 * card.fxFee) / 100);
      if (cost !== null) cost += fx;
      lines.push({ label: `Phí giao dịch nước ngoài ${card.fxFee}%`, amount: -fx });
    }
  }
  const net = rewards === null || cost === null ? null : rewards - cost;
  const expired = card.rewardsUntil !== null && today !== '' && card.rewardsUntil < today;
  return { card, rewards, cost, net, lines, flags: [...new Set(flags)], expired };
}

const vnd = new Intl.NumberFormat('vi-VN');

/**
 * @param {number} n
 * @returns {string}
 */
const fmt = (n) => `${vnd.format(Math.round(n))} đ`;

/**
 * Ranks scores: highest net value first, or lowest cost first then highest net. Cards whose
 * reward terms have expired come after the rest; unknowns go last; ties break by name.
 * @param {Score[]} scores
 * @param {'net'|'cost'} by
 * @returns {Score[]}
 */
export function rank(scores, by = 'net') {
  const key = (/** @type {Score} */ s) => (by === 'net' ? s.net : s.cost === null ? null : -s.cost);
  return [...scores].sort((a, b) => {
    if (a.expired !== b.expired) return a.expired ? 1 : -1;
    const ka = key(a);
    const kb = key(b);
    if (ka === null || kb === null) {
      if (ka !== kb) return ka === null ? 1 : -1;
    } else if (kb !== ka) {
      return kb - ka;
    }
    return by === 'cost' && a.net !== null && b.net !== null && a.net !== b.net
      ? b.net - a.net
      : cmpName(a, b);
  });
}

/**
 * @param {Score} a
 * @param {Score} b
 * @returns {number}
 */
const cmpName = (a, b) => a.card.name.localeCompare(b.card.name, 'vi');
