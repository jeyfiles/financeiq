// Horizontal stacked bars: what you pay for the item, and what you pay on top (interest and fees).
// Two series, so a legend is shown; the total is labelled at the end of each bar and a table follows.
interface Row { label: string; base: number; extra: number }
interface Props { title: string; rows: Row[]; format: (n: number) => string }

export default function CostBars({ title, rows, format }: Props) {
  const max = Math.max(...rows.map((r) => r.base + r.extra), 1);
  return (
    <figure class="fq-chart">
      <figcaption class="fq-chart__title">{title}</figcaption>
      <ul class="fq-chart__legend">
        <li><span class="fq-chart__key" style={{ background: 'var(--fq-series-1)' }} aria-hidden="true" />Price you pay for the item</li>
        <li><span class="fq-chart__key" style={{ background: 'var(--fq-series-2)' }} aria-hidden="true" />Interest and fees</li>
      </ul>
      <div class="fq-bars" role="img" aria-label={`${title}. ${rows.map((r) => `${r.label}: ${format(r.base + r.extra)} in total, of which ${format(r.extra)} is interest and fees`).join('. ')}.`}>
        {rows.map((r) => {
          const total = r.base + r.extra;
          return (
            <div class="fq-bars__row">
              <div class="fq-bars__label">{r.label}</div>
              <div class="fq-bars__track">
                <span class="fq-bars__seg fq-bars__seg--base" style={{ width: `${(r.base / max) * 82}%` }} title={`Price: ${format(r.base)}`} />
                {r.extra > 0.5 && <span class="fq-bars__seg fq-bars__seg--extra" style={{ width: `${(r.extra / max) * 82}%` }} title={`Interest and fees: ${format(r.extra)}`} />}
                <span class="fq-bars__value">{format(total)}</span>
              </div>
            </div>
          );
        })}
      </div>
      <details class="fq-chart__table">
        <summary>Show the numbers as a table</summary>
        <table class="fq-table">
          <thead><tr><th scope="col">Option</th><th scope="col" class="num">Price</th><th scope="col" class="num">Interest and fees</th><th scope="col" class="num">Total</th></tr></thead>
          <tbody>{rows.map((r) => <tr><th scope="row">{r.label}</th><td class="num">{format(r.base)}</td><td class="num">{format(r.extra)}</td><td class="num">{format(r.base + r.extra)}</td></tr>)}</tbody>
        </table>
      </details>
    </figure>
  );
}
