// "Your first paycheck": split the money left after needs, then live three months with the plan.
import { useEffect, useRef, useState } from 'preact/hooks';
import { PAYCHECK, scenarioBySlug } from '../../data/scenarios';
import { makeCtx, VERDICT_LABEL, type Verdict } from '../../data/types';
import { useCurrency } from '../../lib/useCurrency';
import { markDone } from '../../lib/storage';
import { minimumPayoff } from '../../lib/calc';

interface Month { n: number; events: string[]; savings: number; pot: number; debt: number }
interface Outcome { months: Month[]; verdict: Verdict; headline: string; later: string; savings: number; debt: number }

/** Plays three months of the plan. Amounts are in base units; the page formats them. Exported for tests. */
export function simulate(save: number, setAside: number, fmt: (base: number) => string): Outcome {
  let savings = 0; let pot = 0; let debt = 0; let usedSavingsForPlanned = false;
  const months: Month[] = [];
  const pay = (amount: number, fromPotFirst: boolean) => {
    let left = amount; const used: string[] = [];
    const take = (have: number, name: string) => { const t = Math.min(have, left); left -= t; if (t > 0) used.push(`${fmt(t)} from ${name}`); return t; };
    if (fromPotFirst) { pot -= take(pot, 'your bills pot'); savings -= take(savings, 'savings'); }
    else { savings -= take(savings, 'savings'); pot -= take(pot, 'your bills pot'); }
    if (left > 0) { debt += left; used.push(`${fmt(left)} on a credit card`); }
    return used;
  };
  for (let n = 1; n <= 3; n++) {
    savings += save; pot += setAside;
    const events: string[] = [];
    if (n === PAYCHECK.surprise.month) events.push(`${PAYCHECK.surprise.label} ${fmt(PAYCHECK.surprise.base)}. You pay ${pay(PAYCHECK.surprise.base, false).join(' and ')}.`);
    if (n === PAYCHECK.planned.month) {
      const potBefore = pot;
      const used = pay(PAYCHECK.planned.base, true);
      if (potBefore < PAYCHECK.planned.base) usedSavingsForPlanned = true;
      events.push(`${PAYCHECK.planned.label}: ${fmt(PAYCHECK.planned.base)}. You pay ${used.join(' and ')}.`);
    }
    if (!events.length) events.push('A quiet month. Your plan runs as set.');
    months.push({ n, events, savings, pot, debt });
  }
  let verdict: Verdict; let headline: string; let later: string;
  if (debt > 0) {
    const cost = minimumPayoff(debt, PAYCHECK.cardRate, 0, Math.max(debt / 6, 1));
    verdict = 'risky';
    headline = `You ended the three months owing ${fmt(debt)} on a credit card.`;
    later = `Paid off over six months at ${PAYCHECK.cardRate}% a year, that adds about ${fmt(Math.round(cost.interest))} in interest. A small monthly amount for savings and a bills pot would have covered both costs.`;
  } else if (usedSavingsForPlanned || savings < PAYCHECK.surprise.base) {
    verdict = 'mixed';
    headline = `No debt, but a known bill ate into your savings. You have ${fmt(savings)} saved.`;
    later = 'The course fee was not a surprise. Setting aside a little each month for bills you know about keeps your savings free for real emergencies.';
  } else {
    verdict = 'good';
    const year = save * 12;
    headline = `You handled both costs with no debt and kept ${fmt(savings)} in savings.`;
    later = `Keep saving ${fmt(save)} a month and you will have about ${fmt(year)} after a year, before interest. A common goal is three months of needs: ${fmt(1500 * 3)}.`;
  }
  return { months, verdict, headline, later, savings, debt };
}

