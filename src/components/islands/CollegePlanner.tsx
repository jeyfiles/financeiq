// College Money Planner: compare up to three colleges on the full cost of attending,
// how the gap is paid, the loan you would need and what it costs to pay back.
import { useEffect, useRef, useState } from 'preact/hooks';
import Field, { num, check } from './Field';
import StackBars from './StackBars';
import { useCurrency } from '../../lib/useCurrency';
import { tidy } from '../../lib/useRescale';
import { currencyByCode, format } from '../../lib/money';
import { readJSON, writeJSON, markDone } from '../../lib/storage';
import {
  planCollege, EXAMPLE_COLLEGES, EXAMPLE_FUNDING, COLLEGE_MONEY_FIELDS, FUNDING_MONEY_FIELDS,
  type College, type Funding, type StudyInterest,
} from '../../lib/college';

type Str<T> = { [K in keyof T]: T[K] extends number ? string : T[K] };
type CollegeForm = Str<College>;
type FundingForm = Str<Funding>;

const toForm = <T extends object>(o: T): Str<T> =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'number' ? String(v) : v])) as Str<T>;
const toNum = (v: string) => num(v) ?? 0;

const MAX = 3;
const STORE = 'college';
interface Saved { v: 1; currency: string; colleges: CollegeForm[]; funding: FundingForm }

const COST_FIELDS: { key: keyof College; label: string; help?: string }[] = [
  { key: 'tuition', label: 'Tuition and fees', help: 'Per year, before any scholarship.' },
  { key: 'housing', label: 'Housing and food', help: 'Hostel or rent, and meals. Living at home still costs something.' },
  { key: 'books', label: 'Books, laptop and supplies' },
  { key: 'travel', label: 'Travel', help: 'Commuting, or trips home.' },
  { key: 'other', label: 'Other costs', help: 'Phone, clothes, health, fun.' },
];

const STUDY_INTEREST: { value: StudyInterest; label: string; help: string }[] = [
  { value: 'simple', label: 'Builds up as simple interest', help: 'Interest adds up while you study and is added to the loan when repayment starts. US federal unsubsidized loans and many Indian bank education loans work this way.' },
  { value: 'compound', label: 'Builds up and compounds', help: 'Interest is added to the loan every month while you study, and then earns interest itself. Some private loans work this way. Check your offer.' },
  { value: 'none', label: 'Not charged while I study', help: 'Some loans, such as US Direct Subsidized Loans, charge no interest until repayment starts.' },
];

function emptyCollege(n: number): CollegeForm {
  return toForm<College>({ id: `c${Date.now()}`, name: `College ${String.fromCharCode(64 + n)}`, years: 4, tuition: 0, housing: 0, books: 0, travel: 0, other: 0, scholarship: 0, renewable: false, grants: 0 });
}

