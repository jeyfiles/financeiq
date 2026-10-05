// Life Savings Timeline: salary minus spending, stage by stage, invested until retirement.
// Life events (a withdrawal, money in, a career break, a market fall, a salary change) can be placed at any age.
import { useEffect, useState } from 'preact/hooks';
import Field, { num, check, compact } from './Field';
import LineChart from './LineChart';
import { useCurrency } from '../../lib/useCurrency';
import { tidy } from '../../lib/useRescale';
import { currencyByCode, format } from '../../lib/money';
import { readJSON, writeJSON, markDone } from '../../lib/storage';
import { simulate, referenceExample, PRESETS, type EventType, type LifeEvent, type Stage, type TimelineInput } from '../../lib/timeline';

const STORE = 'timeline';
interface Saved { v: 1; currency: string; input: TimelineInput }

const EVENT_TYPES: { id: EventType; label: string; field: 'amount' | 'value'; fieldLabel: string; defaultLabel: string }[] = [
  { id: 'withdraw', label: 'Take money out', field: 'amount', fieldLabel: 'Amount taken out', defaultLabel: 'Big expense' },
  { id: 'add', label: 'Put extra money in', field: 'amount', fieldLabel: 'Amount added', defaultLabel: 'Bonus or gift' },
  { id: 'pause', label: 'Career break (no salary)', field: 'value', fieldLabel: 'Years without salary', defaultLabel: 'Career break' },
  { id: 'fall', label: 'Market fall or rise', field: 'value', fieldLabel: 'Return that year (%)', defaultLabel: 'Market fall' },
  { id: 'salary', label: 'Salary changes', field: 'amount', fieldLabel: 'New yearly salary', defaultLabel: 'New job' },
];
const typeInfo = (t: EventType) => EVENT_TYPES.find((x) => x.id === t)!;
let seq = 0;
const newId = () => `u${Date.now()}${++seq}`;

