// Time value of money: present value and future value. Pure functions, unit tested.
// Rates are yearly percentages. Yearly compounding, as in most textbooks. Yearly savings are added at the end of each year.

const g = (rate: number) => 1 + rate / 100;

/** What an amount today grows to: FV = PV × (1 + r)^n */
export function fvLump(pv: number, rate: number, years: number): number {
  return pv * g(rate) ** years;
}

/** What an amount in the future is worth today: PV = FV ÷ (1 + r)^n */
export function pvLump(fv: number, rate: number, years: number): number {
  return fv / g(rate) ** years;
}

/** What the same saving every year grows to: FV = P × ((1 + r)^n − 1) ÷ r */
export function fvAnnuity(payment: number, rate: number, years: number): number {
  const r = rate / 100;
  if (r === 0) return payment * years;
  return payment * ((1 + r) ** years - 1) / r;
}

/** The yearly rate that turns `pv` into `fv` in `years`: r = (FV ÷ PV)^(1/n) − 1 */
export function breakEvenRate(pv: number, fv: number, years: number): number {
  if (pv <= 0 || fv <= 0 || years <= 0) return NaN;
  return ((fv / pv) ** (1 / years) - 1) * 100;
}

/** Balance at the end of each year (index 0 = start) for a lump sum. */
export function lumpPath(pv: number, rate: number, years: number): number[] {
  return Array.from({ length: years + 1 }, (_, i) => fvLump(pv, rate, i));
}

/** Balance at the end of each year (index 0 = start) when saving `payment` at the end of every year. */
export function annuityPath(payment: number, rate: number, years: number): number[] {
  return Array.from({ length: years + 1 }, (_, i) => fvAnnuity(payment, rate, i));
}

export interface SaverInput { payment: number; rate: number; fromAge: number; toAge: number; endAge: number }

/**
 * Someone saves `payment` at the end of each year of age fromAge..toAge (inclusive),
 * then leaves the money invested until endAge. Returns the balance at each age from `startAge` to `endAge`.
 */
export function saverPath(s: SaverInput, startAge: number): { ages: number[]; balances: number[]; contributed: number; final: number } {
  const ages: number[] = []; const balances: number[] = [];
  let b = 0; let contributed = 0;
  for (let age = startAge; age <= s.endAge; age++) {
    b = b * g(s.rate);
    if (age >= s.fromAge && age <= s.toAge) { b += s.payment; contributed += s.payment; }
    ages.push(age); balances.push(b);
  }
  return { ages, balances, contributed, final: b };
}

// ---- Salary, spending and savings to retirement (the year-by-year table) ----------------------------

export interface SpendingStage { throughAge: number; amount: number; note: string }

export interface SalaryPlanInput {
  startAge: number;
  retireAge: number;
  salary: number;
  salaryGrowth: number;
  returnRate: number;
  stages: SpendingStage[];
  /** Expenses typed into single cells of the table, by age. They replace the stage amount for that year. */
  overrides?: Record<number, number>;
  /** Salaries typed into single cells, by age (a job change, or a year with no raise). Later years grow from the typed salary. */
  salaryOverrides?: Record<number, number>;
}

export interface SalaryRow {
  year: number;
  age: number;
  salary: number;
  /** What the salary would be with normal growth from last year. */
  projectedSalary: number;
  /** Change from last year's salary, in percent (null in the first year). */
  salaryChange: number | null;
  salaryOverridden: boolean;
  expenses: number;
  saving: number;
  /** Total saved in the stage, shown on the last row of each stage (null on other rows). */
  stageTotal: number | null;
  /** Savings kept as cash, added up (no growth). */
  cash: number;
  /** Savings invested: last year's balance grows by the return, then this year's saving is added. */
  invested: number;
  overridden: boolean;
}

export interface SalaryPlanResult { rows: SalaryRow[]; q1: number; q2: number; totalGrowth: number }

/** Which stage an age belongs to: the first stage whose "through age" is at or after it. */
export function stageIndexFor(stages: SpendingStage[], age: number): number {
  const i = stages.findIndex((s) => age <= s.throughAge);
  return i === -1 ? stages.length - 1 : i;
}

export function salaryPlan(p: SalaryPlanInput): SalaryPlanResult {
  const rows: SalaryRow[] = [];
  let salary = p.salary; let cash = 0; let invested = 0; let stageSum = 0;
  const r = p.returnRate / 100;
  for (let age = p.startAge; age <= p.retireAge; age++) {
    const previous = salary;
    if (age > p.startAge) salary *= 1 + p.salaryGrowth / 100;
    const projectedSalary = salary;
    const salaryOverridden = p.salaryOverrides?.[age] !== undefined;
    if (salaryOverridden) salary = p.salaryOverrides![age];
    const salaryChange = age > p.startAge && previous > 0 ? (salary / previous - 1) * 100 : null;
    const si = stageIndexFor(p.stages, age);
    const overridden = p.overrides?.[age] !== undefined;
    const expenses = overridden ? p.overrides![age] : p.stages[si]?.amount ?? 0;
    const saving = salary - expenses;
    cash += saving;
    invested = invested * (1 + r) + saving;
    stageSum += saving;
    const lastOfStage = age === p.retireAge || stageIndexFor(p.stages, age + 1) !== si;
    rows.push({ year: age - p.startAge + 1, age, salary, projectedSalary, salaryChange, salaryOverridden, expenses, saving, stageTotal: lastOfStage ? stageSum : null, cash, invested, overridden });
    if (lastOfStage) stageSum = 0;
  }
  const q1 = cash; const q2 = invested;
  return { rows, q1, q2, totalGrowth: q2 - q1 };
}

/** The question from the reference sheet. */
export const SHEET_PLAN: SalaryPlanInput = {
  startAge: 22, retireAge: 60, salary: 75000, salaryGrowth: 3, returnRate: 6,
  stages: [
    { throughAge: 30, amount: 40000, note: 'Rent, student loan, food, travel, clothes, wedding' },
    { throughAge: 40, amount: 60000, note: 'Home loan, food, children, travel, clothes, utilities' },
    { throughAge: 50, amount: 75000, note: 'Children\'s education, home loan, travel, utilities, food' },
    { throughAge: 60, amount: 60000, note: 'Home loan, food, travel, utilities, clothes' },
  ],
};
