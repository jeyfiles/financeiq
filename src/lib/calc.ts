// Pure money maths used by the calculators and the decisions. No browser code, so it is unit tested.
// Conventions: rates are yearly percentages (8 means 8% a year); compounding is monthly;
// deposits and payments happen at the end of each month.

const monthlyRate = (annualPct: number) => annualPct / 100 / 12;
const round2 = (n: number) => Math.round(n * 100) / 100;

export interface SavingsGoalInput { goal: number; saved: number; months: number; annualRate: number }
export interface SavingsGoalResult {
  monthly: number;
  deposits: number;
  interest: number;
  alreadyEnough: boolean;
  /** Balance at the end of each month, from month 0 (today) to the last month. */
  balances: number[];
}

/** How much to put aside each month to reach a goal. */
export function savingsGoal({ goal, saved, months, annualRate }: SavingsGoalInput): SavingsGoalResult {
  const n = Math.max(1, Math.round(months));
  const r = monthlyRate(Math.max(0, annualRate));
  const growth = (1 + r) ** n;
  const need = goal - saved * growth;
  let monthly = 0;
  if (need > 0) monthly = r === 0 ? need / n : (need * r) / (growth - 1);
  monthly = Math.ceil(monthly * 100) / 100;
  const balances = [saved];
  let b = saved;
  for (let m = 1; m <= n; m++) { b = b * (1 + r) + monthly; balances.push(round2(b)); }
  const deposits = round2(monthly * n);
  return { monthly, deposits, interest: round2(Math.max(0, b - saved - deposits)), alreadyEnough: need <= 0, balances };
}

export interface GrowthInput { monthly: number; annualRate: number; years: number; start?: number }

/** Balance at the end of each year (index 0 = today). */
export function growthByYear({ monthly, annualRate, years, start = 0 }: GrowthInput): number[] {
  const r = monthlyRate(annualRate);
  const out = [start];
  let b = start;
  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) b = b * (1 + r) + monthly;
    out.push(round2(b));
  }
  return out;
}

export interface StartInput { monthly: number; annualRate: number; startAge: number; delayYears: number; endAge: number }
export interface StartPlan { label: string; startAge: number; contributed: number; final: number; growth: number }
export interface StartResult { ages: number[]; now: number[]; later: number[]; planNow: StartPlan; planLater: StartPlan; difference: number }

/** Start saving now versus a few years later, with the same monthly amount, until the same age. */
export function startNowVsLater({ monthly, annualRate, startAge, delayYears, endAge }: StartInput): StartResult {
  const years = Math.max(1, endAge - startAge);
  const delay = Math.min(Math.max(0, delayYears), years);
  const now = growthByYear({ monthly, annualRate, years });
  const later = [0, ...Array(delay).fill(0).map(() => 0)].slice(0, delay + 1);
  const laterGrowth = growthByYear({ monthly, annualRate, years: years - delay });
  for (let i = 1; i < laterGrowth.length; i++) later.push(laterGrowth[i]);
  const ages = Array.from({ length: years + 1 }, (_, i) => startAge + i);
  const planNow: StartPlan = { label: 'Start now', startAge, contributed: monthly * 12 * years, final: now[years], growth: 0 };
  planNow.growth = round2(planNow.final - planNow.contributed);
  const planLater: StartPlan = { label: `Start ${delay} years later`, startAge: startAge + delay, contributed: monthly * 12 * (years - delay), final: later[years], growth: 0 };
  planLater.growth = round2(planLater.final - planLater.contributed);
  return { ages, now, later, planNow, planLater, difference: round2(planNow.final - planLater.final) };
}

/** Fixed monthly payment for a loan that is paid off in `months` payments. */
export function loanPayment(principal: number, annualRate: number, months: number): number {
  const n = Math.max(1, Math.round(months));
  const r = monthlyRate(annualRate);
  if (principal <= 0) return 0;
  if (r === 0) return round2(principal / n);
  return round2((principal * r) / (1 - (1 + r) ** -n));
}

export interface RealCostInput {
  price: number;
  /** Discount for paying the full price today, as a percentage (0 for none). */
  upfrontDiscount: number;
  months: number;
  annualRate: number;
  /** One-time fee to set up the plan (processing fee). */
  fee: number;
}
export interface CostOption { id: 'upfront' | 'plan'; label: string; today: number; monthly: number; months: number; total: number; extra: number }

/** Paying upfront versus an installment plan: what each really costs. */
export function realCost({ price, upfrontDiscount, months, annualRate, fee }: RealCostInput): { upfront: CostOption; plan: CostOption; saving: number } {
  const upfrontTotal = round2(price * (1 - Math.min(100, Math.max(0, upfrontDiscount)) / 100));
  const monthly = loanPayment(price, annualRate, months);
  const n = Math.max(1, Math.round(months));
  const planTotal = round2(monthly * n + fee);
  return {
    upfront: { id: 'upfront', label: 'Pay upfront', today: upfrontTotal, monthly: 0, months: 0, total: upfrontTotal, extra: round2(upfrontTotal - price) },
    plan: { id: 'plan', label: `Pay in ${n} installments`, today: fee, monthly, months: n, total: planTotal, extra: round2(planTotal - price) },
    saving: round2(planTotal - upfrontTotal),
  };
}

export interface MinimumPayResult { months: number; interest: number; totalPaid: number; neverEnds: boolean }

/**
 * Paying a card balance with only the minimum each month. A common rule for the minimum is
 * the month's interest plus `minPct` percent of the balance, with a floor amount.
 * No new spending is added. Stops after 50 years to avoid an endless loop.
 */
export function minimumPayoff(balance: number, annualRate: number, minPct: number, minFloor: number): MinimumPayResult {
  const r = monthlyRate(annualRate);
  let b = balance; let months = 0; let interest = 0; let paid = 0;
  while (b > 0.005 && months < 600) {
    const i = b * r;
    interest += i; b += i;
    const pay = Math.min(b, Math.max(i + (b - i) * minPct / 100, minFloor));
    if (pay <= i && b > minFloor) return { months, interest: round2(interest), totalPaid: round2(paid), neverEnds: true };
    b -= pay; paid += pay; months++;
  }
  return { months, interest: round2(interest), totalPaid: round2(paid), neverEnds: b > 0.005 };
}

/** What something costing `price` today costs after `years` of inflation at `rate` percent a year. */
export function futurePrice(price: number, rate: number, years: number): number {
  return round2(price * (1 + rate / 100) ** years);
}

/** Growth of a single amount with yearly compounding. */
export function compound(principal: number, rate: number, years: number): number {
  return round2(principal * (1 + rate / 100) ** years);
}