export default function Paycheck() {
  const c = useCurrency();
  const x = makeCtx(c);
  const content = scenarioBySlug('first-paycheck')!.build(x);
  const [save, setSave] = useState(300);
  const [setAside, setSetAside] = useState(100);
  const [played, setPlayed] = useState<Outcome | null>(null);
  const head = useRef<HTMLHeadingElement>(null);
  const fun = PAYCHECK.flexible - save - setAside;

  useEffect(() => { if (played) { head.current?.focus(); markDone('decision:first-paycheck'); } }, [played]);
  // Replay with the new currency so every amount matches.
  useEffect(() => { if (played) setPlayed(simulate(save, setAside, x.m)); }, [c.code]);

  const onSave = (v: number) => { setSave(v); if (v + setAside > PAYCHECK.flexible) setSetAside(PAYCHECK.flexible - v); setPlayed(null); };
  const onSetAside = (v: number) => { setSetAside(Math.min(v, PAYCHECK.flexible - save)); setPlayed(null); };

  return (
    <div class="fq-scenario">
      <section class="fq-panel">
        <h2 class="fq-panel__title">The situation</h2>
        {content.situation.map((p) => <p>{p}</p>)}
        <dl class="fq-facts">
          <div><dt>Take-home pay</dt><dd>{x.m(PAYCHECK.takeHome)}</dd></div>
          {PAYCHECK.needs.map((n) => <div><dt>{n.label}</dt><dd>{x.m(n.base)}</dd></div>)}
          <div><dt>Left to plan each month</dt><dd>{x.m(PAYCHECK.flexible)}</dd></div>
        </dl>
      </section>

      <section class="fq-panel" aria-labelledby="pc-q">
        <h2 id="pc-q" class="fq-panel__title">{content.question}</h2>
        <div class="fq-field">
          <label for="pc-save">Savings each month: <strong>{x.m(save)}</strong></label>
          <input id="pc-save" class="fq-range" type="range" min={0} max={PAYCHECK.flexible} step={PAYCHECK.step} value={save}
            aria-valuetext={x.m(save)} onInput={(e) => onSave(Number((e.target as HTMLInputElement).value))} />
        </div>
        <div class="fq-field">
          <label for="pc-pot">Set aside for known bills: <strong>{x.m(setAside)}</strong></label>
          <input id="pc-pot" class="fq-range" type="range" min={0} max={PAYCHECK.flexible} step={PAYCHECK.step} value={setAside}
            aria-valuetext={x.m(setAside)} onInput={(e) => onSetAside(Number((e.target as HTMLInputElement).value))} />
          <p class="fq-help">You cannot plan more than {x.m(PAYCHECK.flexible)} in total.</p>
        </div>
        <div class="fq-split" aria-hidden="true">
          <span class="fq-split__seg fq-split__seg--save" style={{ flexGrow: save }} />
          <span class="fq-split__seg fq-split__seg--pot" style={{ flexGrow: setAside }} />
          <span class="fq-split__seg fq-split__seg--fun" style={{ flexGrow: fun }} />
        </div>
        <ul class="fq-split__legend">
          <li><span class="fq-split__key fq-split__seg--save" />Savings {x.m(save)}</li>
          <li><span class="fq-split__key fq-split__seg--pot" />Bills pot {x.m(setAside)}</li>
          <li><span class="fq-split__key fq-split__seg--fun" />Fun and everything else {x.m(fun)}</li>
        </ul>
        <div class="fq-btn-row">
          <button type="button" class="fq-btn fq-btn--primary" onClick={() => setPlayed(simulate(save, setAside, x.m))}>Live three months with this plan</button>
        </div>
      </section>

      {played && (
        <section class="fq-panel fq-outcome" aria-labelledby="pc-out">
          <h2 id="pc-out" class="fq-panel__title" tabIndex={-1} ref={head}>What happens</h2>
          <p><span class={`fq-tag fq-tag--${played.verdict}`}><span aria-hidden="true">{played.verdict === 'good' ? '✓' : played.verdict === 'mixed' ? '◐' : '!'}</span>{VERDICT_LABEL[played.verdict]}</span></p>
          <ol class="fq-months">
            {played.months.map((mo) => (
              <li>
                <h3>Month {mo.n}</h3>
                {mo.events.map((e) => <p>{e}</p>)}
                <p class="fq-help">End of month: savings {x.m(mo.savings)}, bills pot {x.m(mo.pot)}{mo.debt > 0 ? `, card debt ${x.m(mo.debt)}` : ''}.</p>
              </li>
            ))}
          </ol>
          <div class="fq-outcome__grid">
            <div class="fq-outcome__box"><h3>Right away</h3><p>{played.headline}</p></div>
            <div class="fq-outcome__box"><h3>Later on</h3><p>{played.later}</p></div>
          </div>
          <p class="fq-tip">There is more than one good plan. Someone paying off a loan may save less and repay more, and that can be right too. Move the sliders and play it again.</p>
          <div class="fq-note"><p><strong>Takeaway:</strong> {content.takeaway}</p></div>
        </section>
      )}
    </div>
  );
}
