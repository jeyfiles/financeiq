# Content guide

## Amounts and currencies

Write every amount once, in **base units**. Base units are roughly US dollars for a student example.
The page multiplies by a price-level factor for the chosen currency (`src/lib/money.ts`: INR 25, GBP 0.8, CAD 1.4, AUD 1.5, EUR 1).
These factors make examples feel realistic. They are not exchange rates, and the site says so.

- In lessons, write amounts as `{{1200}}`. Use decimals only for exact payments such as `{{88.85}}`.
- In decisions, use the helpers in `build(({ s, f, m }) => ...)`:
  - `m(800)` scales and formats a base amount.
  - `s(800)` scales it to a number, for maths.
  - `f(n)` formats a number that is already scaled.
- Work out totals with `src/lib/calc.ts` from scaled numbers, so the text matches the calculators.
- Percentages (interest, inflation) are not scaled. Say they are examples.

## Country-specific facts

Keep content true in any country. When something differs (taxes, credit records, fraud reporting),
say that it differs and link to official sources, or label the section with the country (for example "US college finance").

## Adding a decision

Copy one object in `src/data/scenarios.ts`. Give 3 or 4 choices, each with `now`, `later` and a `verdict`
(`good`, `mixed` or `risky`). Use `fitsIf` when a choice can be right for some people. Run `npm run test:unit`.

## Adding a lesson

Copy one object in `src/data/lessons.ts`. Keep it to about three minutes: a big idea, three short sections,
a worked example, three terms, one self check question and official sources.

## Writing rules

No em or en dashes, no contractions, no banned filler words (the list is in `scripts/check-copy.mjs`).
No invented quotes or stories in Jey's name. No product or investment recommendations.
