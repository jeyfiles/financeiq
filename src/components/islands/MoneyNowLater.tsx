// Money now or later: present value and future value, worked out step by step.
// Four questions, each with a short example story and the formula with your numbers in it.
import { useEffect, useState } from 'preact/hooks';
import Field, { num, check, compact } from './Field';
import LineChart from './LineChart';
import { useCurrency } from '../../lib/useCurrency';
import { useRescale, tidy } from '../../lib/useRescale';
import { format } from '../../lib/money';
import { markDone } from '../../lib/storage';
import { fvLump, pvLump, fvAnnuity, breakEvenRate, lumpPath, annuityPath, salaryPlan, stageIndexFor, SHEET_PLAN, type SpendingStage } from '../../lib/tvm';

type Mode = 'lump' | 'yearly' | 'offer' | 'salary';
const MODES: { id: Mode; label: string; short: string }[] = [
  { id: 'lump', label: 'Grow a single amount', short: 'Future value of an amount' },
  { id: 'yearly', label: 'Grow a yearly saving', short: 'Future value of yearly savings' },
  { id: 'offer', label: 'Is this offer worth it?', short: 'Present value and comparing offers' },
  { id: 'salary', label: 'Salary, spending and savings', short: 'Year by year to retirement' },
];

const pct = (n: number) => `${+n.toFixed(2)}%`;
const dec = (n: number) => `${+(n / 100).toFixed(4)}`;

