import { useState, useEffect } from 'preact/hooks';
import Field, { num, check, compact } from './Field';
import LineChart from './LineChart';
import { useCurrency } from '../../lib/useCurrency';
import { useRescale, tidy } from '../../lib/useRescale';
import { format } from '../../lib/money';
import { startNowVsLater } from '../../lib/calc';
import { markDone } from '../../lib/storage';

export default function StartEarly() {
  const c = useCurrency();
  const [monthly, setMonthly] = useState('100');
  const [rate, setRate] = useState('6');
  const [age, setAge] = useState('20');
  const [delay, setDelay] = useState('5');
  const [endAge, setEndAge] = useState('50');
  useRescale(c, (k) => setMonthly((v) => tidy(Number(v) * k)));
  useEffect(() => { markDone('lab:start-now-or-later'); }, []);

  const errs = {
    monthly: check(monthly, 'Monthly amount', 1, 10_000_000),
    rate: check(rate, 'Return', 0, 15),
    age: check(age, 'Age', 10, 70),
    delay: check(delay, 'Delay', 1, 30),
    endAge: check(endAge, 'End age', 15, 90),
  };
  if (!errs.endAge && !errs.age && num(endAge)! <= num(age)! + (num(delay) ?? 0)) errs.endAge = 'Pick an age later than when the late starter begins.';
  const ok = !Object.values(errs).some(Boolean);
  const f = (n: number) => format(n, c);
  const r = ok ? startNowVsLater({ monthly: num(monthly)!, annualRate: num(rate)!, startAge: num(age)!, delayYears: num(delay)!, endAge: num(endAge)! }) : null;

  return (
    <div class="fq-two">
      <form class="fq-panel" onSubmit={(e) => e.preventDefault()} aria-labelledby="se-form-title">
        <h2 id="se-form-title" class="fq-panel__title">Your assumptions</h2>
        <Field id="se-monthly" label="Amount you put in each month" prefix={c.symbol} value={monthly} onInput={setMonthly} error={errs.monthly} min={1} />
        <Field id="se-rate" label="Average yearly return (a guess)" value={rate} onInput={setRate} error={errs.rate} min={0} step={0.5} suffix="% a year" help="Real returns go up and down each year. Try a low and a high number to see the range." />
        <Field id="se-age" label="Your age now" value={age} onInput={setAge} error={errs.age} min={10} suffix="years" />
        <Field id="se-delay" label="Years the late starter waits" value={delay} onInput={setDelay} error={errs.delay} min={1} suffix="years" />
        <Field id="se-end" label="Compare at age" value={endAge} onInput={setEndAge} error={errs.endAge} min={15} suffix="years" />
      </form>
      <section class="fq-panel" aria-live="polite" aria-labelledby="se-result-title">
        <h2 id="se-result-title" class="fq-panel__title">What happens</h2>
        {!r && <p>Fix the highlighted boxes to see the result.</p>}
        {r && (
          <>
            <p class="fq-big">Starting {num(delay)} years earlier ends with <strong>{f(r.difference)}</strong> more at age {num(endAge)}.</p>
            <div class="fq-stats">
              <div class="fq-stat"><span class="fq-stat__value">{f(r.planNow.final)}</span><span class="fq-stat__label">Start now, at {num(age)}</span></div>
              <div class="fq-stat"><span class="fq-stat__value">{f(r.planLater.final)}</span><span class="fq-stat__label">Start at {r.planLater.startAge}</span></div>
              <div class="fq-stat"><span class="fq-stat__value">{f(r.planNow.contributed - r.planLater.contributed)}</span><span class="fq-stat__label">Extra money the early starter put in</span></div>
            </div>
            <LineChart
              title="Balance by age"
              xTitle="Age"
              xLabels={r.ages}
              series={[
                { name: `Start now (age ${num(age)})`, color: 'var(--fq-series-1)', values: r.now },
                { name: `Start at ${r.planLater.startAge}`, color: 'var(--fq-series-2)', values: r.later },
              ]}
              format={f}
              formatAxis={(v) => compact(v, c.symbol)}
            />
            <p class="fq-tip">The early starter put in only {f(r.planNow.contributed - r.planLater.contributed)} more, but ends {f(r.difference)} ahead. The rest is growth on growth, which needs time.</p>
          </>
        )}
      </section>
    </div>
  );
}
