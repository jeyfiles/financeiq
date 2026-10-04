// Every page: loads without errors, passes an axe WCAG 2.2 AA scan in light and dark mode,
// and has no sideways scrolling on a 320 px wide phone.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = [
  '', 'decisions/', 'check/', 'lab/', 'learn/', 'about/',
  'decisions/first-paycheck/', 'decisions/new-phone/', 'decisions/two-colleges/',
  'decisions/guaranteed-returns/', 'decisions/subscriptions/', 'decisions/credit-card-bill/',
  'college/', 'lab/savings-goal/', 'lab/start-now-or-later/', 'lab/real-cost/',
  'learn/make-a-spending-plan/', 'learn/interest-and-growth/', 'learn/inflation/',
  'learn/credit-and-borrowing/', 'learn/risk-and-return/', 'learn/spot-a-money-scam/',
];

for (const path of PAGES) {
  test.describe(`/financeiq/${path}`, () => {
    for (const scheme of ['light', 'dark'] as const) {
      test(`loads cleanly and passes axe (${scheme})`, async ({ page }, info) => {
        test.skip(info.project.name === 'phone' && scheme === 'dark', 'dark mode is covered on desktop');
        await page.emulateMedia({ colorScheme: scheme });
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(e.message));
        page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
        const res = await page.goto(`/financeiq/${path}`);
        expect(res?.status()).toBe(200);
        await expect(page.locator('h1')).toHaveCount(1);
        const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
        expect(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
        expect(errors).toEqual([]);
      });
    }
    test('no sideways scroll at 320 px', async ({ page }, info) => {
      test.skip(info.project.name === 'desktop', 'phone only');
      await page.setViewportSize({ width: 320, height: 700 });
      await page.goto(`/financeiq/${path}`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });
}

test('404 page is served for unknown paths in preview', async ({ page }) => {
  const res = await page.goto('/financeiq/404.html');
  expect(res?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('We could not find that page');
});
