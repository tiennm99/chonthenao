import { expect, test } from '@playwright/test';

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

test('the explainer compares both card kinds from the site data', async ({ page }) => {
  await page.goto('/tin-dung-hay-ghi-no/');
  await expect(page.getByRole('heading', { name: 'Thẻ tín dụng hay thẻ ghi nợ?' })).toBeVisible();
  await expect(page.getByText('Số thẻ trong dữ liệu')).toBeVisible();
  await expect(page.locator('a[href$="/the/?loai=debit"]').first()).toBeVisible();
});

test('the savings table lists banks and sorts by a term', async ({ page }) => {
  await page.goto('/tiet-kiem/');
  await expect(page.getByRole('heading', { name: 'Lãi suất tiết kiệm' })).toBeVisible();
  const rows = page.locator('table tbody tr');
  expect(await rows.count()).toBeGreaterThan(5);
  await page.getByRole('button', { name: '6 tháng', exact: true }).click();
  await expect(page.locator('th[aria-sort="descending"]')).toHaveText('6 tháng');
});

test('the loans page switches between loan types', async ({ page }) => {
  await page.goto('/vay/');
  await expect(page.getByRole('heading', { name: 'Lãi suất vay' })).toBeVisible();
  const types = page.getByRole('group', { name: 'Loại khoản vay' }).getByRole('button');
  expect(await types.count()).toBeGreaterThan(1);
  await types.nth(1).click();
  await expect(types.nth(1)).toHaveAttribute('aria-pressed', 'true');
  expect(await page.locator('table tbody tr').count()).toBeGreaterThan(0);
});

test('the bank comparison reads two banks from the link and keeps it in sync', async ({ page }) => {
  await page.goto('/so-sanh-ngan-hang/?b=acb,bidv');
  const head = page.locator('thead');
  await expect(head.getByRole('link', { name: 'ACB', exact: true })).toBeVisible();
  await expect(head.getByRole('link', { name: 'BIDV', exact: true })).toBeVisible();
  await expect(page.getByText('Chi phí ngân hàng ước tính mỗi năm')).toBeVisible();
  await page.getByLabel('Ngân hàng 3').selectOption('vib');
  await expect(page).toHaveURL(/b=acb,bidv,vib/);
});

test('the catalog kind filter keeps only debit cards', async ({ page }) => {
  await page.goto('/the/?loai=debit');
  await expect(page.getByLabel('Loại thẻ')).toHaveValue('debit');
  await expect(page.getByRole('link', { name: 'ACB Visa Debit', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'HSBC Cash Back', exact: true })).toHaveCount(0);
  await page.getByLabel('Loại thẻ').selectOption('credit');
  await expect(page.getByRole('link', { name: 'HSBC Cash Back', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'ACB Visa Debit', exact: true })).toHaveCount(0);
});

test('a debit card page marks credit-only fields as not applicable', async ({ page }) => {
  await page.goto('/the/acb-visa-debit/');
  await expect(page.getByText('Thẻ ghi nợ').first()).toBeVisible();
  await expect(page.getByText('không áp dụng').first()).toBeVisible();
});

for (const path of [
  '/',
  '/the/',
  '/the/acb-visa-debit/',
  '/so-sanh-ngan-hang/?b=acb,bidv',
  '/tin-dung-hay-ghi-no/',
  '/ngan-hang/acb/',
  '/tiet-kiem/',
  '/vay/',
]) {
  test(`no horizontal page scroll at 375px on ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(path);
    await expect(page.locator('header nav')).toBeVisible();
    // The bank comparison reads ?b= after load; measure the filled table, not the empty state.
    if (path.includes('?b=')) await expect(page.locator('thead')).toBeVisible();
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(375);
  });
}