export default function LifeTimeline() {
  const c = useCurrency();
  const f = (n: number) => format(n, c);
  const [input, setInput] = useState<TimelineInput>(referenceExample());
  const [formCur, setFormCur] = useState('USD');
  const [loaded, setLoaded] = useState(false);
  const [today, setToday] = useState(false);
  const [preset, setPreset] = useState('reference');

  useEffect(() => {
    const s = readJSON<Saved | null>(STORE, null);
    if (s && s.v === 1 && s.input && Array.isArray(s.input.stages) && currencyByCode(s.currency)) { setInput(s.input); setFormCur(s.currency); setPreset(''); }
    setLoaded(true);
    markDone('lab:life-timeline');
  }, []);

  // Rescale amounts when the currency changes.
  useEffect(() => {
    if (!loaded || formCur === c.code) return;
    const from = currencyByCode(formCur);
    const k = from ? c.scale / from.scale : 1;
    const t = (n: number) => Number(tidy(n * k));
    setInput((x) => ({
      ...x, salary: t(x.salary),
      stages: x.stages.map((s) => ({ ...s, spending: t(s.spending) })),
      events: x.events.map((e) => (typeInfo(e.type).field === 'amount' ? { ...e, amount: t(e.amount) } : e)),
    }));
    setFormCur(c.code);
    setText({});
  }, [c.code, loaded, formCur]);

  useEffect(() => { if (loaded && formCur === c.code) writeJSON(STORE, { v: 1, currency: formCur, input } satisfies Saved); }, [input, formCur, loaded]);

  // Number boxes keep their own text so people can type freely; the model gets numbers.
  const [text, setText] = useState<Record<string, string>>({});
  const val = (key: string, n: number) => (key in text ? text[key] : String(+n.toFixed(2)));
  const setNum = (key: string, v: string, apply: (n: number) => void) => {
    setText((t) => ({ ...t, [key]: v }));
    const n = num(v);
    if (n !== null) apply(n);
    setPreset('');
  };
  const clearText = () => setText({});

  const loadPreset = (id: string) => {
    const p = PRESETS.find((x) => x.id === id)!;
    setInput(p.build()); setFormCur('USD'); setPreset(id); clearText();
  };

  const setStage = (sid: string, patch: Partial<Stage>) => setInput((x) => ({ ...x, stages: x.stages.map((s) => (s.id === sid ? { ...s, ...patch } : s)) }));
  const setEvent = (eid: string, patch: Partial<LifeEvent>) => setInput((x) => ({ ...x, events: x.events.map((e) => (e.id === eid ? { ...e, ...patch } : e)) }));

  // Validation
  const err: Record<string, string | undefined> = {
    start: check(val('start', input.startAge), 'Age', 14, 70),
    retire: check(val('retire', input.retireAge), 'Age', 20, 90),
    salary: check(val('salary', input.salary), 'Salary', 0, 1e10),
    growth: check(val('growth', input.salaryGrowth), 'Salary growth', -20, 30),
    infl: check(val('infl', input.inflation), 'Inflation', 0, 30),
  };
  if (!err.start && !err.retire && input.retireAge <= input.startAge) err.retire = 'Use an age after your starting age.';
  for (const s of input.stages) {
    err[`s-${s.id}-from`] = check(val(`s-${s.id}-from`, s.fromAge), 'Age', 14, 90);
    err[`s-${s.id}-spend`] = s.saveNothing ? undefined : check(val(`s-${s.id}-spend`, s.spending), 'Spending', 0, 1e10);
    err[`s-${s.id}-rate`] = check(val(`s-${s.id}-rate`, s.returnRate), 'Return', -50, 30);
  }
  for (const e of input.events) {
    err[`e-${e.id}-age`] = check(val(`e-${e.id}-age`, e.age), 'Age', 14, 90);
    const fi = typeInfo(e.type);
    err[`e-${e.id}-x`] = fi.field === 'amount' ? check(val(`e-${e.id}-x`, e.amount), fi.fieldLabel, 0, 1e10)
      : e.type === 'pause' ? check(val(`e-${e.id}-x`, e.value), fi.fieldLabel, 1, 20) : check(val(`e-${e.id}-x`, e.value), fi.fieldLabel, -90, 100);
  }
  const ok = !Object.values(err).some(Boolean) && input.stages.length > 0;
  const r = ok ? simulate(input) : null;
  // One marker per age, so events in the same year do not hide each other.
  const byAge = new Map<number, string[]>();
  if (r) for (const e of [...input.events].sort((x, y) => x.age - y.age)) {
    if (e.age < input.startAge || e.age > input.retireAge) continue;
    byAge.set(e.age, [...(byAge.get(e.age) ?? []), e.label || typeInfo(e.type).defaultLabel]);
  }
  const markers = [...byAge.entries()].map(([age, labels]) => ({ index: age - input.startAge, label: `${labels.join(' and ')} (age ${age})` }));
  const stagesSorted = [...input.stages].sort((a, b) => a.fromAge - b.fromAge);
  const stageEnd = (i: number) => (i < stagesSorted.length - 1 ? stagesSorted[i + 1].fromAge - 1 : input.retireAge);
  const shown = (row: { invested: number; investedToday: number }) => (today ? row.investedToday : row.invested);
  const infl = 1 + input.inflation / 100;

  return (
    <div class="fq-planner fq-tl">
      <div>
        <p class="fq-label" id="tl-presets">Start from an example</p>
        <div class="fq-tl__presets" role="group" aria-labelledby="tl-presets">
          {PRESETS.map((p) => <button type="button" class="fq-btn fq-btn--secondary" aria-pressed={preset === p.id} onClick={() => loadPreset(p.id)}>{p.label}</button>)}
        </div>
        <p class="fq-help">Your changes are saved in this browser. <a href="#tl-results">Jump to the results</a></p>
      </div>

      <div class="fq-planner__two">
        <fieldset class="fq-panel">
          <legend><h2 class="fq-planner__legend">1. You</h2></legend>
          <Field id="tl-start" label="Age you start working" suffix="years" value={val('start', input.startAge)} onInput={(v) => setNum('start', v, (n) => setInput((x) => ({ ...x, startAge: Math.round(n) })))} error={err.start} />
          <Field id="tl-retire" label="Age you retire" suffix="years" value={val('retire', input.retireAge)} onInput={(v) => setNum('retire', v, (n) => setInput((x) => ({ ...x, retireAge: Math.round(n) })))} error={err.retire} help="You earn and save up to and including this age." />
          <Field id="tl-salary" label="Starting salary per year" prefix={c.symbol} value={val('salary', input.salary)} onInput={(v) => setNum('salary', v, (n) => setInput((x) => ({ ...x, salary: n })))} error={err.salary} help="Take-home pay after tax, if you know it." />
          <Field id="tl-growth" label="Salary rise each year" suffix="%" step={0.5} value={val('growth', input.salaryGrowth)} onInput={(v) => setNum('growth', v, (n) => setInput((x) => ({ ...x, salaryGrowth: n })))} error={err.growth} />
          <Field id="tl-infl" label="Inflation each year" suffix="%" step={0.5} value={val('infl', input.inflation)} onInput={(v) => setNum('infl', v, (n) => setInput((x) => ({ ...x, inflation: n })))} error={err.infl} help="Used for the today's money view." />
        </fieldset>

        <fieldset class="fq-panel">
          <legend><h2 class="fq-planner__legend">2. Life stages</h2></legend>
          <p class="fq-help">Each stage runs until the next one starts. Saving each year = salary minus spending.</p>
          {stagesSorted.map((s, i) => (
            <div class="fq-tl__item">
              <p class="fq-tl__item-head"><strong>Ages {s.fromAge} to {stageEnd(i)}</strong>
                {input.stages.length > 1 && <button type="button" class="fq-tl__remove" onClick={() => { setInput((x) => ({ ...x, stages: x.stages.filter((y) => y.id !== s.id) })); setPreset(''); }}>Remove<span class="fq-visually-hidden"> stage from age {s.fromAge}</span></button>}</p>
              <div class="fq-tl__grid">
                <Field id={`tl-s-${s.id}-from`} label="Starts at age" value={val(`s-${s.id}-from`, s.fromAge)} onInput={(v) => setNum(`s-${s.id}-from`, v, (n) => setStage(s.id, { fromAge: Math.round(n) }))} error={err[`s-${s.id}-from`]} />
                <Field id={`tl-s-${s.id}-rate`} label="Return" suffix="%" step={0.5} value={val(`s-${s.id}-rate`, s.returnRate)} onInput={(v) => setNum(`s-${s.id}-rate`, v, (n) => setStage(s.id, { returnRate: n }))} error={err[`s-${s.id}-rate`]} />
              </div>
              {!s.saveNothing && <Field id={`tl-s-${s.id}-spend`} label="Spending per year" prefix={c.symbol} value={val(`s-${s.id}-spend`, s.spending)} onInput={(v) => setNum(`s-${s.id}-spend`, v, (n) => setStage(s.id, { spending: n }))} error={err[`s-${s.id}-spend`]} />}
              <div class="fq-check">
                <input id={`tl-s-${s.id}-none`} type="checkbox" checked={s.saveNothing} onChange={(ev) => { setStage(s.id, { saveNothing: (ev.target as HTMLInputElement).checked }); setPreset(''); }} />
                <label for={`tl-s-${s.id}-none`}>Save nothing in this stage (spend all income)</label>
              </div>
            </div>
          ))}
          <button type="button" class="fq-btn fq-btn--secondary" onClick={() => {
            const last = stagesSorted[stagesSorted.length - 1];
            setInput((x) => ({ ...x, stages: [...x.stages, { id: newId(), fromAge: Math.min(x.retireAge, (last?.fromAge ?? x.startAge) + 5), spending: last?.spending ?? 0, saveNothing: false, returnRate: last?.returnRate ?? 6 }] }));
            setPreset('');
          }}>Add a stage</button>
        </fieldset>
      </div>

      <fieldset class="fq-panel">
        <legend><h2 class="fq-planner__legend">3. Life events</h2></legend>
        <p class="fq-help">One-time changes at a chosen age. They show as numbered markers on the chart.</p>
        {input.events.length === 0 && <p>No events yet.</p>}
        {[...input.events].sort((a, b) => a.age - b.age).map((e) => {
          const fi = typeInfo(e.type);
          return (
            <div class="fq-tl__item fq-tl__event">
              <div class="fq-field">
                <label for={`tl-e-${e.id}-type`}>Event</label>
                <select id={`tl-e-${e.id}-type`} class="fq-select" value={e.type} onChange={(ev) => {
                  const t = (ev.target as HTMLSelectElement).value as EventType;
                  setEvent(e.id, { type: t, label: typeInfo(t).defaultLabel, value: t === 'pause' ? 1 : t === 'fall' ? -20 : e.value });
                  setText((x) => { const y = { ...x }; delete y[`e-${e.id}-x`]; return y; });
                  setPreset('');
                }}>{EVENT_TYPES.map((t) => <option value={t.id}>{t.label}</option>)}</select>
              </div>
              <div class="fq-field">
                <label for={`tl-e-${e.id}-label`}>Name</label>
                <input id={`tl-e-${e.id}-label`} class="fq-input" type="text" maxLength={40} value={e.label} onInput={(ev) => { setEvent(e.id, { label: (ev.target as HTMLInputElement).value }); setPreset(''); }} />
              </div>
              <Field id={`tl-e-${e.id}-age`} label="At age" value={val(`e-${e.id}-age`, e.age)} onInput={(v) => setNum(`e-${e.id}-age`, v, (n) => setEvent(e.id, { age: Math.round(n) }))} error={err[`e-${e.id}-age`]} />
              {fi.field === 'amount'
                ? <Field id={`tl-e-${e.id}-x`} label={fi.fieldLabel} prefix={c.symbol} value={val(`e-${e.id}-x`, e.amount)} onInput={(v) => setNum(`e-${e.id}-x`, v, (n) => setEvent(e.id, { amount: n }))} error={err[`e-${e.id}-x`]} />
                : <Field id={`tl-e-${e.id}-x`} label={fi.fieldLabel} value={val(`e-${e.id}-x`, e.value)} onInput={(v) => setNum(`e-${e.id}-x`, v, (n) => setEvent(e.id, { value: n }))} error={err[`e-${e.id}-x`]} />}
              <button type="button" class="fq-tl__remove" onClick={() => { setInput((x) => ({ ...x, events: x.events.filter((y) => y.id !== e.id) })); setPreset(''); }}>Remove<span class="fq-visually-hidden"> {e.label}</span></button>
            </div>
          );
        })}
        <button type="button" class="fq-btn fq-btn--secondary" onClick={() => {
          setInput((x) => ({ ...x, events: [...x.events, { id: newId(), age: Math.min(x.retireAge, x.startAge + 15), type: 'withdraw', amount: Math.round(x.salary * 0.8), value: 0, label: 'Big expense' }] }));
          setPreset('');
        }}>Add an event</button>
      </fieldset>

      <section class="fq-panel fq-planner__results" aria-labelledby="tl-results" aria-live="polite">
        <h2 id="tl-results">4. Your money by age</h2>
        {!r ? <p>Fix the highlighted boxes to see the projection.</p> : (
          <>
            <div class="fq-stats">
              <div class="fq-stat"><span class="fq-stat__value">{f(r.finalInvested)}</span><span class="fq-stat__label">Invested, at age {input.retireAge}</span></div>
              <div class="fq-stat"><span class="fq-stat__value">{f(r.finalInvestedToday)}</span><span class="fq-stat__label">The same in today's money ({input.inflation}% inflation)</span></div>
              <div class="fq-stat"><span class="fq-stat__value">{f(r.finalCash)}</span><span class="fq-stat__label">If you saved but never invested</span></div>
              <div class="fq-stat"><span class="fq-stat__value">{f(r.totalGrowth)}</span><span class="fq-stat__label">Total growth from investing</span></div>
            </div>
            <ul class="fq-tl__notes">
              {r.growthTakesOver !== null && <li>From age <strong>{r.growthTakesOver}</strong>, your money earns more each year than you save. Growth takes over.</li>}
              {r.rows.some((row) => row.saving === 0 && row.invested > 0) && <li>In years where you save nothing, your money still grows from returns. It does not stand still.</li>}
              {r.rows.some((row) => row.saving < 0) && <li>In some years you spend more than you earn, so money comes out of your investments.</li>}
              {r.ranOut && <li class="fq-tl__warn"><span class="fq-tag fq-tag--risky"><span aria-hidden="true">!</span>Ran out</span> Your investments reach zero at some point. Spending is higher than income for too long.</li>}
              <li>Investing adds <strong>{f(r.finalInvested - r.finalCash)}</strong> compared with keeping the same savings as cash.</li>
            </ul>
            <div class="fq-check">
              <input id="tl-today" type="checkbox" checked={today} onChange={(ev) => setToday((ev.target as HTMLInputElement).checked)} />
              <label for="tl-today">Show in today's money (after inflation)</label>
            </div>
            <LineChart
              title={today ? "Balance by age, in today's money" : 'Balance by age'}
              xTitle="Age"
              xLabels={r.rows.map((row) => row.age)}
              markers={markers}
              series={[
                { name: 'Invested', color: 'var(--fq-series-1)', values: r.rows.map(shown) },
                { name: 'Saved, not invested', color: 'var(--fq-series-2)', values: r.rows.map((row, i) => (today ? row.cash / infl ** (i + 1) : row.cash)) },
              ]}
              format={f}
              formatAxis={(v) => compact(v, c.symbol)}
            />
            {markers.length > 0 && (
              <ol class="fq-tl__markers">{markers.map((m) => <li>{m.label}</li>)}</ol>
            )}
            <details class="fq-others">
              <summary>Year by year</summary>
              <div class="fq-scroll">
                <table class="fq-table">
                  <thead><tr><th scope="col">Age</th><th scope="col" class="num">Salary</th><th scope="col" class="num">Spending</th><th scope="col" class="num">Saved</th><th scope="col" class="num">Return</th><th scope="col" class="num">Growth</th><th scope="col">Event</th><th scope="col" class="num">Invested</th></tr></thead>
                  <tbody>{r.rows.map((row) => (
                    <tr><th scope="row">{row.age}</th><td class="num">{f(row.salary)}</td><td class="num">{f(row.spending)}</td><td class="num">{f(row.saving)}</td><td class="num">{row.returnRate}%</td><td class="num">{f(row.growth)}</td><td>{row.events.join(', ')}{row.eventAmount ? ` (${f(row.eventAmount)})` : ''}</td><td class="num">{f(shown(row))}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            </details>
          </>
        )}
      </section>
    </div>
  );
}
