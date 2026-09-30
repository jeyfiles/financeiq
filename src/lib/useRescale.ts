// When the reader changes currency, rescale money inputs so the example stays believable.
import { useEffect, useRef } from 'preact/hooks';
import type { Currency } from './money';

export function useRescale(c: Currency, rescale: (factor: number) => void) {
  const prev = useRef<Currency | null>(null);
  useEffect(() => {
    if (prev.current && prev.current.code !== c.code) rescale(c.scale / prev.current.scale);
    prev.current = c;
  }, [c.code]);
}

/** Round a rescaled input to a tidy number. */
export function tidy(n: number): string {
  if (!Number.isFinite(n)) return '';
  const a = Math.abs(n);
  const step = a >= 100000 ? 1000 : a >= 10000 ? 100 : a >= 1000 ? 10 : 1;
  return String(Math.round(n / step) * step);
}
