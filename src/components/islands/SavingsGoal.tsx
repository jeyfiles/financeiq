import { useState, useEffect } from 'preact/hooks';
import Field, { num, check, compact } from './Field';
import LineChart from './LineChart';
import { useCurrency } from '../../lib/useCurrency';
import { useRescale, tidy } from '../../lib/useRescale';
import { format } from '../../lib/money';
import { savingsGoal } from '../../lib/calc';
import { markDone } from '../../lib/storage';

export default function SavingsGoal() {
  const c = useCurrency();
  const [goal, setGoal] = useState('1200');
  const [saved, setSaved] = useState('100');
  const [months, setMonths] = useState('10');
  const [rate, setRate] = useState('3');
  useRescale(c, (k) => { setGoal((v) => tidy(Number(v) * k)); setSaved((v) => tidy(Number(v) * k)); });
  useEffect(() => { markDone('lab:savings-goal'); }, []);

  const errs = {
    goal: check(goal, 'Goal', 1, 100_000_000),
    saved: check(saved, 'Already saved', 0, 100_000_000),
    months: check(months, 'Months', 1, 600),
    rate: check(rate, 'Interest', 0, 30),
  };
  const ok = !Object.values(errs).some(Boolean);
  const f = (n: number) => format(n, c);
  const r = ok ? savingsGoal({ goal: num(goal)!, saved: num(saved)!, months: num(months)!, annualRate: num(rate)! }) : null;
  const n = num(months) ?? 0;

  return (
    <div class="fq-two">
      <form class="fq-panel" onSubmit={(e) => e.preventDefault()} aria-labelledby="sg-form-title">
        <h2 id="sg-form-title" class="fq-panel__title">Your goal</h2>
        <Field id="sg-goal" label="How much do you need?" prefix={c.symbol} value={goal} onInput={setGoal} error={errs.goal} min={1} help="For example a laptop, a course fee or a trip." />
        <Field id="sg-saved" label="Already saved for it" prefix={c.symbol} value={saved} onInput={setSaved} error={errs.saved} min={0} />
        <Field id="sg-months" label="Months until you need it" value={months} onInput={setMonths} error={errs.months} min={1} suffix="months" />
        <Field id="sg-rate" label="Interest your savings earn" value={rate} onInput={setRate} error={errs.rate} min={0} step={0.1} suffix="% a year" help="Use 0 if the money sits in an account that pays no interest." />
      </form>
      <section class="fq-panel" aria-live="polite" aria-labelledby="sg-result-title">
        <h2 id="sg-result-title" class="fq-panel__title">Your plan</h2>
        {!r && <p>Fix the highlighted boxes to see your plan.</p>}
        {r && r.alreadyEnough && <p class="fq-big">You already have enough. If it keeps earning interest, you will reach your goal without saving more.</p>}
        {r && !r.alreadyEnough && (
          <>
            <p class="fq-big">Save <strong>{format(r.monthly, c, { cents: r.monthly < 100 })}</strong> a month for {n} {n === 1 ? 'month' : 'months'}.</p>
            <div class="fq-stats">
              <div class="fq-stat"><span class="fq-stat__value">{format(r.monthly / 4.33, c)}</span><span class="fq-stat__label">About this much a week</span></div>
              <div class="fq-stat"><span class="fq-stat__value">{f(r.deposits)}</span><span class="fq-stat__label">You put in</span></div>
              <div class="fq-stat"><span class="fq-stat__value">{f(r.interest)}</span><span class="fq-stat__label">Interest earned</span></div>
            </div>
            {n > 1 && (
              <LineChart
                title="Your savings, month by month"
                xTitle="Month"
                xLabels={r.balances.map((_, i) => i)}
                series={[{ name: 'Savings', color: 'var(--fq-series-1)', values: r.balances }]}
                format={f}
                formatAxis={(v) => compact(v, c.symbol)}
              />
            )}
            <p class="fq-tip">Tip: set up an automatic transfer on payday for this amount, so saving happens before spending.</p>
          </>
        )}
      </section>
    </div>
  );
}
