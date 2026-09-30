// Number input with a label, help text, optional currency or unit, and an error message tied to it.
import type { ComponentChildren } from 'preact';

interface Props {
  id: string;
  label: string;
  value: string;
  onInput: (v: string) => void;
  prefix?: string;
  suffix?: string;
  help?: ComponentChildren;
  error?: string;
  step?: number;
  min?: number;
  max?: number;
}

export default function Field({ id, label, value, onInput, prefix, suffix, help, error, step = 1, min, max }: Props) {
  const describedBy = [help ? `${id}-help` : '', error ? `${id}-err` : ''].filter(Boolean).join(' ') || undefined;
  const input = (
    <input
      id={id} class="fq-input" type="number" inputMode="decimal" value={value} step={step} min={min} max={max}
      aria-invalid={error ? 'true' : undefined} aria-describedby={describedBy}
      onInput={(e) => onInput((e.target as HTMLInputElement).value)}
    />
  );
  return (
    <div class="fq-field">
      <label for={id}>{label}</label>
      {prefix || suffix ? (
        <div class={prefix ? 'fq-prefix' : 'fq-suffix'}>
          {prefix && <span aria-hidden="true">{prefix}</span>}
          {input}
          {suffix && <span aria-hidden="true">{suffix}</span>}
        </div>
      ) : input}
      {help && <p class="fq-help" id={`${id}-help`}>{help}</p>}
      {error && <p class="fq-error" id={`${id}-err`}>{error}</p>}
    </div>
  );
}

/** Parse a field value. Returns null when it is empty or not a number. */
export function num(v: string): number | null {
  if (v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Check a value against limits and return an error message, or undefined when it is fine. */
export function check(v: string, label: string, min: number, max: number): string | undefined {
  const n = num(v);
  if (n === null) return `Enter a number for ${label.toLowerCase()}.`;
  if (n < min) return `Use ${min} or more.`;
  if (n > max) return `Use ${max.toLocaleString('en')} or less.`;
  return undefined;
}

/** Compact axis numbers: 1,500 / 12K / 1.2M */
export function compact(n: number, symbol: string): string {
  const a = Math.abs(n);
  const s = a >= 1e6 ? `${+(a / 1e6).toFixed(1)}M` : a >= 1e3 ? `${+(a / 1e3).toFixed(1)}K` : `${Math.round(a)}`;
  return `${symbol}${s}`;
}
