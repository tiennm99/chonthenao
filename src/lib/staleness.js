/** Days after `lastVerified` before a card, bank or banking-fee record may be out of date. */
export const STALE_AFTER_DAYS = 90;

/** Savings and loan rates change often, so their records are flagged sooner. */
export const RATE_STALE_AFTER_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Whether a record last checked on `lastVerified` (YYYY-MM-DD) may be out of date.
 * Runs in the browser with the visitor's clock, so the badge never freezes at build time.
 * @param {string} lastVerified
 * @param {Date} [now]
 * @param {number} [days]
 * @returns {boolean}
 */
export function isStale(lastVerified, now = new Date(), days = STALE_AFTER_DAYS) {
  const checked = Date.parse(`${lastVerified}T00:00:00Z`);
  if (Number.isNaN(checked)) return true;
  return now.getTime() - checked > days * DAY_MS;
}
