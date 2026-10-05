// Money now or later, checked against the reference sheet's answers.
import { test, expect } from '@playwright/test';

test.use({ locale: 'en-US' });

// Wait until every interactive part has started, so typing is not lost before the page is ready.
const hydrated = (page: import('@playwright/test').Page) => page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));


test('money now or later: the four questions give the reference answers', async ({ page }) => {
  await page.goto('/financeiq/lab/money-now-or-later/'); await hydrated(page);
  await expect(page.locator('.fq-big')).toContainText('$38,808');
  await page.getByRole('radio', { name: /Grow a yearly saving/ }).click();
  await expect(page.locator('.fq-big')).toContainText('$815,425');
  await page.getByRole('radio', { name: /Is this offer worth it/ }).click();
  await expect(page.locator('.fq-big')).toContainText('Investing at 4% is better');
  await expect(page.locator('.fq-big')).toContainText('$28,024');
  await expect(page.getByText('Break-even rate')).toContainText('1.84%');
});

test('money now or later: an offer can win, and errors are explained', async ({ page }) => {
  await page.goto('/financeiq/lab/money-now-or-later/'); await hydrated(page);
  await page.getByRole('radio', { name: /Is this offer worth it/ }).click();
  await page.getByLabel('Money you get back later').fill('200000');
  await expect(page.locator('.fq-big')).toContainText('The offer is better');
  await page.getByLabel('Years until you get it back').fill('');
  await expect(page.getByText('Enter a number for years.')).toBeVisible();
});

test('salary tab: Q1 and Q2 for the sheet, cell edits and currency', async ({ page }) => {
  await page.goto('/financeiq/lab/money-now-or-later/'); await hydrated(page);
  await page.getByRole('radio', { name: /Salary, spending and savings/ }).click();
  const answers = page.locator('.fq-mnl__answers');
  await expect(answers).toContainText('$3,107,567');
  await expect(answers).toContainText('$8,603,627');
  await expect(page.locator('.fq-sheet__table tbody tr')).toHaveCount(39);
  await expect(page.locator('.fq-sheet__table tbody tr').nth(8)).toContainText('$401,933');
  await page.getByLabel('Expenses at age 25').fill('100000');
  await expect(answers).toContainText('$3,047,567');
  await expect(page.getByLabel('Expenses at age 25')).toHaveClass(/is-changed/);
  await page.getByRole('button', { name: 'Undo all cell changes' }).click();
  await expect(answers).toContainText('$3,107,567');
  // A salary typed for a job change: later years grow from it.
  await page.getByLabel('Salary at age 28').fill('120000');
  await expect(page.getByLabel('Salary at age 28')).toHaveClass(/is-changed/);
  await expect(page.getByLabel('Salary at age 29')).toHaveValue('123600');
  await expect(page.locator('.fq-sheet__table tbody tr').nth(6)).toContainText('+38.0%');
  await page.getByRole('button', { name: 'Undo all cell changes' }).click();
  await page.getByRole('button', { name: /Try an example: new job/ }).click();
  await expect(page.locator('.fq-sheet__input--pay.is-changed')).toHaveCount(3);
  await expect(page.locator('.fq-sheet__table tbody tr').nth(13)).toContainText('+0.0%');
  await page.getByRole('button', { name: 'Undo all cell changes' }).click();
  await page.locator('#s-a0').fill('45000');
  await expect(page.getByLabel('Expenses at age 22')).toHaveValue('45000');
  await page.getByRole('button', { name: 'Reset to the example' }).click();
  await page.getByLabel('Currency').selectOption('INR');
  await expect(page.locator('#s-salary')).toHaveValue('1875000');
  await expect(answers).toContainText('₹');
});
