# JeyInsights Finance IQ

Interactive money skills for students and young adults, served at **https://jeyinsights.com/financeiq/**.
Visitors make a money decision, see what happens right away and later on, and learn one useful idea in about five minutes.
Built with Astro as static pages with small Preact islands. No accounts, and progress stays on the visitor's device.

Finance IQ is not tied to one country. Visitors pick a currency (USD, INR, EUR, GBP, CAD, AUD) and every example amount is shown in it.
Where rules really differ by country (taxes, credit records, where to report a scam), the page says so and links to official sources.

## What is on the site

| Section | Path | What visitors do |
|---|---|---|
| Your Money. Your Move. | `/financeiq/decisions/` | Six decisions from school to college to a first paycheck |
| Check your Finance IQ | `/financeiq/check/` | Eight questions, feedback on every answer, a topic breakdown |
| Money Lab | `/financeiq/lab/` | Savings goal, start now or later, money now or later (present and future value, and salary and savings to retirement), real purchase cost |
| Learn in 3 minutes | `/financeiq/learn/` | Six short lessons with a worked example and a self check |
| College Money Planner | `/financeiq/college/` | Compare up to three colleges: full cost, aid, how the gap is paid, loan, repayment and interest. Saved in the browser |

## Run it on your computer

You need **Node.js 22.12 or newer** (`node -v` to check).

```bash
npm install
npm run dev          # opens http://localhost:4321/financeiq/
```

| Command | What it does |
|---|---|
| `npm run build` | Builds into `dist/`, then runs the writing check and the SEO and link audit. The build fails if either fails |
| `npm run preview` | Serves the built site at http://localhost:4321/financeiq/ |
| `npm run test:unit` | Unit tests (money maths, currency, content rules in every currency) |
| `npm run test:e2e` | Browser tests with axe accessibility scans. First time: `npx playwright install chromium` |
| `npm run build:pages` | What Cloudflare Pages runs: the build, then `dist-pages/` with the site in `financeiq/` |
| `npm run check:live` | Checks the live site after a deploy |

## Folder guide

| Path | What is in it |
|---|---|
| `src/data/scenarios.ts` | The six money decisions. Amounts are base units, worked out with `src/lib/calc.ts` |
| `src/data/quiz.ts` | The eight Finance IQ questions |
| `src/data/lessons.ts` | The six lessons. Amounts are written as `{{1000}}` |
| `src/lib/calc.ts` | All money maths (pure functions, unit tested) |
| `src/lib/money.ts` | Currencies, scaling and formatting |
| `src/lib/tvm.ts` | Present and future value maths, and the salary, spending and savings table (unit tested against the reference sheet) |
| `src/lib/college.ts` | College Money Planner maths and example colleges (unit tested) |
| `src/components/islands/` | Interactive parts: Quiz, Scenario, Paycheck, the three calculators and the charts |
| `src/pages/` | One file per address |
| `scripts/` | Writing check, SEO audit, Pages output, live check, OG image |
| `deploy/proxy-worker/` | The block to add to the jeyinsights-proxy Worker |
| `docs/` | Deploy guide and content guide |

## Writing rules (short version)

No em dashes or en dashes. No contractions ("do not", not "don't"). Plain words and short sentences.
No filler words such as "unlock", "journey" or "seamless". `npm run build` checks the pages and `npm run test:unit` checks every scenario and question in every currency.

## Fonts

Oswald (headings) and Atkinson Hyperlegible Next (body) are self-hosted from `public/fonts/`, under the SIL Open Font License (licence files are next to the fonts).
