// College Money Planner: example comparison, editing, what-if, a third college, saving, currency and errors.
import { test, expect } from '@playwright/test';

test.use({ locale: 'en-US' });

// Wait until every interactive part has started, so typing is not lost before the page is ready.
const hydrated = (page: import('@playwright/test').Page) => page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));


const total = (page: import('@playwright/test').Page) => page.locator('.fq-planner__total td');

test('shows the example comparison and a clear winner', async ({ page }) => {
  await page.goto('/financeiq/college/'); await hydrated(page);
  await expect(page.locator('.fq-planner__results .fq-big')).toContainText('College B costs you and your family about');
  await expect(total(page)).toHaveCount(2);
  await expect(page.locator('.fq-bars__row')).toHaveCount(2);
  await expect(page.getByText('More than a year\'s salary')).toBeVisible();
});

test('what-if: losing the scholarship raises College A', async ({ page }) => {
  await page.goto('/financeiq/college/'); await hydrated(page);
  const before = await total(page).first().textContent();
  await page.getByLabel(/What if/).check();
  await expect(total(page).first()).not.toHaveText(before!);
});

test('edits update the result, a third college can be added, and work is saved', async ({ page }) => {
  await page.goto('/financeiq/college/'); await hydrated(page);
  await page.locator('#pl-1-tuition').fill('40000');
  await expect(page.locator('.fq-planner__results .fq-big')).toContainText('College A costs you and your family about');
  await page.getByRole('button', { name: 'Add a third college' }).click();
  await expect(page.locator('.fq-planner__college')).toHaveCount(3);
  await page.locator('#pl-2-tuition').fill('5000');
  await page.locator('#pl-2-name').fill('Home State U');
  await expect(page.locator('.fq-planner__results .fq-big')).toContainText('Home State U costs you');
  await page.reload();
  await expect(page.locator('#pl-2-name')).toHaveValue('Home State U');
  await expect(page.locator('#pl-1-tuition')).toHaveValue('40000');
  await page.getByRole('button', { name: 'Remove Home State U' }).click();
  await expect(page.locator('.fq-planner__college')).toHaveCount(2);
  await page.getByRole('button', { name: 'Reset to the example' }).click();
  await expect(page.locator('#pl-1-tuition')).toHaveValue('12000');
});

test('explains errors next to the box', async ({ page }) => {
  await page.goto('/financeiq/college/'); await hydrated(page);
  await page.locator('#pl-0-years').fill('');
  await expect(page.getByText('Enter a number for years.')).toBeVisible();
  await expect(page.locator('#pl-0-years')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('Fix the highlighted boxes to see the comparison.')).toBeVisible();
});

test('changing currency rescales the amounts', async ({ page }) => {
  await page.goto('/financeiq/college/'); await hydrated(page);
  await expect(page.locator('#pl-0-tuition')).toHaveValue('20000');
  await page.getByLabel('Currency').selectOption('INR');
  await expect(page.locator('#pl-0-tuition')).toHaveValue('500000');
  await expect(total(page).first()).toContainText('₹');
});
