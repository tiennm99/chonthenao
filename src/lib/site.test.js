import { describe, expect, it } from 'vitest';
import { ISSUES_NEW_URL, reportIssueUrl } from './site.js';

describe('reportIssueUrl', () => {
  it('prefills a GitHub issue with the subject and page', () => {
    const url = new URL(
      reportIssueUrl('HSBC Cash Back', 'https://example.com/the/hsbc-cash-back/'),
    );
    expect(`${url.origin}${url.pathname}`).toBe(ISSUES_NEW_URL);
    expect(url.searchParams.get('title')).toBe('Báo sai: HSBC Cash Back');
    expect(url.searchParams.get('body')).toContain('https://example.com/the/hsbc-cash-back/');
  });
});
