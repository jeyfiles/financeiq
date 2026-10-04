// College Money Planner maths. Pure functions, unit tested. Amounts are in the reader's currency.

export interface College {
  id: string;
  name: string;
  years: number;
  /** Costs for one year, at today's prices. */
  tuition: number;
  housing: number;
  books: number;
  travel: number;
  other: number;
  /** Scholarship per year. If not renewable, it is paid in year 1 only. */
  scholarship: number;
  renewable: boolean;
  /** Grants or other aid per year that does not have to be paid back. */
  grants: number;
}

export type StudyInterest = 'compound' | 'simple' | 'none';

export interface Funding {
  /** Total family help for the whole course. */
  family: number;
  /** Your own savings for college, in total. */
  savings: number;
  /** What you earn from work each year while studying. */
  workPerYear: number;
  /** Yearly loan interest rate in percent. */
  loanRate: number;
  repayYears: number;
  /** How interest is charged while you study and before repayment starts. */
  studyInterest: StudyInterest;
  /** Months between the end of the course and the first repayment. */
  graceMonths: number;
  /** How much costs rise each year, in percent. */
  costGrowth: number;
  /** Expected salary for the first year of work, before tax. 0 if not known. */
  salary: number;
  /** "What if": the scholarship stops after year 1. */
  loseScholarship: boolean;
}

export interface YearRow { year: number; cost: number; aid: number; work: number; family: number; borrowed: number }

export interface CollegeResult {
  rows: YearRow[];
  totalCost: number;
  totalAid: number;
  netCost: number;
  paidByYou: number;
  borrowed: number;
  /** Interest added while studying and in the months before repayment. */
  studyInterest: number;
  /** What you owe when repayment starts. */
  balanceAtRepayment: number;
  monthlyPayment: number;
  repayInterest: number;
  totalInterest: number;
  /** Everything you and your family pay: the cost after aid, plus all loan interest. */
  totalPaid: number;
  /** Family help and savings not needed for this college. */
  leftover: number;
  /** Borrowing divided by the expected first year salary. null if no salary was given. */
  debtToSalary: number | null;
  /** Monthly payment as a share of monthly salary before tax. null if no salary was given. */
  paymentShare: number | null;
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const pos = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

function payment(principal: number, annualRate: number, months: number): number {
  if (principal <= 0) return 0;
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - (1 + r) ** -months);
}

export function planCollege(c: College, f: Funding): CollegeResult {
  const years = Math.min(8, Math.max(1, Math.round(c.years)));
  const growth = pos(f.costGrowth) / 100;
  const yearCost = pos(c.tuition) + pos(c.housing) + pos(c.books) + pos(c.travel) + pos(c.other);
  let pool = pos(f.family) + pos(f.savings);
  const rows: YearRow[] = [];
  let studyInterest = 0;
  const r = pos(f.loanRate) / 100;

  for (let y = 1; y <= years; y++) {
    const cost = yearCost * (1 + growth) ** (y - 1);
    const scholarshipThisYear = y === 1 || (c.renewable && !f.loseScholarship) ? pos(c.scholarship) : 0;
    const aid = Math.min(cost, pos(c.grants) + scholarshipThisYear);
    let left = cost - aid;
    const work = Math.min(left, pos(f.workPerYear)); left -= work;
    const family = Math.min(left, pool); left -= family; pool -= family;
    const borrowed = left;
    // Money for year y is borrowed at the start of that year. Interest runs until repayment starts.
    const months = 12 * (years - y + 1) + Math.max(0, Math.round(f.graceMonths));
    if (borrowed > 0 && r > 0) {
      if (f.studyInterest === 'compound') studyInterest += borrowed * ((1 + r / 12) ** months - 1);
      else if (f.studyInterest === 'simple') studyInterest += borrowed * (r / 12) * months;
    }
    rows.push({ year: y, cost: r2(cost), aid: r2(aid), work: r2(work), family: r2(family), borrowed: r2(borrowed) });
  }

  const sum = (k: keyof YearRow) => rows.reduce((a, row) => a + row[k], 0);
  const totalCost = sum('cost');
  const totalAid = sum('aid');
  const borrowed = sum('borrowed');
  const balance = borrowed + studyInterest;
  const n = Math.max(1, Math.round(f.repayYears * 12));
  const monthly = payment(balance, pos(f.loanRate), n);
  const repayInterest = balance > 0 ? monthly * n - balance : 0;
  const totalInterest = studyInterest + repayInterest;
  const salary = pos(f.salary);
  return {
    rows,
    totalCost: r2(totalCost),
    totalAid: r2(totalAid),
    netCost: r2(totalCost - totalAid),
    paidByYou: r2(sum('work') + sum('family')),
    borrowed: r2(borrowed),
    studyInterest: r2(studyInterest),
    balanceAtRepayment: r2(balance),
    monthlyPayment: r2(monthly),
    repayInterest: r2(repayInterest),
    totalInterest: r2(totalInterest),
    totalPaid: r2(totalCost - totalAid + totalInterest),
    leftover: r2(pool),
    debtToSalary: salary ? borrowed / salary : null,
    paymentShare: salary ? monthly / (salary / 12) : null,
  };
}

/** Example colleges in base units (scaled to the reader's currency by the page). */
export const EXAMPLE_COLLEGES: College[] = [
  { id: 'a', name: 'College A', years: 4, tuition: 20000, housing: 9000, books: 1200, travel: 600, other: 1500, scholarship: 8000, renewable: true, grants: 0 },
  { id: 'b', name: 'College B', years: 4, tuition: 12000, housing: 3000, books: 1200, travel: 1500, other: 1000, scholarship: 0, renewable: false, grants: 1000 },
];

export const EXAMPLE_FUNDING: Funding = {
  family: 30000, savings: 5000, workPerYear: 3000, loanRate: 7, repayYears: 10,
  studyInterest: 'simple', graceMonths: 6, costGrowth: 3, salary: 40000, loseScholarship: false,
};

/** Money fields that change with currency. */
export const COLLEGE_MONEY_FIELDS = ['tuition', 'housing', 'books', 'travel', 'other', 'scholarship', 'grants'] as const;
export const FUNDING_MONEY_FIELDS = ['family', 'savings', 'workPerYear', 'salary'] as const;
