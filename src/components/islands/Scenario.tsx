// One money decision: read the situation, pick a choice, see what happens now and later.
import { useEffect, useRef, useState } from 'preact/hooks';
import { scenarioBySlug } from '../../data/scenarios';
import { makeCtx, VERDICT_LABEL, type Choice, type Verdict } from '../../data/types';
import { useCurrency } from '../../lib/useCurrency';
import { markDone } from '../../lib/storage';

const ICON: Record<Verdict, string> = { good: '✓', mixed: '◐', risky: '!' };

export function VerdictTag({ choice }: { choice: Choice }) {
  return <span class={`fq-tag fq-tag--${choice.verdict}`}><span aria-hidden="true">{ICON[choice.verdict]}</span>{choice.verdictText ?? VERDICT_LABEL[choice.verdict]}</span>;
}

export default function Scenario({ slug }: { slug: string }) {
  const c = useCurrency();
  const s = scenarioBySlug(slug)!;
  const content = s.build(makeCtx(c));
  const [pick, setPick] = useState<string | null>(null);
  const result = useRef<HTMLHeadingElement>(null);
  const chosen = content.choices.find((ch) => ch.id === pick);

  useEffect(() => {
    if (!pick) return;
    markDone(`decision:${slug}`);
    result.current?.focus();
  }, [pick]);

  return (
    <div class="fq-scenario">
      <section class="fq-panel">
        <h2 class="fq-panel__title">The situation</h2>
        {content.situation.map((p) => <p>{p}</p>)}
        {content.facts && (
          <dl class="fq-facts">
            {content.facts.map((f) => <div><dt>{f.label}</dt><dd>{f.value}</dd></div>)}
          </dl>
        )}
      </section>

      <section class="fq-panel" aria-labelledby="fq-q">
        <h2 id="fq-q" class="fq-panel__title">{content.question}</h2>
        <ul class="fq-options" role="list">
          {content.choices.map((ch, i) => (
            <li>
              <button type="button" class="fq-option" aria-pressed={pick === ch.id} onClick={() => setPick(ch.id)}>
                <span class="fq-option__key" aria-hidden="true">{String.fromCharCode(65 + i)}</span>
                <span>{ch.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {chosen && (
        <section class="fq-panel fq-outcome" aria-labelledby="fq-outcome-title">
          <h2 id="fq-outcome-title" class="fq-panel__title" tabIndex={-1} ref={result}>What happens</h2>
          <p><VerdictTag choice={chosen} /></p>
          <div class="fq-outcome__grid">
            <div class="fq-outcome__box"><h3>Right away</h3><p>{chosen.now}</p></div>
            <div class="fq-outcome__box"><h3>Later on</h3><p>{chosen.later}</p></div>
          </div>
          {chosen.fitsIf && <p class="fq-tip"><strong>This can be the right call if:</strong> {chosen.fitsIf}</p>}
          {content.table && (
            <div class="fq-scroll">
              <table class="fq-table fq-outcome__table">
                <caption>{content.table.caption}</caption>
                <thead><tr>{content.table.head.map((h, i) => <th scope="col" class={i ? 'num' : ''}>{h}</th>)}</tr></thead>
                <tbody>{content.table.rows.map((r) => <tr>{r.map((cell, i) => (i ? <td class="num">{cell}</td> : <th scope="row">{cell}</th>))}</tr>)}</tbody>
              </table>
            </div>
          )}
          <details class="fq-others">
            <summary>See what the other choices lead to</summary>
            <ul>
              {content.choices.filter((ch) => ch.id !== pick).map((ch) => (
                <li>
                  <p><strong>{ch.label}</strong> <VerdictTag choice={ch} /></p>
                  <p>{ch.now} {ch.later}</p>
                </li>
              ))}
            </ul>
          </details>
          <div class="fq-note"><p><strong>Takeaway:</strong> {content.takeaway}</p></div>
        </section>
      )}
    </div>
  );
}
