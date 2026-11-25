import { expect, test } from '@playwright/test';
import { REFERRAL_NOTE } from '../src/lib/site.js';

/** @type {string[]} */
let errors = [];

test.beforeEach(({ page }) => {
  errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
});

test.afterEach(() => {
  expect(errors).toEqual([]);
});

test('compare reads cards from the link and keeps the link in sync', async ({ page }) => {
  await page.goto('/so-sanh/?the=hsbc-cash-back,vpbank-stepup');
  const head = page.locator('thead');
  await expect(head.getByRole('link', { name: 'HSBC Cash Back' })).toBeVisible();
  await expect(head.getByRole('link', { name: 'VPBank StepUp' })).toBeVisible();
  await page.getByLabel('Thẻ 3').selectOption('tpbank-evo');
  await expect(page).toHaveURL(/the=hsbc-cash-back,vpbank-stepup,tpbank-evo/);
});

test('a referral link is labelled and carries the note', async ({ page }) => {
  await page.goto('/ngan-hang/techcombank/');
  await expect(page.getByText('Link giới thiệu:', { exact: true })).toBeVisible();
  await expect(page.getByText(REFERRAL_NOTE)).toBeVisible();
});

test('the report link opens a prefilled GitHub issue', async ({ page }) => {
  await page.goto('/the/hsbc-cash-back/');
  const href = await page
    .getByRole('link', { name: 'Báo thông tin sai hoặc đã cũ' })
    .getAttribute('href');
  const url = new URL(href ?? '');
  expect(url.pathname).toBe('/tiennm99/chonthenao/issues/new');
  expect(url.searchParams.get('title')).toBe('Báo sai: HSBC Cash Back');
});

test('cards not checked for 90 days show the stale badge', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2030-01-01T00:00:00Z'));
  await page.goto('/the/hsbc-cash-back/');
  await expect(page.getByText('có thể đã cũ', { exact: true })).toBeVisible();
});
