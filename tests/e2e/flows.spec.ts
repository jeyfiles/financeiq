// The main things a visitor does: change currency, make a decision, take the check, use a calculator.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ locale: 'en-US' });

test('currency change repaints amounts and is remembered', async ({ page }) => {
  await page.goto('/financeiq/');
  const hero = page.locator('.fq-hero__card [data-money="800"]');
  await expect(hero).toHaveText('$800');
  await page.getByLabel('Currency').selectOption('INR');
  await expect(hero).toHaveText('₹20,000');
  await page.goto('/financeiq/learn/interest-and-growth/');
  await expect(page.locator('[data-money="1000"]').first()).toHaveText('₹25,000');
  await expect(page.getByLabel('Currency')).toHaveValue('INR');
});

test('currency is guessed from the browser language', async ({ browser }) => {
  const ctx = await browser.newContext({ locale: 'en-GB' });
  const page = await ctx.newPage();
  await page.goto(`${test.info().project.use.baseURL}/financeiq/`);
  await expect(page.locator('.fq-hero__card [data-money="800"]')).toHaveText('£640');
  await ctx.close();
});

test('make a money decision and see it marked done', async ({ page }) => {
  await page.goto('/financeiq/decisions/new-phone/');
  await page.getByRole('button', { name: /Put it on a credit card/ }).click();
  const outcome = page.getByRole('region', { name: 'What happens' });
  await expect(outcome).toBeVisible();
  await expect(outcome.locator('.fq-tag--risky').first()).toHaveText(/Risky/);
  await expect(page.getByRole('heading', { name: 'What happens' })).toBeFocused();
  await page.getByText('See what the other choices lead to').click();
  await expect(outcome.getByText(/Buy a cheaper model/)).toBeVisible();
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
  expect(axe.violations).toEqual([]);
  await page.goto('/financeiq/decisions/');
  await expect(page.locator('[data-done-for="decision:new-phone"]')).toBeVisible();
  await expect(page.locator('[data-done-for="decision:two-colleges"]')).toBeHidden();
});

test('two colleges shows the cost table after a choice', async ({ page }) => {
  await page.goto('/financeiq/decisions/two-colleges/');
  await page.getByRole('button', { name: /total cost is lower/ }).click();
  await expect(page.getByText('Right on the numbers')).toBeVisible();
  await expect(page.getByRole('table')).toContainText('$86,400');
  await expect(page.getByRole('table')).toContainText('$66,000');
});

test('first paycheck: no plan ends in debt, a plan ends well', async ({ page }) => {
  await page.goto('/financeiq/decisions/first-paycheck/');
  const save = page.getByLabel(/Savings each month/);
  const pot = page.getByLabel(/Set aside for known bills/);
  await save.fill('0'); await pot.fill('0');
  await page.getByRole('button', { name: /Live three months/ }).click();
  await expect(page.locator('.fq-outcome .fq-tag--risky')).toHaveText(/Risky/);
  await expect(page.getByText(/owing \$450 on a credit card/)).toBeVisible();
  await save.fill('300'); await pot.fill('100');
  await expect(page.getByRole('heading', { name: 'What happens' })).toHaveCount(0);
  await page.getByRole('button', { name: /Live three months/ }).click();
  await expect(page.locator('.fq-outcome .fq-tag--good')).toHaveText(/Strong choice/);
  await expect(page.getByText(/kept \$750 in savings/)).toBeVisible();
});

test('Finance IQ check: answer all eight and get a topic breakdown', async ({ page }) => {
  await page.goto('/financeiq/check/');
  await page.getByRole('button', { name: 'Start the questions' }).click();
  for (let i = 0; i < 8; i++) {
    await expect(page.getByText(`Question ${i + 1} of 8`)).toBeVisible();
    await page.locator('.fq-option').nth(1).click(); // B is right for 6 of 8
    await expect(page.locator('.fq-feedback')).toBeVisible();
    await page.getByRole('button', { name: i < 7 ? 'Next question' : 'See my result' }).click();
  }
  await expect(page.getByRole('heading', { name: /Your learning score: 6 out of 8/ })).toBeFocused();
  await expect(page.locator('.fq-topics li')).toHaveCount(8);
  await expect(page.locator('.fq-topics .is-wrong')).toHaveCount(2);
  await page.goto('/financeiq/');
  await expect(page.getByText('6 of 8')).toBeVisible();
  await page.goto('/financeiq/check/');
  await expect(page.getByText(/Your last result/)).toBeVisible();
});

test('savings goal: results follow the inputs, errors are explained', async ({ page }) => {
  await page.goto('/financeiq/lab/savings-goal/');
  await page.getByLabel('Interest your savings earn').fill('0');
  await page.getByLabel('How much do you need?').fill('1200');
  await page.getByLabel('Already saved for it').fill('0');
  await page.getByLabel('Months until you need it').fill('12');
  await expect(page.locator('.fq-big')).toContainText('Save $100 a month for 12 months');
  await page.getByLabel('Months until you need it').fill('');
  await expect(page.getByText('Enter a number for months.')).toBeVisible();
  await expect(page.getByLabel('Months until you need it')).toHaveAttribute('aria-invalid', 'true');
});

test('start now or later: chart has a table and keyboard readout', async ({ page }, info) => {
  test.skip(info.project.name === 'phone', 'desktop only');
  await page.goto('/financeiq/lab/start-now-or-later/');
  await expect(page.locator('.fq-big')).toContainText('more at age 50');
  const svg = page.locator('.fq-chart__plot svg');
  await svg.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.fq-chart__tip')).toContainText('Age 20');
  await page.getByText('Show the numbers as a table').click();
  await expect(page.locator('.fq-chart__table tbody tr')).toHaveCount(31);
});

test('real cost: installments cost more than upfront', async ({ page }) => {
  await page.goto('/financeiq/lab/real-cost/');
  await expect(page.locator('.fq-big')).toContainText('$114');
  await page.getByLabel('Interest rate on the plan').fill('0');
  await page.getByLabel('One-time fee for the plan').fill('0');
  await expect(page.locator('.fq-big')).toContainText('about the same');
});

test('lesson can be marked as read', async ({ page }) => {
  await page.goto('/financeiq/learn/inflation/');
  await page.getByRole('button', { name: 'Mark this lesson as read' }).click();
  await expect(page.getByRole('button', { name: 'Marked as read' })).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/financeiq/learn/');
  await expect(page.locator('[data-done-for="lesson:inflation"]')).toBeVisible();
});

test('phone menu opens and closes with Escape', async ({ page }, info) => {
  test.skip(info.project.name === 'desktop', 'phone only');
  await page.goto('/financeiq/');
  const btn = page.getByRole('button', { name: 'Menu' });
  await btn.click();
  await expect(page.getByRole('link', { name: 'Money Lab' }).first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
  await expect(btn).toBeFocused();
});
