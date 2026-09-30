// Preact hook: the reader's currency, updated live when they change it in the header.
import { useEffect, useState } from 'preact/hooks';
import { CURRENCY_EVENT, DEFAULT_CURRENCY, currencyByCode, readCurrency, type Currency } from './money';

export function useCurrency(): Currency {
  const [c, setC] = useState<Currency>(DEFAULT_CURRENCY);
  useEffect(() => {
    setC(readCurrency());
    const on = (e: Event) => setC(currencyByCode((e as CustomEvent<string>).detail) ?? readCurrency());
    window.addEventListener(CURRENCY_EVENT, on);
    return () => window.removeEventListener(CURRENCY_EVENT, on);
  }, []);
  return c;
}
