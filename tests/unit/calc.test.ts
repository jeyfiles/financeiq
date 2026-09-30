import { describe, it, expect } from 'vitest';
import { savingsGoal, growthByYear, startNowVsLater, loanPayment, realCost, minimumPayoff, futurePrice, compound } from '../../src/lib/calc';

describe('savingsGoal', () => {
  it('splits the goal evenly with no interest', () => {
    const r = savingsGoal({ goal: 1200, saved: 0, months: 12, annualRate: 0 });
    expect(r.monthly).toBe(100);
    expect(r.balances.at(-1)).toBeCloseTo(1200, 2);
    expect(r.interest).toBe(0);
  });
  it('counts what is already saved', () => {
    expect(savingsGoal({ goal: 1200, saved: 600, months: 6, annualRate: 0 }).monthly).toBe(100);
  });
  it('needs a little less each month when savings earn interest', () => {
    const r = savingsGoal({ goal: 1200, saved: 0, months: 12, annualRate: 5 });
    expect(r.monthly).toBeLessThan(100);
    expect(r.balances.at(-1)!).toBeGreaterThanOrEqual(1200);
    expect(r.interest).toBeGreaterThan(0);
  });
  it('says so when the goal is already covered', () => {
    const r = savingsGoal({ goal: 500, saved: 600, months: 6, annualRate: 0 });
    expect(r.alreadyEnough).toBe(true);
    expect(r.monthly).toBe(0);
  });
});

describe('growth and start now versus later', () => {
  it('matches the future value of a monthly annuity', () => {
    const b = growthByYear({ monthly: 100, annualRate: 6, years: 10 });
    const r = 0.005; const fv = 100 * (((1 + r) ** 120 - 1) / r);
    expect(b[10]).toBeCloseTo(fv, 0);
  });
  it('starting later with the same monthly amount ends lower', () => {
    const r = startNowVsLater({ monthly: 100, annualRate: 7, startAge: 20, delayYears: 5, endAge: 50 });
    expect(r.ages[0]).toBe(20);
    expect(r.ages.at(-1)).toBe(50);
    expect(r.now.length).toBe(31);
    expect(r.later.length).toBe(31);
    expect(r.later.slice(0, 6).every((v) => v === 0)).toBe(true);
    expect(r.planNow.final).toBeGreaterThan(r.planLater.final);
    expect(r.planNow.contributed - r.planLater.contributed).toBe(6000);
    expect(r.difference).toBeGreaterThan(6000);
  });
  it('with no return the gap is only the extra deposits', () => {
    const r = startNowVsLater({ monthly: 100, annualRate: 0, startAge: 20, delayYears: 5, endAge: 30 });
    expect(r.difference).toBe(6000);
  });
});

describe('loans and installments', () => {
  it('computes a standard loan payment', () => {
    expect(loanPayment(1000, 12, 12)).toBeCloseTo(88.85, 2);
    expect(loanPayment(1200, 0, 12)).toBe(100);
  });
  it('shows the extra cost of an installment plan', () => {
    const r = realCost({ price: 1000, upfrontDiscount: 5, months: 12, annualRate: 18, fee: 20 });
    expect(r.upfront.total).toBe(950);
    expect(r.plan.monthly).toBeCloseTo(91.68, 2);
    expect(r.plan.total).toBeCloseTo(91.68 * 12 + 20, 1);
    expect(r.saving).toBeGreaterThan(0);
  });
  it('a zero interest plan with a fee still costs more than the price', () => {
    const r = realCost({ price: 600, upfrontDiscount: 0, months: 6, annualRate: 0, fee: 15 });
    expect(r.plan.total).toBe(615);
    expect(r.plan.extra).toBe(15);
  });
});

describe('minimum payments', () => {
  it('takes years and costs a lot of interest', () => {
    const r = minimumPayoff(1000, 36, 1, 25);
    expect(r.neverEnds).toBe(false);
    expect(r.months).toBeGreaterThan(48);
    expect(r.interest).toBeGreaterThan(500);
  });
  it('paying more than the minimum finishes much sooner', () => {
    const min = minimumPayoff(1000, 36, 1, 25);
    const more = minimumPayoff(1000, 36, 1, 100);
    expect(more.months).toBeLessThan(min.months / 2);
    expect(more.interest).toBeLessThan(min.interest);
  });
});

describe('inflation and compounding', () => {
  it('works out future prices and growth', () => {
    expect(futurePrice(100, 5, 10)).toBeCloseTo(162.89, 2);
    expect(compound(1000, 8, 10)).toBeCloseTo(2158.92, 2);
  });
});
