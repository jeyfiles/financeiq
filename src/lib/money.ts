// Currency handling. Finance IQ is not tied to one country, so every example amount is written once
// in "base units" and shown in the reader's chosen currency.
//
// `scale` turns a base amount into a believable amount in that currency for a student example.
// It is a rough price-level factor, not an exchange rate, and the site says so on every page that uses it.
// Scaling is linear, so totals and interest worked out from scaled inputs always add up.

export interface Currency {
  code: 'USD' | 'EUR' | 'GBP' | 'INR' | 'CAD' | 'AUD';
  label: string;
  symbol: string;
  locale: string;
  scale: number;
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', label: 'US dollar ($)', symbol: '$', locale: 'en-US', scale: 1 },
  { code: 'INR', label: 'Indian rupee (₹)', symbol: '₹', locale: 'en-IN', scale: 25 },
  { code: 'EUR', label: 'Euro (€)', symbol: '€', locale: 'en-IE', scale: 1 },
  { code: 'GBP', label: 'British pound (£)', symbol: '£', locale: 'en-GB', scale: 0.8 },
  { code: 'CAD', label: 'Canadian dollar (C$)', symbol: 'C$', locale: 'en-CA', scale: 1.4 },
  { code: 'AUD', label: 'Australian dollar (A$)', symbol: 'A$', locale: 'en-AU', scale: 1.5 },
];

export const DEFAULT_CURRENCY: Currency = CURRENCIES[0];
export const CURRENCY_KEY = 'jeyinsights-financeiq-currency';
export const CURRENCY_EVENT = 'fq-currency';

export function currencyByCode(code: string | null | undefined): Currency | undefined {
  return CURRENCIES.find((c) => c.code === code);
}

/** Best guess from the browser language, used only until the reader picks a currency. */
export function guessCurrency(languages: readonly string[]): Currency {
  for (const lang of languages) {
    const region = lang.split('-')[1]?.toUpperCase();
    if (region === 'IN') return currencyByCode('INR')!;
    if (region === 'GB') return currencyByCode('GBP')!;
    if (region === 'CA') return currencyByCode('CAD')!;
    if (region === 'AU') return currencyByCode('AUD')!;
    if (region === 'US') return currencyByCode('USD')!;
    if (region && ['IE', 'DE', 'FR', 'ES', 'IT', 'NL', 'PT', 'BE', 'AT', 'FI', 'GR'].includes(region)) return currencyByCode('EUR')!;
  }
  return DEFAULT_CURRENCY;
}

/** Scale a base amount into the chosen currency (whole units). */
export function scaled(base: number, c: Currency): number {
  return Math.round(base * c.scale);
}

/** Format an amount that is already in the chosen currency. */
export function format(amount: number, c: Currency, opts: { cents?: boolean } = {}): string {
  const digits = opts.cents ? 2 : 0;
  const n = new Intl.NumberFormat(c.locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Math.abs(amount));
  return `${amount < 0 ? '-' : ''}${c.symbol}${n}`;
}

/** Scale and format a base amount in one step. */
export function money(base: number, c: Currency): string {
  return format(scaled(base, c), c);
}

// ---- Browser only -------------------------------------------------------------------------

export function readCurrency(): Currency {
  try {
    const saved = currencyByCode(localStorage.getItem(CURRENCY_KEY));
    if (saved) return saved;
  } catch { /* storage blocked */ }
  if (typeof navigator !== 'undefined') return guessCurrency(navigator.languages ?? [navigator.language]);
  return DEFAULT_CURRENCY;
}

export function saveCurrency(code: string): void {
  const c = currencyByCode(code);
  if (!c) return;
  try { localStorage.setItem(CURRENCY_KEY, c.code); } catch { /* storage blocked: lasts for this page */ }
  document.documentElement.dataset.currency = c.code;
  window.dispatchEvent(new CustomEvent(CURRENCY_EVENT, { detail: c.code }));
}

/** Rewrite every static amount on the page: <span data-money="1200">$1,200</span> */
export function paintAmounts(c: Currency, root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-money]').forEach((el) => {
    const base = Number(el.dataset.money);
    if (!Number.isFinite(base)) return;
    el.textContent = el.hasAttribute('data-cents') ? format(base * c.scale, c, { cents: true }) : money(base, c);
  });
  root.querySelectorAll<HTMLElement>('[data-currency-name]').forEach((el) => { el.textContent = c.label; });
}
