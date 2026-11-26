/**
 * All data records, one JSON file each under ./cards, ./banks, ./banking, ./savings and ./loans.
 * Records are loaded at build time; the pages are prerendered from them.
 */

/** @typedef {import('./schema.js').Card} Card */
/** @typedef {import('./schema.js').Bank} Bank */
/** @typedef {import('./schema.js').Banking} Banking */
/** @typedef {import('./schema.js').Savings} Savings */
/** @typedef {import('./schema.js').Loans} Loans */

const cardModules = import.meta.glob('./cards/*.json', { eager: true, import: 'default' });
const bankModules = import.meta.glob('./banks/*.json', { eager: true, import: 'default' });
const bankingModules = import.meta.glob('./banking/*.json', { eager: true, import: 'default' });
const savingsModules = import.meta.glob('./savings/*.json', { eager: true, import: 'default' });
const loansModules = import.meta.glob('./loans/*.json', { eager: true, import: 'default' });

/** @type {Card[]} */
export const cards = /** @type {Card[]} */ (Object.values(cardModules));
/** @type {Bank[]} */
export const banks = /** @type {Bank[]} */ (Object.values(bankModules));

/** @type {Banking[]} Everyday banking fees, one record per bank that has one. */
export const banking = /** @type {Banking[]} */ (Object.values(bankingModules));
/** @type {Savings[]} Term-deposit rates, one record per bank that has one. */
export const savings = /** @type {Savings[]} */ (Object.values(savingsModules));
/** @type {Loans[]} Loan rates, one record per bank that has one. */
export const loans = /** @type {Loans[]} */ (Object.values(loansModules));

/** Banking records by bank id. */
export const bankingByBank = new Map(banking.map((r) => [r.bank, r]));
/** Savings records by bank id. */
export const savingsByBank = new Map(savings.map((r) => [r.bank, r]));
/** Loans records by bank id. */
export const loansByBank = new Map(loans.map((r) => [r.bank, r]));

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
