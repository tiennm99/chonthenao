import { expect, test } from '@playwright/test';
import { SUGGESTION_DISCLAIMER } from '../src/lib/site.js';

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

test('a miles goal ends after one question with the only miles card', async ({ page }) => {
  await page.goto('/goi-y/');
  await page.getByRole('button', { name: 'Tích dặm bay' }).click();
  await expect(page.getByText(SUGGESTION_DISCLAIMER)).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Vietnam Airlines Techcombank Visa Platinum' }).first(),
  ).toBeVisible();
  await expect(page.getByText(/giả định/).first()).toBeVisible();
});

test('a cashback walk-through reaches a ranked result and can go back', async ({ page }) => {
  await page.goto('/goi-y/');
  await page.getByRole('button', { name: 'Hoàn tiền khi chi tiêu' }).click();
  await page.getByRole('button', { name: '10 – 20 triệu' }).click();
  await page.getByRole('button', { name: '10 – 20 triệu' }).click();
  await page.getByRole('button', { name: 'Hầu như không' }).click();
  await expect(page.getByText('Câu 5')).toBeVisible();
  await page.getByRole('button', { name: 'Quay lại' }).click();
  await expect(page.getByText('Câu 4')).toBeVisible();
  await page.getByRole('button', { name: 'Hầu như không' }).click();
  await page.getByRole('button', { name: 'Xem kết quả ngay' }).click();
  await expect(page.getByText(SUGGESTION_DISCLAIMER)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Gợi ý cho bạn' })).toBeVisible();
  await expect(page.locator('ol > li')).toHaveCount(5);
});

test('a reader who carries a balance sees the interest warning', async ({ page }) => {
  await page.goto('/goi-y/');
  await page.getByRole('button', { name: /không trả hết dư nợ/ }).click();
  await page.getByRole('button', { name: 'Trên 20 triệu' }).click();
  await expect(page.getByText(/xếp theo lãi suất thấp nhất/)).toBeVisible();
});
