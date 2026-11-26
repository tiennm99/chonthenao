import { describe, expect, it } from 'vitest';
import { RATE_STALE_AFTER_DAYS, isStale } from './staleness.js';

describe('isStale', () => {
  const now = new Date('2026-11-25T12:00:00Z');

  it('keeps a record checked within 90 days fresh', () => {
    expect(isStale('2026-09-01', now)).toBe(false);
  });

  it('flags a record checked more than 90 days ago', () => {
    expect(isStale('2026-08-01', now)).toBe(true);
  });

  it('flags an unparseable date', () => {
    expect(isStale('not-a-date', now)).toBe(true);
  });

  it('flags rate records after 30 days', () => {
    expect(RATE_STALE_AFTER_DAYS).toBe(30);
    expect(isStale('2026-11-01', now, RATE_STALE_AFTER_DAYS)).toBe(false);
    expect(isStale('2026-10-20', now, RATE_STALE_AFTER_DAYS)).toBe(true);
  });
});
