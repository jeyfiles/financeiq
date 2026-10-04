// Horizontal stacked bars with a legend, a total at the end of each bar and a table of the numbers.
// Colours come from validated chart tokens; text always uses text colours, never the series colour.
interface Segment { label: string; color: string }
interface Row { label: string; values: number[] }
interface Props { title: string; segments: Segment[]; rows: Row[]; format: (n: number) => string; totalLabel?: string }

export default function StackBars({ title, segments, rows, format, totalLabel = 'Total' }: Props) {
  const totals = rows.map((r) => r.values.reduce((a, v) => a + Math.max(0, v), 0));
  const max = Math.max(...totals, 1);
  return (
    <figure class="fq-chart">
      <figcaption class="fq-chart__title">{title}</figcaption>
      <ul class="fq-chart__legend">
        {segments.map((s) => <li><span class="fq-chart__key" style={{ background: s.color }} aria-hidden="true" />{s.label}</li>)}
      </ul>
      <div class="fq-bars" role="img" aria-label={`${title}. ${rows.map((r, i) => `${r.label}: ${totalLabel.toLowerCase()} ${format(totals[i])}; ${segments.map((s, k) => `${s.label} ${format(r.values[k])}`).join(', ')}`).join('. ')}.`}>
        {rows.map((r, i) => (
          <div class="fq-bars__row">
            <div class="fq-bars__label">{r.label}</div>
            <div class="fq-bars__track">
              {r.values.map((v, k) => v > 0.5 && (
                <span class="fq-bars__seg fq-stack__seg" style={{ width: `${(v / max) * 80}%`, background: segments[k].color }} title={`${segments[k].label}: ${format(v)}`} />
              ))}
              <span class="fq-bars__value">{format(totals[i])}</span>
            </div>
          </div>
        ))}
      </div>
      <details class="fq-chart__table">
        <summary>Show the numbers as a table</summary>
        <div class="fq-scroll">
          <table class="fq-table">
            <thead><tr><th scope="col">College</th>{segments.map((s) => <th scope="col" class="num">{s.label}</th>)}<th scope="col" class="num">{totalLabel}</th></tr></thead>
            <tbody>{rows.map((r, i) => <tr><th scope="row">{r.label}</th>{r.values.map((v) => <td class="num">{format(v)}</td>)}<td class="num">{format(totals[i])}</td></tr>)}</tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
