/**
 * All card and bank records, one JSON file each under ./cards and ./banks.
 * Records are loaded at build time; the pages are prerendered from them.
 */

/** @typedef {import('./schema.js').Card} Card */
/** @typedef {import('./schema.js').Bank} Bank */

const cardModules = import.meta.glob('./cards/*.json', { eager: true, import: 'default' });
const bankModules = import.meta.glob('./banks/*.json', { eager: true, import: 'default' });

/** @type {Card[]} */
export const cards = /** @type {Card[]} */ (Object.values(cardModules));
/** @type {Bank[]} */
export const banks = /** @type {Bank[]} */ (Object.values(bankModules));

/** Banks by id. */
export const bankById = new Map(banks.map((b) => [b.id, b]));

/** Cards by id. */
export const cardById = new Map(cards.map((c) => [c.id, c]));

/**
 * @param {string} bankId
 * @returns {Card[]} The bank's cards, by name.
 */
export const cardsOfBank = (bankId) =>
  cards.filter((c) => c.bank === bankId).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
