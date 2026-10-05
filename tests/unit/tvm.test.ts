// The reference sheet's answers, reproduced.
import { describe, it, expect } from 'vitest';
import { fvLump, pvLump, fvAnnuity, breakEvenRate, saverPath, annuityPath, salaryPlan, SHEET_PLAN } from '../../src/lib/tvm';

describe('present and future value (reference sheet)', () => {
  it('1. a 5,000 gift at 5% from 18 to 60', () => expect(fvLump(5000, 5, 42)).toBeCloseTo(38807.94, 2));
  it('2. 6,000 a year at 6% from 22 to 60', () => expect(fvAnnuity(6000, 6, 38)).toBeCloseTo(815425.23, 2));
  it('3. lend 100,000 now for 120,000 in 10 years, or a 4% bond', () => {
    expect(fvLump(100000, 4, 10)).toBeCloseTo(148024.43, 2);
    expect(pvLump(120000, 4, 10)).toBeCloseTo(81067.70, 2);
    expect(breakEvenRate(100000, 120000, 10)).toBeCloseTo(1.84, 2);
  });
  it('4. early saver: 10,000 a year from 25 to 35, then invested to 65 at 8%', () => {
    expect(fvAnnuity(10000, 8, 11)).toBeCloseTo(166454.87, 2);
    expect(fvLump(fvAnnuity(10000, 8, 11), 8, 30)).toBeCloseTo(1674978.29, 2);
    expect(saverPath({ payment: 10000, rate: 8, fromAge: 25, toAge: 35, endAge: 65 }, 25).final).toBeCloseTo(1674978.29, 2);
  });
  it('5. late saver: 10,000 a year from 36 to 65 at 8%', () => {
    expect(fvAnnuity(10000, 8, 30)).toBeCloseTo(1132832.11, 2);
    const late = saverPath({ payment: 10000, rate: 8, fromAge: 36, toAge: 65, endAge: 65 }, 25);
    expect(late.final).toBeCloseTo(1132832.11, 2);
    expect(late.contributed).toBe(300000);
  });
  it('paths start at zero years', () => {
    expect(annuityPath(100, 0, 3)).toEqual([0, 100, 200, 300]);
  });
});

describe('salary, spending and savings to 60 (reference sheet rows 76 to 126)', () => {
  const r = salaryPlan(SHEET_PLAN);
  it('has one row per year from 22 to 60', () => {
    expect(r.rows.length).toBe(39);
    expect(r.rows[0]).toMatchObject({ year: 1, age: 22, salary: 75000, expenses: 40000, saving: 35000 });
    expect(r.rows.at(-1)!.age).toBe(60);
  });
  it('salary keeps growing 3% every year, including at 31', () => {
    expect(r.rows[1].salary).toBeCloseTo(77250, 2);
    expect(r.rows[9].salary).toBeCloseTo(75000 * 1.03 ** 9, 2); // age 31
    expect(r.rows.at(-1)!.salary).toBeCloseTo(75000 * 1.03 ** 38, 2);
  });
  it('first-decade total matches the sheet', () => {
    expect(r.rows[8].stageTotal).toBeCloseTo(401932.96, 1);
    expect(r.rows.filter((x) => x.stageTotal !== null).length).toBe(4);
  });
  it('Q1: money at 60 without investing', () => expect(r.q1).toBeCloseTo(3107567, -1));
  it('Q2: money at 60 invested at 6%', () => expect(r.q2).toBeCloseTo(8603627, -1));
  it('a typed expense replaces the stage amount for that year only', () => {
    const o = salaryPlan({ ...SHEET_PLAN, overrides: { 25: 100000 } });
    expect(o.rows[3]).toMatchObject({ age: 25, expenses: 100000, overridden: true });
    expect(o.rows[4].expenses).toBe(40000);
    expect(o.q1).toBeCloseTo(r.q1 - 60000, 1);
  });
  it('a typed salary replaces that year and later years grow from it', () => {
    const o = salaryPlan({ ...SHEET_PLAN, salaryOverrides: { 28: 110000, 35: 0 } });
    const at = (a: number) => o.rows.find((x) => x.age === a)!;
    expect(at(27).salary).toBeCloseTo(75000 * 1.03 ** 5, 2);
    expect(at(28)).toMatchObject({ salary: 110000, salaryOverridden: true });
    expect(at(28).salaryChange).toBeCloseTo((110000 / (75000 * 1.03 ** 5) - 1) * 100, 6);
    expect(at(29).salary).toBeCloseTo(110000 * 1.03, 6);
    expect(at(35).salary).toBe(0);
    expect(at(35).saving).toBe(-60000);
    expect(at(36).salary).toBe(0);
  });
  it('typing last year\'s salary gives a year with no raise', () => {
    const base = salaryPlan(SHEET_PLAN);
    const s34 = base.rows.find((x) => x.age === 34)!.salary;
    const o = salaryPlan({ ...SHEET_PLAN, salaryOverrides: { 35: s34 } });
    expect(o.rows.find((x) => x.age === 35)!.salaryChange).toBeCloseTo(0, 9);
    expect(o.rows.find((x) => x.age === 36)!.salary).toBeCloseTo(s34 * 1.03, 6);
    expect(o.q1).toBeLessThan(base.q1);
  });
  it('with no return, investing adds nothing', () => {
    const z = salaryPlan({ ...SHEET_PLAN, returnRate: 0 });
    expect(z.q2).toBeCloseTo(z.q1, 6);
  });
});
