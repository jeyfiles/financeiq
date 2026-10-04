import { describe, it, expect } from 'vitest';
import { planCollege, EXAMPLE_COLLEGES, EXAMPLE_FUNDING, type College, type Funding } from '../../src/lib/college';

const base: College = { id: 'x', name: 'X', years: 2, tuition: 1000, housing: 0, books: 0, travel: 0, other: 0, scholarship: 0, renewable: false, grants: 0 };
const noMoney: Funding = { family: 0, savings: 0, workPerYear: 0, loanRate: 0, repayYears: 1, studyInterest: 'none', graceMonths: 0, costGrowth: 0, salary: 0, loseScholarship: false };

describe('planCollege', () => {
  it('adds up the cost of attendance with yearly growth', () => {
    const r = planCollege({ ...base, years: 3 }, { ...noMoney, costGrowth: 10 });
    expect(r.totalCost).toBeCloseTo(1000 + 1100 + 1210, 2);
  });
  it('pays in order: aid, work, family and savings, then a loan', () => {
    const r = planCollege({ ...base, grants: 200 }, { ...noMoney, workPerYear: 300, family: 600 });
    // Year 1: 1000 - 200 aid - 300 work = 500 from family (100 left). Year 2: 500 - 100 family = 400 borrowed.
    expect(r.rows[0]).toMatchObject({ aid: 200, work: 300, family: 500, borrowed: 0 });
    expect(r.rows[1]).toMatchObject({ aid: 200, work: 300, family: 100, borrowed: 400 });
    expect(r.borrowed).toBe(400);
    expect(r.paidByYou).toBe(1200);
    expect(r.netCost).toBe(1600);
  });
  it('a one-time scholarship is paid in year 1 only', () => {
    expect(planCollege({ ...base, scholarship: 500, renewable: false }, noMoney).totalAid).toBe(500);
    expect(planCollege({ ...base, scholarship: 500, renewable: true }, noMoney).totalAid).toBe(1000);
  });
  it('the what-if switch removes a renewable scholarship after year 1', () => {
    expect(planCollege({ ...base, scholarship: 500, renewable: true }, { ...noMoney, loseScholarship: true }).totalAid).toBe(500);
  });
  it('aid never counts for more than the cost', () => {
    const r = planCollege({ ...base, scholarship: 5000, renewable: true }, noMoney);
    expect(r.totalAid).toBe(2000);
    expect(r.netCost).toBe(0);
  });
  it('treats study interest as compound, simple or none', () => {
    const c = { ...base, years: 1 };
    const f = { ...noMoney, loanRate: 12, graceMonths: 12, repayYears: 10 };
    const comp = planCollege(c, { ...f, studyInterest: 'compound' });
    const simp = planCollege(c, { ...f, studyInterest: 'simple' });
    const none = planCollege(c, { ...f, studyInterest: 'none' });
    expect(comp.studyInterest).toBeCloseTo(1000 * (1.01 ** 24 - 1), 2);
    expect(simp.studyInterest).toBeCloseTo(240, 2);
    expect(none.studyInterest).toBe(0);
    expect(comp.balanceAtRepayment).toBeGreaterThan(simp.balanceAtRepayment);
    expect(none.monthlyPayment).toBeCloseTo(14.35, 2);
  });
  it('compares with salary when one is given', () => {
    const r = planCollege(base, { ...noMoney, loanRate: 6, repayYears: 10, salary: 4000 });
    expect(r.debtToSalary).toBeCloseTo(0.5, 5);
    expect(r.paymentShare).toBeCloseTo(r.monthlyPayment / (4000 / 12), 3);
    expect(planCollege(base, noMoney).debtToSalary).toBeNull();
  });
  it('keeps unused family money as leftover', () => {
    expect(planCollege(base, { ...noMoney, family: 5000 }).leftover).toBe(3000);
  });
  it('the examples give a cheaper College B', () => {
    const [a, b] = EXAMPLE_COLLEGES.map((c) => planCollege(c, EXAMPLE_FUNDING));
    expect(b.totalPaid).toBeLessThan(a.totalPaid);
    expect(a.borrowed).toBeGreaterThan(b.borrowed);
    expect(Number.isFinite(a.monthlyPayment)).toBe(true);
  });
});
