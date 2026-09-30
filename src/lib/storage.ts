// Small, safe wrapper around localStorage. Every Finance IQ key starts with "jeyinsights-financeiq-".
// Storage can be blocked (private mode, strict settings), so every read and write is wrapped
// and the page keeps working without it.
import { SITE } from './site';

const PREFIX = SITE.storagePrefix;

export function readJSON<T>(name: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + name);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(name: string, value: unknown): boolean {
  try {
    localStorage.setItem(PREFIX + name, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export interface QuizResult { date: string; score: number; total: number; byTopic: Record<string, { right: number; total: number }> }
export interface Progress { v: 1; done: string[]; quiz?: QuizResult }

const EMPTY: Progress = { v: 1, done: [] };

/** Repairs anything unexpected, so old or broken saved data never breaks a page. */
export function cleanProgress(p: unknown): Progress {
  if (!p || typeof p !== 'object') return { ...EMPTY, done: [] };
  const o = p as Partial<Progress>;
  const done = Array.isArray(o.done) ? o.done.filter((d): d is string => typeof d === 'string') : [];
  const q = o.quiz;
  const quiz = q && typeof q.score === 'number' && typeof q.total === 'number' && q.byTopic && typeof q.byTopic === 'object' ? q : undefined;
  return { v: 1, done: [...new Set(done)], ...(quiz ? { quiz } : {}) };
}

export function getProgress(): Progress {
  return cleanProgress(readJSON<unknown>('progress', null));
}

export function markDone(item: string): Progress {
  const p = getProgress();
  if (!p.done.includes(item)) p.done.push(item);
  writeJSON('progress', p);
  return p;
}

export function saveQuiz(result: QuizResult): Progress {
  const p = getProgress();
  p.quiz = result;
  if (!p.done.includes('check')) p.done.push('check');
  writeJSON('progress', p);
  return p;
}

export function clearAll(): void {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith(PREFIX)) localStorage.removeItem(k);
  } catch { /* storage blocked: nothing to clear */ }
}
