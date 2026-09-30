// Content rules: every scenario, quiz question and lesson follows the writing rules in every currency,
// has the expected shape, and all amounts line up.
import { describe, it, expect } from 'vitest';
// @ts-expect-error plain JS module
import { findProblems } from '../../scripts/check-copy.mjs';
import { SCENARIOS } from '../../src/data/scenarios';
import { QUIZ } from '../../src/data/quiz';
import { LESSONS } from '../../src/data/lessons';
import { makeCtx } from '../../src/data/types';
import { CURRENCIES, guessCurrency, format, scaled } from '../../src/lib/money';
import { TOPICS } from '../../src/lib/site';
import { simulate } from '../../src/components/islands/Paycheck';

const texts = (v: unknown): string[] => {
  if (typeof v === 'string') return [v];
  if (Array.isArray(v)) return v.flatMap(texts);
  if (v && typeof v === 'object') return Object.values(v).flatMap(texts);
  return [];
};
const problems = (strings: string[]) => strings.flatMap((t) => findProblems(t));

describe('release scope', () => {
  it('has 8 quiz questions, 6 decisions and 6 lessons', () => {
    expect(QUIZ.length).toBe(8);
    expect(SCENARIOS.length).toBe(6);
    expect(LESSONS.length).toBe(6);
  });
  it('the quiz covers every topic once', () => {
    expect(new Set(QUIZ.map((q) => q.topic)).size).toBe(TOPICS.length);
  });
  it('slugs are unique', () => {
    expect(new Set(SCENARIOS.map((s) => s.slug)).size).toBe(SCENARIOS.length);
    expect(new Set(LESSONS.map((l) => l.slug)).size).toBe(LESSONS.length);
  });
});

describe.each(CURRENCIES.map((c) => [c.code, c] as const))('content in %s', (_code, c) => {
  const x = makeCtx(c);
  it('decisions follow the writing rules and have outcomes', () => {
    for (const s of SCENARIOS) {
      const b = s.build(x);
      expect(problems([s.title, s.summary, ...texts(b)])).toEqual([]);
      if (s.kind === 'choices') {
        expect(b.choices.length).toBeGreaterThanOrEqual(3);
        for (const ch of b.choices) { expect(ch.now.length).toBeGreaterThan(10); expect(ch.later.length).toBeGreaterThan(10); }
        expect(b.choices.some((ch) => ch.verdict === 'good')).toBe(true);
      }
      expect(texts(b).join(' ')).not.toMatch(/NaN|undefined|Infinity/);
    }
  });
  it('quiz questions follow the writing rules and have a valid answer', () => {
    for (const q of QUIZ) {
      const opts = q.options(x);
      expect(opts.length).toBe(4);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(4);
      expect(new Set(opts).size).toBe(4);
      expect(problems([q.question(x), ...opts, q.explain(x), q.next.label])).toEqual([]);
    }
  });
  it('the paycheck exercise gives each kind of result', () => {
    const fmt = x.m;
    expect(simulate(300, 100, fmt).verdict).toBe('good');
    expect(simulate(300, 0, fmt).verdict).toBe('mixed');
    expect(simulate(0, 0, fmt).verdict).toBe('risky');
    expect(simulate(0, 0, fmt).debt).toBe(450);
    for (const o of [simulate(300, 100, fmt), simulate(0, 0, fmt), simulate(50, 50, fmt)]) expect(problems(texts(o))).toEqual([]);
  });
});

describe('lessons', () => {
  it('follow the writing rules', () => {
    for (const l of LESSONS) expect(problems(texts({ ...l, sources: l.sources.map((s) => s.title) }))).toEqual([]);
  });
  it('have a valid self check and at least one source', () => {
    for (const l of LESSONS) {
      expect(l.check.answer).toBeLessThan(l.check.options.length);
      expect(l.sources.length).toBeGreaterThan(0);
      for (const s of l.sources) expect(s.url).toMatch(/^https:\/\//);
    }
  });
  it('write amounts only as {{number}} tokens', () => {
    for (const l of LESSONS) for (const t of texts(l.sections).concat(texts(l.example))) expect(t).not.toMatch(/[$₹€£]\d/);
  });
});

describe('currency', () => {
  it('guesses from the browser language', () => {
    expect(guessCurrency(['en-IN']).code).toBe('INR');
    expect(guessCurrency(['en-GB']).code).toBe('GBP');
    expect(guessCurrency(['de-DE']).code).toBe('EUR');
    expect(guessCurrency(['fr']).code).toBe('USD');
  });
  it('formats with local digit grouping', () => {
    const inr = CURRENCIES.find((c) => c.code === 'INR')!;
    expect(format(scaled(20000, inr), inr)).toBe('₹5,00,000');
    expect(format(-12.5, CURRENCIES[0], { cents: true })).toBe('-$12.50');
  });
});
