import type { TopicId } from '../lib/site';
import { format, scaled, type Currency } from '../lib/money';

/** Helpers every piece of content gets, so amounts show in the reader's currency. */
export interface Ctx {
  c: Currency;
  /** Scale a base amount to the reader's currency (a number, for maths). */
  s: (base: number) => number;
  /** Format an amount that is already in the reader's currency. */
  f: (amount: number) => string;
  /** Scale and format a base amount. */
  m: (base: number) => string;
}

export function makeCtx(c: Currency): Ctx {
  return { c, s: (b) => scaled(b, c), f: (a) => format(Math.round(a), c), m: (b) => format(scaled(b, c), c) };
}

export type Stage = 'school' | 'college' | 'first-job';
export const STAGES: Record<Stage, string> = { school: 'In school', college: 'Starting college', 'first-job': 'First paycheck' };

export type Verdict = 'good' | 'mixed' | 'risky';
export const VERDICT_LABEL: Record<Verdict, string> = { good: 'Strong choice', mixed: 'Depends on your goals', risky: 'Risky' };

export interface Choice {
  id: string;
  label: string;
  verdict: Verdict;
  /** Optional wording for the tag, when "Strong choice" does not fit (for example a maths answer). */
  verdictText?: string;
  now: string;
  later: string;
  /** Who this choice suits. Used where more than one answer is reasonable. */
  fitsIf?: string;
}

export interface Fact { label: string; value: string }

export interface ScenarioContent {
  situation: string[];
  facts?: Fact[];
  /** Optional table shown after a choice, for example a cost breakdown. */
  table?: { caption: string; head: string[]; rows: string[][] };
  question: string;
  choices: Choice[];
  takeaway: string;
}

export interface Scenario {
  slug: string;
  title: string;
  stage: Stage;
  topics: TopicId[];
  minutes: number;
  summary: string;
  /** "choices" shows options; "paycheck" is the slider exercise. */
  kind: 'choices' | 'paycheck';
  build: (x: Ctx) => ScenarioContent;
  lesson: string;
  lab?: string;
}

export interface QuizQuestion {
  id: string;
  topic: TopicId;
  question: (x: Ctx) => string;
  options: (x: Ctx) => string[];
  answer: number;
  explain: (x: Ctx) => string;
  /** Where to learn more: a lesson slug, or a decision slug for topics without a lesson. */
  next: { kind: 'learn' | 'decisions' | 'lab'; slug: string; label: string };
}

export interface LessonSection { heading: string; body: string[] }
export interface Lesson {
  slug: string;
  title: string;
  topic: TopicId;
  minutes: number;
  summary: string;
  bigIdea: string;
  sections: LessonSection[];
  example: { title: string; lines: string[] };
  terms: { term: string; meaning: string }[];
  check: { question: string; options: string[]; answer: number; explain: string };
  tryNext: { href: string; label: string }[];
  countryNotes?: { title: string; intro: string; rows: { place: string; check?: { label: string; href: string }; report?: { label: string; href: string }; note?: string }[] };
  sources: { title: string; url: string }[];
}
