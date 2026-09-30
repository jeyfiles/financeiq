import { useState, useEffect } from 'preact/hooks';
import Field, { num, check } from './Field';
import CostBars from './CostBars';
import { useCurrency } from '../../lib/useCurrency';
import { useRescale, tidy } from '../../lib/useRescale';
import { format } from '../../lib/money';
import { realCost } from '../../lib/calc';
import { markDone } from '../../lib/storage';

export default function RealCost() {
  const c = useCurrency();
  const [price, setPrice] = useState('800');
  const [discount, setDiscount] = useState('0');
  const [months, setMonths] = useState('12');
  const [rate, setRate] = useState('20');
  const [fee, setFee] = useState('25');
  useRescale(c, (k) => { setPrice((v) => tidy(Number(v) * k)); setFee((v) => tidy(Number(v) * k)); });
  useEffect(() => { markDone('lab:real-cost'); }, []);

  const errs = {
    price: check(price, 'Price', 1, 100_000_000),
    discount: check(discount, 'Discount', 0, 50),
    months: check(months, 'Months', 1, 120),
    rate: check(rate, 'Interest', 0, 60),
    fee: check(fee, 'Fee', 0, 10_000_000),
  };
  const ok = !Object.values(errs).some(Boolean);
  const f = (n: number, cents = false) => format(n, c, { cents });
  const p = num(price) ?? 0;
  const r = ok ? realCost({ price: p, upfrontDiscount: num(discount)!, months: num(months)!, annualRate: num(rate)!, fee: num(fee)! }) : null;

  return (
    <div class="fq-two">
      <form class="fq-panel" onSubmit={(e) => e.preventDefault()} aria-labelledby="rc-form-title">
        <h2 id="rc-form-title" class="fq-panel__title">The offer</h2>
        <Field id="rc-price" label="Price" prefix={c.symbol} value={price} onInput={setPrice} error={errs.price} min={1} />
        <Field id="rc-discount" label="Discount for paying upfront" value={discount} onInput={setDiscount} error={errs.discount} min={0} step={0.5} suffix="%" help="Some shops give a small discount for paying in full. Use 0 if not." />
        <Field id="rc-months" label="Number of monthly installments" value={months} onInput={setMonths} error={errs.months} min={1} suffix="months" />
        <Field id="rc-rate" label="Interest rate on the plan" value={rate} onInput={setRate} error={errs.rate} min={0} step={0.5} suffix="% a year" help="Look for the APR in the terms. A plan sold as interest free may be 0% with a fee." />
        <Field id="rc-fee" label="One-time fee for the plan" prefix={c.symbol} value={fee} onInput={setFee} error={errs.fee} min={0} help="Processing or setup fee. Check the terms for late fees too." />
      </form>
      <section class="fq-panel" aria-live="polite" aria-labelledby="rc-result-title">
        <h2 id="rc-result-title" class="fq-panel__title">The real cost</h2>
        {!r && <p>Fix the highlighted boxes to compare.</p>}
        {r && (
          <>
            <p class="fq-big">
              {r.saving > 0.5
                ? <>The installment plan costs <strong>{f(r.saving)}</strong> more than paying upfront.</>
                : r.saving < -0.5
                  ? <>With these numbers the plan costs {f(-r.saving)} less than paying upfront. Check the terms for late fees.</>
                  : <>Both options cost about the same. Check the terms for late fees.</>}
            </p>
            <div class="fq-stats">
              <div class="fq-stat"><span class="fq-stat__value">{f(r.plan.monthly, true)}</span><span class="fq-stat__label">Monthly payment on the plan</span></div>
              <div class="fq-stat"><span class="fq-stat__value">{f(r.plan.total)}</span><span class="fq-stat__label">Total paid on the plan</span></div>
              <div class="fq-stat"><span class="fq-stat__value">{f(r.upfront.total)}</span><span class="fq-stat__label">Total paid upfront</span></div>
            </div>
            <CostBars
              title="Total you pay, by option"
              format={(n) => f(n)}
              rows={[
                { label: 'Pay upfront', base: r.upfront.total, extra: 0 },
                { label: `Pay in ${r.plan.months} installments`, base: Math.min(p, r.plan.total), extra: Math.max(0, r.plan.total - p) },
              ]}
            />
            <p class="fq-tip">Before you choose the plan, ask: can I pay every installment on time, even in a bad month? A missed payment can add fees and go on your credit history.</p>
          </>
        )}
      </section>
    </div>
  );
}
