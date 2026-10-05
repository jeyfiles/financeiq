// Life Savings Timeline: a year-by-year projection from the first job to retirement.
// Each year: salary minus spending = saving. Saving is invested at the end of the year at that year's return.
// The same saving is also tracked "not invested" (kept as cash) to show what investing adds.

export interface Stage {
  id: string;
  /** First age of this stage. The stage runs until the next stage starts, or retirement. */
  fromAge: number;
  /** Yearly spending in this stage. */
  spending: number;
  /** Save nothing in this stage: spend whatever you earn. */
  saveNothing: boolean;
  /** Yearly return for money invested during this stage, in percent. */
  returnRate: number;
}

export type EventType = 'withdraw' | 'add' | 'pause' | 'fall' | 'salary';
export interface LifeEvent {
  id: string;
  age: number;
  type: EventType;
  /** withdraw/add: the amount. salary: the new yearly salary. */
  amount: number;
  /** pause: number of years with no salary (a career break). fall: the return that year in percent (for example -20). */
  value: number;
  label: string;
}

export interface TimelineInput {
  startAge: number;
  retireAge: number;
  salary: number;
  salaryGrowth: number;
  stages: Stage[];
  events: LifeEvent[];
  /** Yearly inflation in percent, to show amounts in today's money. */
  inflation: number;
}

export interface TimelineRow {
  age: number;
  salary: number;
  spending: number;
  saving: number;
  returnRate: number;
  growth: number;
  eventAmount: number;
  events: string[];
  invested: number;
  cash: number;
  investedToday: number;
}

export interface TimelineResult {
  rows: TimelineRow[];
  finalInvested: number;
  finalCash: number;
  finalInvestedToday: number;
  totalSaved: number;
  totalGrowth: number;
  /** First age when the year's growth is bigger than the year's saving. null if never. */
  growthTakesOver: number | null;
  /** True if the invested balance would have gone below zero (spending more than you had). */
  ranOut: boolean;
}

const pos = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

export function stageFor(stages: Stage[], age: number): Stage | undefined {
  const sorted = [...stages].sort((a, b) => a.fromAge - b.fromAge);
  let found: Stage | undefined;
  for (const s of sorted) if (s.fromAge <= age) found = s;
  return found ?? sorted[0];
}

export function simulate(input: TimelineInput): TimelineResult {
  const start = Math.round(input.startAge);
  const end = Math.max(start, Math.round(input.retireAge)); // you earn and save from startAge up to and including retireAge
  const rows: TimelineRow[] = [];
  let salary = pos(input.salary);
  let invested = 0; let cash = 0; let totalSaved = 0; let totalGrowth = 0;
  let growthTakesOver: number | null = null; let ranOut = false;
  let breakYearsLeft = 0;
  const infl = 1 + pos(input.inflation) / 100;

  for (let age = start; age <= end; age++) {
    if (age > start) salary *= 1 + input.salaryGrowth / 100;
    const here = input.events.filter((e) => Math.round(e.age) === age);
    const labels: string[] = [];
    for (const e of here.filter((x) => x.type === 'salary')) { salary = pos(e.amount); labels.push(e.label); }
    for (const e of here.filter((x) => x.type === 'pause')) { breakYearsLeft = Math.max(breakYearsLeft, Math.max(1, Math.round(e.value))); labels.push(e.label); }
    const onBreak = breakYearsLeft > 0;
    if (onBreak) breakYearsLeft--;

    const stage = stageFor(input.stages, age);
    const earned = onBreak ? 0 : salary;
    const spending = stage?.saveNothing ? earned : pos(stage?.spending ?? 0);
    const saving = earned - spending; // can be negative: spending more than you earn
    const fall = here.find((x) => x.type === 'fall');
    if (fall) labels.push(fall.label);
    const rate = fall ? fall.value : stage?.returnRate ?? 0;

    const growth = invested * (rate / 100);
    let eventAmount = 0;
    for (const e of here) {
      if (e.type === 'withdraw') { eventAmount -= pos(e.amount); labels.push(e.label); }
      if (e.type === 'add') { eventAmount += pos(e.amount); labels.push(e.label); }
    }
    invested = invested + growth + saving + eventAmount;
    cash = cash + saving + eventAmount;
    if (invested < 0) { ranOut = true; invested = 0; }
    if (cash < 0) cash = 0;
    totalSaved += saving;
    totalGrowth += growth;
    if (growthTakesOver === null && saving > 0 && growth > saving) growthTakesOver = age;
    const years = age - start + 1;
    rows.push({ age, salary: earned, spending, saving, returnRate: rate, growth, eventAmount, events: labels, invested, cash, investedToday: invested / infl ** years });
  }
  const last = rows[rows.length - 1];
  return {
    rows,
    finalInvested: last?.invested ?? 0,
    finalCash: last?.cash ?? 0,
    finalInvestedToday: last?.investedToday ?? 0,
    totalSaved, totalGrowth, growthTakesOver, ranOut,
  };
}

let n = 0;
const id = () => `x${++n}`;

/** The worked example from the reference sheet: salary 75,000 growing 3%, spending by decade, 6% return, age 22 to 60. */
export function referenceExample(): TimelineInput {
  return {
    startAge: 22, retireAge: 60, salary: 75000, salaryGrowth: 3, inflation: 3,
    stages: [
      { id: id(), fromAge: 22, spending: 40000, saveNothing: false, returnRate: 6 },
      { id: id(), fromAge: 31, spending: 60000, saveNothing: false, returnRate: 6 },
      { id: id(), fromAge: 41, spending: 75000, saveNothing: false, returnRate: 6 },
      { id: id(), fromAge: 51, spending: 60000, saveNothing: false, returnRate: 6 },
    ],
    events: [],
  };
}

export const PRESETS: { id: string; label: string; build: () => TimelineInput }[] = [
  { id: 'reference', label: 'Spending changes each decade', build: referenceExample },
  {
    id: 'late', label: 'Saves nothing for the first 5 years',
    build: () => { const x = referenceExample(); x.stages = [{ ...x.stages[0], saveNothing: true }, { id: id(), fromAge: 27, spending: 40000, saveNothing: false, returnRate: 6 }, ...x.stages.slice(1)]; return x; },
  },
  {
    id: 'event', label: 'Life event at year 15',
    build: () => { const x = referenceExample(); x.events = [{ id: id(), age: 36, type: 'withdraw', amount: 60000, value: 0, label: 'Medical bill' }, { id: id(), age: 36, type: 'pause', amount: 0, value: 2, label: 'Two year career break' }]; return x; },
  },
  {
    id: 'stop', label: 'Stops saving at 45',
    build: () => { const x = referenceExample(); x.stages = [...x.stages.slice(0, 2), { id: id(), fromAge: 41, spending: 75000, saveNothing: false, returnRate: 6 }, { id: id(), fromAge: 45, spending: 0, saveNothing: true, returnRate: 6 }]; return x; },
  },
  {
    id: 'fall', label: 'Market falls 25% at age 50',
    build: () => { const x = referenceExample(); x.events = [{ id: id(), age: 50, type: 'fall', amount: 0, value: -25, label: 'Market fall' }]; return x; },
  },
];
