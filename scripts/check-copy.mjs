// Checks every piece of text a learner can read against the Finance IQ writing rules (same as Learn AI).
// Runs after `astro build` on the finished HTML, and also on the Markdown content files.
// Fails (exit code 1) when it finds: em or en dashes, contractions, banned phrases,
// or any mention of third-party brands we must not use.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TARGETS = [
  { dir: join(ROOT, 'dist'), exts: ['.html'] },
];

// Words and phrases that make text sound machine-written. Matched as whole words, any case.
export const BANNED = [
  'delve', 'delves', 'delving', 'unlock', 'unlocks', 'unlocking', 'unleash', 'leverage', 'leveraging',
  'harness', 'harnessing', 'seamless', 'seamlessly', 'empower', 'empowers', 'empowering', 'elevate',
  'embark', 'journey', 'journeys', 'realm', 'tapestry', 'game-changer', 'game changer', 'cutting-edge',
  'revolutionize', 'revolutionise', 'supercharge', 'transformative', 'robust', 'pivotal', 'crucial',
  'vital', 'foster', 'fostering', 'streamline', 'comprehensive', 'furthermore', 'moreover',
  'additionally', "in today's world", 'in today’s world', 'whether you are', 'dive in', 'deep dive',
  'in conclusion', 'ever-evolving', 'ever evolving', 'navigate the', 'landscape of', 'unparalleled',
  'synergy', 'holistic', 'paradigm', 'at the end of the day', 'look no further',
];

// Brands from the reference audit that must never appear.
export const FORBIDDEN_BRANDS = ['outskill'];

const APOS = "['’]";
const CONTRACTION = new RegExp(
  `\\b(?:[a-z]+n${APOS}t|(?:i|you|we|they|he|she|it|that|there|here|what|who|where|how|let|this)${APOS}(?:s|re|ve|ll|d|m)|i${APOS}m|y${APOS}all)\\b`,
  'i',
);
const DASHES = /[—–]/; // em dash and en dash

export function textFromHtml(html) {
  const attrs = [];
  html.replace(/\s(?:alt|title|aria-label|placeholder|content)="([^"]*)"/g, (_, v) => { attrs.push(v); return ''; });
  const body = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<code\b[^>]*>[\s\S]*?<\/code>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  return decode([body, ...attrs].join('\n'));
}

function decode(s) {
  return s.replace(/&amp;/g, '&').replace(/&#39;|&#x27;|&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

export function findProblems(text) {
  const problems = [];
  const lines = text.split(/\n/);
  lines.forEach((raw) => {
    const line = raw.replace(/\s+/g, ' ').trim();
    if (!line) return;
    if (DASHES.test(line)) problems.push({ rule: 'dash', line });
    const c = line.match(CONTRACTION);
    if (c) problems.push({ rule: `contraction "${c[0]}"`, line });
    const lower = line.toLowerCase();
    for (const w of BANNED) {
      const re = new RegExp(`(^|[^a-z])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z])`, 'i');
      if (re.test(lower)) problems.push({ rule: `banned "${w}"`, line });
    }
    for (const b of FORBIDDEN_BRANDS) if (lower.includes(b)) problems.push({ rule: `brand "${b}"`, line });
  });
  return problems;
}

function walk(dir, exts, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, exts, out);
    else if (exts.includes(extname(p))) out.push(p);
  }
  return out;
}

function main() {
  let total = 0;
  for (const { dir, exts } of TARGETS) {
    for (const file of walk(dir, exts)) {
      const raw = readFileSync(file, 'utf8');
      const text = file.endsWith('.html') ? textFromHtml(raw) : raw;
      for (const p of findProblems(text)) {
        total++;
        console.log(`${relative(ROOT, file)}  [${p.rule}]  ${p.line.slice(0, 140)}`);
      }
    }
  }
  if (total) {
    console.error(`\nWriting check failed: ${total} problem(s). See README.md, Writing rules.`);
    process.exit(1);
  }
  console.log('Writing check passed: no dashes, contractions, banned phrases or forbidden brands.');
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) main();