export default function MoneyNowLater() {
  const c = useCurrency();
  const f = (n: number) => format(n, c);
  const [mode, setMode] = useState<Mode>('lump');
  useEffect(() => { markDone('lab:money-now-or-later'); }, []);

  // 1. Single amount
  const [lAmount, setLAmount] = useState('5000');
  const [lRate, setLRate] = useState('5');
  const [lFrom, setLFrom] = useState('18');
  const [lTo, setLTo] = useState('60');
  // 2. Yearly saving
  const [yPay, setYPay] = useState('6000');
  const [yRate, setYRate] = useState('6');
  const [yFrom, setYFrom] = useState('22');
  const [yTo, setYTo] = useState('60');
  // 3. Offer
  const [oNow, setONow] = useState('100000');
  const [oLater, setOLater] = useState('120000');
  const [oYears, setOYears] = useState('10');
  const [oRate, setORate] = useState('4');
  // 4. Salary, spending and savings
  const [sSalary, setSSalary] = useState(String(SHEET_PLAN.salary));
  const [sGrowth, setSGrowth] = useState(String(SHEET_PLAN.salaryGrowth));
  const [sStart, setSStart] = useState(String(SHEET_PLAN.startAge));
  const [sRetire, setSRetire] = useState(String(SHEET_PLAN.retireAge));
  const [sRate, setSRate] = useState(String(SHEET_PLAN.returnRate));
  const [sStages, setSStages] = useState(SHEET_PLAN.stages.map((x) => ({ through: String(x.throughAge), amount: String(x.amount), note: x.note })));
  const [sCells, setSCells] = useState<Record<number, string>>({});
  const [sPay, setSPay] = useState<Record<number, string>>({});

  useRescale(c, (k) => {
    const t = (v: string) => (num(v) === null ? v : tidy(Number(v) * k));
    for (const set of [setLAmount, setYPay, setONow, setOLater, setSSalary]) set(t);
    setSStages((list) => list.map((x) => ({ ...x, amount: t(x.amount) })));
    setSCells((cells) => Object.fromEntries(Object.entries(cells).map(([age, v]) => [age, t(v)])));
    setSPay((cells) => Object.fromEntries(Object.entries(cells).map(([age, v]) => [age, t(v)])));
  });

  return (
    <div class="fq-mnl">
      <div class="fq-mnl__modes" role="radiogroup" aria-label="What do you want to work out?">
        {MODES.map((m) => (
          <button type="button" role="radio" aria-checked={mode === m.id} class={`fq-mnl__mode${mode === m.id ? ' is-on' : ''}`} onClick={() => setMode(m.id)}>
            <strong>{m.label}</strong><span>{m.short}</span>
          </button>
        ))}
      </div>

      {mode === 'lump' && (() => {
        const e = { a: check(lAmount, 'Amount', 1, 1e10), r: check(lRate, 'Rate', 0, 30), f: check(lFrom, 'Age', 0, 100), t: check(lTo, 'Age', 1, 110) };
        if (!e.f && !e.t && num(lTo)! <= num(lFrom)!) e.t = 'Use an age later than the starting age.';
        const ok = !Object.values(e).some(Boolean);
        const n = ok ? num(lTo)! - num(lFrom)! : 0;
        const fv = ok ? fvLump(num(lAmount)!, num(lRate)!, n) : 0;
        return (
          <div class="fq-two">
            <form class="fq-panel" onSubmit={(ev) => ev.preventDefault()} aria-labelledby="l-title">
              <h2 id="l-title" class="fq-panel__title">Grow a single amount</h2>
              <p class="fq-mnl__story">Example: you get <span data-ex>{f(5000 * c.scale)}</span> as a gift on your 18th birthday and invest it at 5% a year. What is it worth when you retire at 60?</p>
              <Field id="l-amount" label="Amount today (present value)" prefix={c.symbol} value={lAmount} onInput={setLAmount} error={e.a} min={1} />
              <Field id="l-rate" label="Yearly return" suffix="% a year" step={0.1} value={lRate} onInput={setLRate} error={e.r} min={0} />
              <Field id="l-from" label="Your age now" suffix="years" value={lFrom} onInput={setLFrom} error={e.f} min={0} />
              <Field id="l-to" label="Age when you need the money" suffix="years" value={lTo} onInput={setLTo} error={e.t} min={1} />
            </form>
            <section class="fq-panel" aria-live="polite" aria-labelledby="l-res">
              <h2 id="l-res" class="fq-panel__title">Future value</h2>
              {!ok ? <p>Fix the highlighted boxes to see the result.</p> : (
                <>
                  <p class="fq-big">{f(num(lAmount)!)} grows to <strong>{f(fv)}</strong> in {n} years.</p>
                  <div class="fq-formula" aria-label="The formula with your numbers">
                    <p class="fq-formula__rule">FV = PV × (1 + r)<sup>n</sup></p>
                    <p>= {f(num(lAmount)!)} × (1 + {dec(num(lRate)!)})<sup>{n}</sup></p>
                    <p>= <strong>{f(fv)}</strong></p>
                  </div>
                  <div class="fq-stats">
                    <div class="fq-stat"><span class="fq-stat__value">{f(num(lAmount)!)}</span><span class="fq-stat__label">You put in</span></div>
                    <div class="fq-stat"><span class="fq-stat__value">{f(fv - num(lAmount)!)}</span><span class="fq-stat__label">Growth on top</span></div>
                    <div class="fq-stat"><span class="fq-stat__value">{(fv / num(lAmount)!).toFixed(1)} times</span><span class="fq-stat__label">Your money multiplied</span></div>
                  </div>
                  {n >= 2 && <LineChart title="Value by age" xTitle="Age" xLabels={Array.from({ length: n + 1 }, (_, i) => num(lFrom)! + i)} series={[{ name: 'Value', color: 'var(--fq-series-1)', values: lumpPath(num(lAmount)!, num(lRate)!, n) }]} format={f} formatAxis={(v) => compact(v, c.symbol)} />}
                </>
              )}
            </section>
          </div>
        );
      })()}

      {mode === 'yearly' && (() => {
        const e = { p: check(yPay, 'Yearly saving', 1, 1e10), r: check(yRate, 'Rate', 0, 30), f: check(yFrom, 'Age', 0, 100), t: check(yTo, 'Age', 1, 110) };
        if (!e.f && !e.t && num(yTo)! <= num(yFrom)!) e.t = 'Use an age later than the starting age.';
        const ok = !Object.values(e).some(Boolean);
        const n = ok ? num(yTo)! - num(yFrom)! : 0;
        const fv = ok ? fvAnnuity(num(yPay)!, num(yRate)!, n) : 0;
        const put = ok ? num(yPay)! * n : 0;
        return (
          <div class="fq-two">
            <form class="fq-panel" onSubmit={(ev) => ev.preventDefault()} aria-labelledby="y-title">
              <h2 id="y-title" class="fq-panel__title">Grow a yearly saving</h2>
              <p class="fq-mnl__story">Example: you start your first job at 22 and invest {f(6000 * c.scale)} every year at 6% until you retire at 60. How much will you have?</p>
              <Field id="y-pay" label="Saving each year (payment)" prefix={c.symbol} value={yPay} onInput={setYPay} error={e.p} min={1} />
              <Field id="y-rate" label="Yearly return" suffix="% a year" step={0.1} value={yRate} onInput={setYRate} error={e.r} min={0} />
              <Field id="y-from" label="Age you start" suffix="years" value={yFrom} onInput={setYFrom} error={e.f} min={0} />
              <Field id="y-to" label="Age you retire" suffix="years" value={yTo} onInput={setYTo} error={e.t} min={1} help="Each year's saving is added at the end of the year." />
            </form>
            <section class="fq-panel" aria-live="polite" aria-labelledby="y-res">
              <h2 id="y-res" class="fq-panel__title">Future value</h2>
              {!ok ? <p>Fix the highlighted boxes to see the result.</p> : (
                <>
                  <p class="fq-big">Saving {f(num(yPay)!)} a year for {n} years grows to <strong>{f(fv)}</strong>.</p>
                  <div class="fq-formula">
                    <p class="fq-formula__rule">FV = P × ((1 + r)<sup>n</sup> − 1) ÷ r</p>
                    <p>= {f(num(yPay)!)} × ((1 + {dec(num(yRate)!)})<sup>{n}</sup> − 1) ÷ {dec(num(yRate)!)}</p>
                    <p>= <strong>{f(fv)}</strong></p>
                  </div>
                  <div class="fq-stats">
                    <div class="fq-stat"><span class="fq-stat__value">{f(put)}</span><span class="fq-stat__label">You put in</span></div>
                    <div class="fq-stat"><span class="fq-stat__value">{f(fv - put)}</span><span class="fq-stat__label">Growth on top</span></div>
                  </div>
                  {n >= 2 && <LineChart title="Value by age" xTitle="Age" xLabels={Array.from({ length: n + 1 }, (_, i) => num(yFrom)! + i)}
                    series={[{ name: 'With growth', color: 'var(--fq-series-1)', values: annuityPath(num(yPay)!, num(yRate)!, n) }, { name: 'Money you put in', color: 'var(--fq-series-2)', values: Array.from({ length: n + 1 }, (_, i) => num(yPay)! * i) }]}
                    format={f} formatAxis={(v) => compact(v, c.symbol)} />}
                </>
              )}
            </section>
          </div>
        );
      })()}

      {mode === 'offer' && (() => {
        const e = { a: check(oNow, 'Amount now', 1, 1e10), b: check(oLater, 'Amount later', 1, 1e10), n: check(oYears, 'Years', 1, 60), r: check(oRate, 'Rate', 0, 30) };
        const ok = !Object.values(e).some(Boolean);
        const now = num(oNow) ?? 0; const later = num(oLater) ?? 0; const n = num(oYears) ?? 0; const r = num(oRate) ?? 0;
        const fvAlt = ok ? fvLump(now, r, n) : 0;
        const pvOffer = ok ? pvLump(later, r, n) : 0;
        const be = ok ? breakEvenRate(now, later, n) : 0;
        const offerWins = later > fvAlt + 0.5;
        return (
          <div class="fq-two">
            <form class="fq-panel" onSubmit={(ev) => ev.preventDefault()} aria-labelledby="o-title">
              <h2 id="o-title" class="fq-panel__title">Is this offer worth it?</h2>
              <p class="fq-mnl__story">Example: a relative asks to borrow {f(100000 * c.scale)} now and promises to give back {f(120000 * c.scale)} after 10 years. A safe government bond pays 4% a year. Should you agree?</p>
              <Field id="o-now" label="Money you give up now" prefix={c.symbol} value={oNow} onInput={setONow} error={e.a} min={1} />
              <Field id="o-later" label="Money you get back later" prefix={c.symbol} value={oLater} onInput={setOLater} error={e.b} min={1} />
              <Field id="o-years" label="Years until you get it back" suffix="years" value={oYears} onInput={setOYears} error={e.n} min={1} />
              <Field id="o-rate" label="What you could earn safely instead" suffix="% a year" step={0.1} value={oRate} onInput={setORate} error={e.r} min={0} help="For example a government bond or a fixed deposit. This is your discount rate." />
            </form>
            <section class="fq-panel" aria-live="polite" aria-labelledby="o-res">
              <h2 id="o-res" class="fq-panel__title">Compare the two</h2>
              {!ok ? <p>Fix the highlighted boxes to see the result.</p> : (
                <>
                  <p class="fq-big">{offerWins
                    ? <>The offer is better. It gives back {f(later)}, which is {f(later - fvAlt)} more than investing at {pct(r)} would.</>
                    : <>Investing at {pct(r)} is better. It grows to <strong>{f(fvAlt)}</strong>, which is <strong>{f(fvAlt - later)}</strong> more than the {f(later)} offered.</>}</p>
                  <div class="fq-mnl__compare">
                    <div class="fq-outcome__box">
                      <h3>Future value test</h3>
                      <p class="fq-formula__rule">FV = PV × (1 + r)<sup>n</sup></p>
                      <p>{f(now)} × (1 + {dec(r)})<sup>{n}</sup> = <strong>{f(fvAlt)}</strong></p>
                      <p class="fq-help">What your money becomes if you invest it yourself, compared with {f(later)} offered.</p>
                    </div>
                    <div class="fq-outcome__box">
                      <h3>Present value test</h3>
                      <p class="fq-formula__rule">PV = FV ÷ (1 + r)<sup>n</sup></p>
                      <p>{f(later)} ÷ (1 + {dec(r)})<sup>{n}</sup> = <strong>{f(pvOffer)}</strong></p>
                      <p class="fq-help">What the promised {f(later)} is worth in today's money, compared with the {f(now)} you give up.</p>
                    </div>
                  </div>
                  <p>Break-even rate: <strong>{pct(be)}</strong> a year. The offer only wins if you could earn less than this elsewhere.</p>
                  <p class="fq-tip">Money is not the only question with family and friends. Also ask: what happens if they cannot pay it back on time?</p>
                </>
              )}
            </section>
          </div>
        );
      })()}

      {mode === 'salary' && (() => {
        const e: Record<string, string | undefined> = {
          salary: check(sSalary, 'Salary', 0, 1e10), growth: check(sGrowth, 'Salary growth', -20, 30),
          start: check(sStart, 'Age', 14, 80), retire: check(sRetire, 'Age', 15, 90), rate: check(sRate, 'Return', -20, 30),
        };
        if (!e.start && !e.retire && num(sRetire)! <= num(sStart)!) e.retire = 'Use an age after the starting age.';
        sStages.forEach((st, i) => {
          e[`a${i}`] = check(st.amount, 'Expenses', 0, 1e10);
          e[`t${i}`] = i === sStages.length - 1 ? undefined : check(st.through, 'Age', 14, 90);
          if (!e[`t${i}`] && i > 0 && i < sStages.length - 1 && num(st.through)! <= num(sStages[i - 1].through)!) e[`t${i}`] = 'Use an age after the stage before.';
        });
        for (const [age, v] of Object.entries(sCells)) if (check(v, 'Expenses', 0, 1e10)) e[`c${age}`] = 'cell';
        for (const [age, v] of Object.entries(sPay)) if (check(v, 'Salary', 0, 1e10)) e[`p${age}`] = 'cell';
        const ok = !Object.values(e).some(Boolean);
        const start = num(sStart) ?? 0; const retire = num(sRetire) ?? 0;
        const stages: SpendingStage[] = sStages.map((st, i) => ({ throughAge: i === sStages.length - 1 ? retire : num(st.through) ?? 0, amount: num(st.amount) ?? 0, note: st.note }));
        const overrides = Object.fromEntries(Object.entries(sCells).filter(([, v]) => num(v) !== null).map(([age, v]) => [Number(age), num(v)!]));
        const salaryOverrides = Object.fromEntries(Object.entries(sPay).filter(([, v]) => num(v) !== null).map(([age, v]) => [Number(age), num(v)!]));
        const res = ok ? salaryPlan({ startAge: start, retireAge: retire, salary: num(sSalary)!, salaryGrowth: num(sGrowth)!, returnRate: num(sRate)!, stages, overrides, salaryOverrides }) : null;
        const changed = Object.keys(sCells).length + Object.keys(sPay).length;
        const jobExample = () => {
          if (!res) return;
          // A 25% raise with a new job in year 7, then two years with no raise in years 14 and 15.
          const jobAge = start + 6; const flatAge = start + 13;
          const before = res.rows.find((row) => row.age === jobAge - 1);
          if (!before) return;
          const hike: Record<number, number> = { [jobAge]: Math.round(before.salary * 1.25) };
          const withHike = salaryPlan({ startAge: start, retireAge: retire, salary: num(sSalary)!, salaryGrowth: num(sGrowth)!, returnRate: num(sRate)!, stages, overrides, salaryOverrides: hike });
          const prior = withHike.rows.find((row) => row.age === flatAge - 1);
          const next: Record<number, string> = { [jobAge]: String(hike[jobAge]) };
          if (prior && flatAge + 1 <= retire) { next[flatAge] = String(Math.round(prior.salary)); next[flatAge + 1] = String(Math.round(prior.salary)); }
          setSPay(next);
        };
        const stageFrom = (i: number) => (i === 0 ? start : (num(sStages[i - 1].through) ?? 0) + 1);
        const reset = () => {
          setSSalary(String(Math.round(SHEET_PLAN.salary * c.scale))); setSGrowth(String(SHEET_PLAN.salaryGrowth)); setSStart(String(SHEET_PLAN.startAge));
          setSRetire(String(SHEET_PLAN.retireAge)); setSRate(String(SHEET_PLAN.returnRate));
          setSStages(SHEET_PLAN.stages.map((x) => ({ through: String(x.throughAge), amount: tidy(x.amount * c.scale), note: x.note }))); setSCells({}); setSPay({});
        };
        return (
          <div class="fq-mnl__salary">
            <div class="fq-two">
              <form class="fq-panel" onSubmit={(ev) => ev.preventDefault()} aria-labelledby="s-title">
                <h2 id="s-title" class="fq-panel__title">Salary, spending and savings</h2>
                <p class="fq-mnl__story">Example: at 22 you graduate and start a job that pays {f(75000 * c.scale)} a year. Your income usually grows 3% a year, but real careers have jumps and pauses: a new job can bring a big raise, and some years bring no raise at all. Your yearly expenses change with each stage of life. <strong>Q1:</strong> how much will you have at 60 if you just keep your savings? <strong>Q2:</strong> how much if you invest them in a stock market index fund at an average of 6% a year?</p>
                <Field id="s-salary" label="Starting salary per year" prefix={c.symbol} value={sSalary} onInput={setSSalary} error={e.salary} min={0} />
                <Field id="s-growth" label="Salary growth each year" suffix="%" step={0.5} value={sGrowth} onInput={setSGrowth} error={e.growth} />
                <div class="fq-tl__grid">
                  <Field id="s-start" label="Starting age" value={sStart} onInput={setSStart} error={e.start} />
                  <Field id="s-retire" label="Retirement age" value={sRetire} onInput={setSRetire} error={e.retire} />
                </div>
                <Field id="s-rate" label="Average return if invested (Q2)" suffix="% a year" step={0.5} value={sRate} onInput={setSRate} error={e.rate} />
                <h3 class="fq-planner__sub">Yearly expenses by stage</h3>
                {sStages.map((st, i) => (
                  <div class="fq-mnl__stage">
                    <p class="fq-mnl__stage-head"><strong>Age {stageFrom(i)} through {i === sStages.length - 1 ? retire : st.through}</strong></p>
                    {st.note && <p class="fq-help">{st.note}</p>}
                    <div class="fq-tl__grid">
                      <Field id={`s-a${i}`} label="Expenses per year" prefix={c.symbol} value={st.amount} onInput={(v) => setSStages((l) => l.map((x, k) => (k === i ? { ...x, amount: v } : x)))} error={e[`a${i}`]} min={0} />
                      {i < sStages.length - 1
                        ? <Field id={`s-t${i}`} label="Through age" value={st.through} onInput={(v) => setSStages((l) => l.map((x, k) => (k === i ? { ...x, through: v } : x)))} error={e[`t${i}`]} />
                        : <p class="fq-help fq-mnl__last">Runs until retirement.</p>}
                    </div>
                  </div>
                ))}
                <div class="fq-btn-row">
                  <button type="button" class="fq-btn fq-btn--secondary" onClick={reset}>Reset to the example</button>
                </div>
              </form>
              <section class="fq-panel" aria-live="polite" aria-labelledby="s-res">
                <h2 id="s-res" class="fq-panel__title">The answers</h2>
                {!res ? <p>Fix the highlighted boxes to see the answers.</p> : (
                  <>
                    <div class="fq-mnl__answers">
                      <div class="fq-outcome__box"><h3>Q1: Without investing</h3><p class="fq-stat__value">{f(res.q1)}</p><p class="fq-help">All your yearly savings added up, from {start} to {retire}.</p></div>
                      <div class="fq-outcome__box"><h3>Q2: Invested at {pct(num(sRate)!)}</h3><p class="fq-stat__value">{f(res.q2)}</p><p class="fq-help">Each year your balance grows by {pct(num(sRate)!)}, then that year's savings are added.</p></div>
                    </div>
                    <p class="fq-big">Investing adds <strong>{f(res.totalGrowth)}</strong>{res.q1 > 0 ? <>, so you end with {(res.q2 / res.q1).toFixed(1)} times what you saved.</> : '.'}</p>
                    <div class="fq-formula">
                      <p class="fq-formula__rule">How each row is worked out</p>
                      <p>Salary = last year's salary × (1 + {dec(num(sGrowth)!)})</p>
                      <p>Annual savings = salary − expenses</p>
                      <p>Q1 total = sum of annual savings</p>
                      <p>Q2 balance = last year's balance × (1 + {dec(num(sRate)!)}) + this year's savings</p>
                    </div>
                    <LineChart title="Money by age" xTitle="Age" xLabels={res.rows.map((row) => row.age)}
                      series={[{ name: `Invested at ${pct(num(sRate)!)} (Q2)`, color: 'var(--fq-series-1)', values: res.rows.map((row) => row.invested) }, { name: 'Not invested (Q1)', color: 'var(--fq-series-2)', values: res.rows.map((row) => row.cash) }]}
                      format={f} formatAxis={(v) => compact(v, c.symbol)} />
                  </>
                )}
              </section>
            </div>
            {res && (
              <section class="fq-panel fq-sheet" aria-labelledby="s-sheet">
                <h2 id="s-sheet" class="fq-panel__title">Year by year</h2>
                <p class="fq-help">Like a spreadsheet, you can type into the salary and expense cells. Type a new <strong>salary</strong> for a job change or a year with no raise: later years grow from it at {pct(num(sGrowth)!)}. Type an <strong>expense</strong> for one unusual year, such as a wedding. Changed cells are highlighted.</p>
                <div class="fq-btn-row fq-sheet__actions">
                  <button type="button" class="fq-btn fq-btn--secondary" onClick={jobExample}>Try an example: new job at {start + 6}, no raise at {start + 13} and {start + 14}</button>
                  {changed > 0 && <button type="button" class="fq-btn fq-btn--secondary" onClick={() => { setSCells({}); setSPay({}); }}>Undo all cell changes</button>}
                </div>
                <div class="fq-scroll fq-sheet__scroll">
                  <table class="fq-table fq-sheet__table">
                    <thead><tr>
                      <th scope="col" class="num">Year</th><th scope="col" class="num">Age</th>
                      <th scope="col" class="num">Salary</th><th scope="col" class="num">Change</th><th scope="col" class="num">Expenses</th>
                      <th scope="col" class="num">Annual savings</th><th scope="col" class="num">Stage total</th>
                      <th scope="col" class="num">Not invested (Q1)</th><th scope="col" class="num">Invested (Q2)</th>
                    </tr></thead>
                    <tbody>
                      {res.rows.map((row) => (
                        <tr class={row.stageTotal !== null ? 'fq-sheet__end' : ''}>
                          <td class="num">{row.year}</td><th scope="row" class="num">{row.age}</th>
                          <td class="num fq-sheet__cell">
                            <label class="fq-visually-hidden" for={`s-pay-${row.age}`}>Salary at age {row.age}</label>
                            <input id={`s-pay-${row.age}`} type="number" inputMode="decimal" min={0} class={`fq-sheet__input fq-sheet__input--pay${row.salaryOverridden ? ' is-changed' : ''}`}
                              aria-invalid={e[`p${row.age}`] ? 'true' : undefined}
                              value={sPay[row.age] ?? String(Math.round(row.salary))}
                              onInput={(ev) => {
                                const v = (ev.target as HTMLInputElement).value;
                                setSPay((cells) => { const n = { ...cells }; if (num(v) !== null && Math.round(num(v)!) === Math.round(row.projectedSalary)) delete n[row.age]; else n[row.age] = v; return n; });
                              }} />
                          </td>
                          <td class={`num fq-sheet__change${row.salaryChange !== null && Math.abs(row.salaryChange - num(sGrowth)!) > 0.05 ? ' is-different' : ''}`}>{row.salaryChange === null ? '' : `${row.salaryChange >= 0 ? '+' : ''}${row.salaryChange.toFixed(1)}%`}</td>
                          <td class="num fq-sheet__cell">
                            <label class="fq-visually-hidden" for={`s-cell-${row.age}`}>Expenses at age {row.age}</label>
                            <input id={`s-cell-${row.age}`} type="number" inputMode="decimal" min={0} class={`fq-sheet__input${row.overridden ? ' is-changed' : ''}`}
                              aria-invalid={e[`c${row.age}`] ? 'true' : undefined}
                              value={sCells[row.age] ?? String(Math.round(row.expenses))}
                              onInput={(ev) => {
                                const v = (ev.target as HTMLInputElement).value;
                                const stageAmount = stages[stageIndexFor(stages, row.age)]?.amount;
                                setSCells((cells) => { const n = { ...cells }; if (num(v) !== null && num(v) === stageAmount) delete n[row.age]; else n[row.age] = v; return n; });
                              }} />
                          </td>
                          <td class="num">{f(row.saving)}</td>
                          <td class="num">{row.stageTotal !== null ? f(row.stageTotal) : ''}</td>
                          <td class="num">{f(row.cash)}</td>
                          <td class="num">{f(row.invested)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr>
                      <th scope="row" colspan={6}>At retirement</th>
                      <td class="num">{f(res.q1)}</td><td class="num"><strong>{f(res.q1)}</strong><span class="fq-sheet__tag">Q1</span></td><td class="num"><strong>{f(res.q2)}</strong><span class="fq-sheet__tag">Q2</span></td>
                    </tr></tfoot>
                  </table>
                </div>
              </section>
            )}
          </div>
        );
      })()}
    </div>
  );
}