export default function CollegePlanner() {
  const c = useCurrency();
  const [colleges, setColleges] = useState<CollegeForm[]>(EXAMPLE_COLLEGES.map(toForm));
  const [funding, setFunding] = useState<FundingForm>(toForm(EXAMPLE_FUNDING));
  /** The currency the numbers in the form are written in. */
  const [formCur, setFormCur] = useState('USD');
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState('');
  const results = useRef<HTMLHeadingElement>(null);

  // Load saved work once.
  useEffect(() => {
    const s = readJSON<Saved | null>(STORE, null);
    if (s && s.v === 1 && Array.isArray(s.colleges) && s.colleges.length && s.funding && currencyByCode(s.currency)) {
      setColleges(s.colleges.slice(0, MAX));
      setFunding({ ...toForm(EXAMPLE_FUNDING), ...s.funding });
      setFormCur(s.currency);
    }
    setLoaded(true);
    markDone('lab:college');
  }, []);

  // When the currency changes, rescale every amount so the example stays believable.
  useEffect(() => {
    if (!loaded || formCur === c.code) return;
    const from = currencyByCode(formCur);
    if (!from) { setFormCur(c.code); return; }
    const k = c.scale / from.scale;
    const scale = (v: string) => (num(v) === null ? v : tidy(Number(v) * k));
    setColleges((list) => list.map((col) => {
      const next = { ...col };
      for (const f of COLLEGE_MONEY_FIELDS) (next as Record<string, unknown>)[f] = scale(col[f] as string);
      return next;
    }));
    setFunding((fd) => {
      const next = { ...fd };
      for (const f of FUNDING_MONEY_FIELDS) (next as Record<string, unknown>)[f] = scale(fd[f] as string);
      return next;
    });
    setFormCur(c.code);
  }, [c.code, loaded, formCur]);

  // Save on every change.
  useEffect(() => {
    if (loaded && formCur === c.code) writeJSON(STORE, { v: 1, currency: formCur, colleges, funding } satisfies Saved);
  }, [colleges, funding, formCur, loaded]);

  const setCol = (i: number, key: keyof College, value: string | boolean) =>
    setColleges((list) => list.map((col, k) => (k === i ? { ...col, [key]: value } : col)));
  const setFund = (key: keyof Funding, value: string | boolean) => setFunding((fd) => ({ ...fd, [key]: value }));

  const f = (n: number) => format(n, c);
  const fc = (n: number) => format(n, c, { cents: n < 100 && n > 0 });

  // Validation
  const colErrors = colleges.map((col) => {
    const e: Partial<Record<keyof College, string>> = {};
    if (!col.name.trim()) e.name = 'Give this college a name.';
    e.years = check(col.years, 'Years', 1, 8);
    for (const { key, label } of COST_FIELDS) e[key] = check(col[key] as string, label, 0, 1e9);
    e.scholarship = check(col.scholarship, 'Scholarship', 0, 1e9);
    e.grants = check(col.grants, 'Grants', 0, 1e9);
    return e;
  });
  const fundErrors: Partial<Record<keyof Funding, string>> = {
    family: check(funding.family, 'Family help', 0, 1e10),
    savings: check(funding.savings, 'Savings', 0, 1e10),
    workPerYear: check(funding.workPerYear, 'Work', 0, 1e9),
    loanRate: check(funding.loanRate, 'Interest rate', 0, 30),
    repayYears: check(funding.repayYears, 'Years to repay', 1, 30),
    graceMonths: check(funding.graceMonths, 'Months', 0, 60),
    costGrowth: check(funding.costGrowth, 'Cost rise', 0, 20),
    salary: check(funding.salary, 'Salary', 0, 1e10),
  };
  const ok = !colErrors.some((e) => Object.values(e).some(Boolean)) && !Object.values(fundErrors).some(Boolean);

  const fundingNum: Funding = {
    family: toNum(funding.family), savings: toNum(funding.savings), workPerYear: toNum(funding.workPerYear),
    loanRate: toNum(funding.loanRate), repayYears: toNum(funding.repayYears), studyInterest: funding.studyInterest,
    graceMonths: toNum(funding.graceMonths), costGrowth: toNum(funding.costGrowth), salary: toNum(funding.salary),
    loseScholarship: funding.loseScholarship,
  };
  const plans = ok ? colleges.map((col) => ({
    col,
    r: planCollege({ ...col, years: toNum(col.years), tuition: toNum(col.tuition), housing: toNum(col.housing), books: toNum(col.books), travel: toNum(col.travel), other: toNum(col.other), scholarship: toNum(col.scholarship), grants: toNum(col.grants) }, fundingNum),
  })) : [];
  const ranked = [...plans].sort((a, b) => a.r.totalPaid - b.r.totalPaid);
  const cheapest = ranked[0];
  const nextCheapest = ranked[1];
  const hasRenewable = colleges.some((col) => col.renewable && toNum(col.scholarship) > 0);

  const reset = () => {
    setColleges(EXAMPLE_COLLEGES.map(toForm));
    setFunding(toForm(EXAMPLE_FUNDING));
    setFormCur('USD');
    setStatus('Reset to the example colleges.');
  };
  const clearAll = () => {
    setColleges([emptyCollege(1), emptyCollege(2)]);
    setFunding(toForm({ ...EXAMPLE_FUNDING, family: 0, savings: 0, workPerYear: 0, salary: 0 }));
    setFormCur(c.code);
    setStatus('All amounts cleared. Enter your own numbers.');
  };

  return (
    <div class="fq-planner">
      <div class="fq-planner__bar">
        <p class="fq-help">Your entries are saved in this browser, so you can come back to them. Amounts are per year unless a box says otherwise.</p>
        <p><a href="#pl-results">Jump to the comparison</a></p>
        <div class="fq-btn-row fq-planner__actions">
          <button type="button" class="fq-btn fq-btn--secondary" onClick={clearAll}>Start with empty boxes</button>
          <button type="button" class="fq-btn fq-btn--secondary" onClick={reset}>Reset to the example</button>
        </div>
        <p class="fq-help" aria-live="polite">{status}</p>
      </div>

      <section aria-labelledby="pl-colleges">
        <h2 id="pl-colleges">1. Your colleges</h2>
        <div class="fq-planner__cols">
          {colleges.map((col, i) => {
            const e = colErrors[i];
            const id = (k: string) => `pl-${i}-${k}`;
            return (
              <fieldset class="fq-panel fq-planner__college">
                <legend class="fq-visually-hidden">{col.name || `College ${i + 1}`}</legend>
                <div class="fq-field">
                  <label for={id('name')}>College name</label>
                  <input id={id('name')} class="fq-input fq-planner__name" type="text" value={col.name} maxLength={60}
                    aria-invalid={e.name ? 'true' : undefined} aria-describedby={e.name ? `${id('name')}-err` : undefined}
                    onInput={(ev) => setCol(i, 'name', (ev.target as HTMLInputElement).value)} />
                  {e.name && <p class="fq-error" id={`${id('name')}-err`}>{e.name}</p>}
                </div>
                <Field id={id('years')} label="Length of the course" suffix="years" value={col.years} onInput={(v) => setCol(i, 'years', v)} error={e.years} min={1} max={8} />
                <h3 class="fq-planner__sub">Costs each year</h3>
                {COST_FIELDS.map(({ key, label, help }) => (
                  <Field id={id(key)} label={label} prefix={c.symbol} value={col[key] as string} onInput={(v) => setCol(i, key, v)} error={e[key]} min={0} help={i === 0 ? help : undefined} />
                ))}
                <h3 class="fq-planner__sub">Money you do not pay back</h3>
                <Field id={id('scholarship')} label="Scholarship per year" prefix={c.symbol} value={col.scholarship} onInput={(v) => setCol(i, 'scholarship', v)} error={e.scholarship} min={0} />
                <div class="fq-check">
                  <input id={id('renew')} type="checkbox" checked={col.renewable} onChange={(ev) => setCol(i, 'renewable', (ev.target as HTMLInputElement).checked)} />
                  <label for={id('renew')}>The scholarship continues every year</label>
                </div>
                <Field id={id('grants')} label="Grants or other aid per year" prefix={c.symbol} value={col.grants} onInput={(v) => setCol(i, 'grants', v)} error={e.grants} min={0} help={i === 0 ? 'Need-based grants, fee waivers or government aid.' : undefined} />
                {colleges.length > 2 && (
                  <button type="button" class="fq-btn fq-btn--secondary fq-planner__remove" onClick={() => setColleges((list) => list.filter((_, k) => k !== i))}>Remove {col.name || 'this college'}</button>
                )}
              </fieldset>
            );
          })}
        </div>
        {colleges.length < MAX && (
          <div class="fq-btn-row">
            <button type="button" class="fq-btn fq-btn--secondary" onClick={() => setColleges((list) => [...list, emptyCollege(list.length + 1)])}>Add a third college</button>
          </div>
        )}
      </section>

      <div class="fq-planner__two">
        <fieldset class="fq-panel">
          <legend><h2 class="fq-planner__legend">2. How you will pay</h2></legend>
          <p class="fq-help">Used in this order: scholarships and grants, then your work, then family help and savings. A loan covers whatever is left.</p>
          <Field id="pl-family" label="Family help for the whole course" prefix={c.symbol} value={funding.family} onInput={(v) => setFund('family', v)} error={fundErrors.family} min={0} />
          <Field id="pl-savings" label="Your own savings for college, in total" prefix={c.symbol} value={funding.savings} onInput={(v) => setFund('savings', v)} error={fundErrors.savings} min={0} />
          <Field id="pl-work" label="What you can earn from work each year" prefix={c.symbol} value={funding.workPerYear} onInput={(v) => setFund('workPerYear', v)} error={fundErrors.workPerYear} min={0} help="Part-time or holiday work, after tax." />
        </fieldset>

        <fieldset class="fq-panel">
          <legend><h2 class="fq-planner__legend">3. Loan and assumptions</h2></legend>
          <Field id="pl-rate" label="Loan interest rate" suffix="% a year" step={0.1} value={funding.loanRate} onInput={(v) => setFund('loanRate', v)} error={fundErrors.loanRate} min={0} help="Check the rate in the lender's offer. Rates differ by country and lender." />
          <Field id="pl-repay" label="Years to pay it back" suffix="years" value={funding.repayYears} onInput={(v) => setFund('repayYears', v)} error={fundErrors.repayYears} min={1} />
          <div class="fq-field">
            <label for="pl-study">Interest while you study</label>
            <select id="pl-study" class="fq-select" value={funding.studyInterest} aria-describedby="pl-study-help"
              onChange={(ev) => setFund('studyInterest', (ev.target as HTMLSelectElement).value as StudyInterest)}>
              {STUDY_INTEREST.map((o) => <option value={o.value}>{o.label}</option>)}
            </select>
            <p class="fq-help" id="pl-study-help">{STUDY_INTEREST.find((o) => o.value === funding.studyInterest)?.help}</p>
          </div>
          <Field id="pl-grace" label="Months after the course before repayment starts" suffix="months" value={funding.graceMonths} onInput={(v) => setFund('graceMonths', v)} error={fundErrors.graceMonths} min={0} help="Often 6 months for US federal loans, and up to 12 months for many Indian bank loans." />
          <Field id="pl-growth" label="How much costs rise each year" suffix="%" step={0.5} value={funding.costGrowth} onInput={(v) => setFund('costGrowth', v)} error={fundErrors.costGrowth} min={0} />
          <Field id="pl-salary" label="Expected salary in your first job, per year" prefix={c.symbol} value={funding.salary} onInput={(v) => setFund('salary', v)} error={fundErrors.salary} min={0} help="Before tax. Use 0 if you do not know yet." />
        </fieldset>
      </div>

      <section class="fq-panel fq-planner__results" aria-labelledby="pl-results" aria-live="polite">
        <h2 id="pl-results" tabIndex={-1} ref={results}>4. What each college really costs</h2>
        {!ok && <p>Fix the highlighted boxes to see the comparison.</p>}
        {ok && (
          <>
            {hasRenewable && (
              <div class="fq-check fq-planner__whatif">
                <input id="pl-lose" type="checkbox" checked={funding.loseScholarship} onChange={(ev) => setFund('loseScholarship', (ev.target as HTMLInputElement).checked)} />
                <label for="pl-lose"><strong>What if</strong> the scholarship stops after year 1? (For example, if grades drop below the level it needs.)</label>
              </div>
            )}
            {cheapest && nextCheapest && (
              <p class="fq-big">
                {cheapest.r.totalPaid === nextCheapest.r.totalPaid
                  ? <>These colleges cost the same in total.</>
                  : <><strong>{cheapest.col.name}</strong> costs you and your family about <strong>{f(nextCheapest.r.totalPaid - cheapest.r.totalPaid)}</strong> less than {nextCheapest.col.name}, including loan interest.</>}
              </p>
            )}
            <StackBars
              title="Where the money comes from, by college"
              totalLabel="Total, with interest"
              format={f}
              segments={[
                { label: 'Scholarships and grants', color: 'var(--fq-cat-1)' },
                { label: 'Paid by you and family', color: 'var(--fq-cat-2)' },
                { label: 'Borrowed', color: 'var(--fq-cat-3)' },
                { label: 'Loan interest', color: 'var(--fq-cat-4)' },
              ]}
              rows={plans.map(({ col, r }) => ({ label: col.name, values: [r.totalAid, r.paidByYou, r.borrowed, r.totalInterest] }))}
            />
            <div class="fq-scroll">
              <table class="fq-table fq-planner__table">
                <caption>Side by side</caption>
                <thead><tr><th scope="col">For the whole course</th>{plans.map(({ col }) => <th scope="col" class="num">{col.name}</th>)}</tr></thead>
                <tbody>
                  <tr><th scope="row">Total cost of attending</th>{plans.map(({ r }) => <td class="num">{f(r.totalCost)}</td>)}</tr>
                  <tr><th scope="row">Scholarships and grants</th>{plans.map(({ r }) => <td class="num">{f(r.totalAid)}</td>)}</tr>
                  <tr><th scope="row">Cost after aid</th>{plans.map(({ r }) => <td class="num">{f(r.netCost)}</td>)}</tr>
                  <tr><th scope="row">Paid by work, family and savings</th>{plans.map(({ r }) => <td class="num">{f(r.paidByYou)}</td>)}</tr>
                  <tr><th scope="row">Borrowed</th>{plans.map(({ r }) => <td class="num">{f(r.borrowed)}</td>)}</tr>
                  <tr><th scope="row">Interest before repayment starts</th>{plans.map(({ r }) => <td class="num">{f(r.studyInterest)}</td>)}</tr>
                  <tr><th scope="row">Owed when repayment starts</th>{plans.map(({ r }) => <td class="num">{f(r.balanceAtRepayment)}</td>)}</tr>
                  <tr><th scope="row">Monthly repayment</th>{plans.map(({ r }) => <td class="num">{fc(r.monthlyPayment)}</td>)}</tr>
                  <tr><th scope="row">Total loan interest</th>{plans.map(({ r }) => <td class="num">{f(r.totalInterest)}</td>)}</tr>
                  <tr class="fq-planner__total"><th scope="row">Total paid by you and family</th>{plans.map(({ r }) => <td class="num">{f(r.totalPaid)}</td>)}</tr>
                  {plans.some(({ r }) => r.leftover > 0.5) && <tr><th scope="row">Family help and savings left over</th>{plans.map(({ r }) => <td class="num">{f(r.leftover)}</td>)}</tr>}
                </tbody>
              </table>
            </div>

            {fundingNum.salary > 0 && plans.some(({ r }) => r.borrowed > 0) && (
              <div class="fq-planner__salary">
                <h3>Compared with your expected salary</h3>
                <ul>
                  {plans.filter(({ r }) => r.borrowed > 0).map(({ col, r }) => (
                    <li>
                      <strong>{col.name}:</strong> you would borrow {Math.round((r.debtToSalary ?? 0) * 100)}% of one year's salary, and the repayment would take about {Math.round((r.paymentShare ?? 0) * 100)}% of your monthly pay before tax.
                      {(r.debtToSalary ?? 0) > 1 && <span class="fq-tag fq-tag--risky fq-planner__flag"><span aria-hidden="true">!</span>More than a year's salary</span>}
                    </li>
                  ))}
                </ul>
                <p class="fq-help">A common rule of thumb is to keep total borrowing for your studies below the salary you expect in your first year of work. It is a guide, not a promise: jobs and pay vary.</p>
              </div>
            )}

            <details class="fq-others">
              <summary>Year by year for each college</summary>
              {plans.map(({ col, r }) => (
                <div class="fq-scroll">
                  <table class="fq-table">
                    <caption>{col.name}</caption>
                    <thead><tr><th scope="col">Year</th><th scope="col" class="num">Cost</th><th scope="col" class="num">Aid</th><th scope="col" class="num">Work</th><th scope="col" class="num">Family and savings</th><th scope="col" class="num">Borrowed</th></tr></thead>
                    <tbody>{r.rows.map((row) => <tr><th scope="row">{row.year}</th><td class="num">{f(row.cost)}</td><td class="num">{f(row.aid)}</td><td class="num">{f(row.work)}</td><td class="num">{f(row.family)}</td><td class="num">{f(row.borrowed)}</td></tr>)}</tbody>
                  </table>
                </div>
              ))}
            </details>
          </>
        )}
      </section>
    </div>
  );
}
