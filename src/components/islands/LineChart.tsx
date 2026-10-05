// Small, dependency-free line chart for the Money Lab.
// Follows the dataviz rules: 2px lines, recessive grid, legend for 2+ series plus end labels,
// crosshair tooltip on hover and keyboard, and a table view so nothing depends on hovering.
import { useEffect, useRef, useState } from 'preact/hooks';

export interface Series { name: string; color: string; values: number[] }
interface Props {
  title: string;
  series: Series[];
  xLabels: (string | number)[];
  xTitle: string;
  format: (n: number) => string;
  /** Short axis numbers, for example 12K. */
  formatAxis: (n: number) => string;
  height?: number;
  /** Numbered markers on the x axis, for example life events. Their meaning is listed below the chart by the page. */
  markers?: { index: number; label: string }[];
}

/** Clean axis steps (1, 2, 2.5 or 5 times a power of ten), about four of them. */
export function niceTicks(v: number): number[] {
  if (v <= 0) return [0, 1];
  const raw = v / 4;
  const p = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * p).find((st) => st >= raw) ?? 10 * p;
  const top = Math.ceil(v / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
}

export default function LineChart({ title, series, xLabels, xTitle, format, formatAxis, height = 280, markers = [] }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(640);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = xLabels.length;
  const ticks = niceTicks(Math.max(...series.flatMap((s) => s.values)));
  const maxV = ticks[ticks.length - 1];
  const pad = { l: 56, r: series.length > 1 ? 16 : 16, t: 16, b: 40 };
  const iw = w - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const x = (i: number) => pad.l + (n <= 1 ? 0 : (i / (n - 1)) * iw);
  const y = (v: number) => pad.t + ih - (v / maxV) * ih;
  const xEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 70))));

  const idxFromEvent = (clientX: number) => {
    const svg = wrap.current?.querySelector('svg');
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    const px = ((clientX - r.left) / r.width) * w;
    const i = Math.round(((px - pad.l) / iw) * (n - 1));
    return Math.min(n - 1, Math.max(0, i));
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      setHover((h) => {
        const cur = h ?? (e.key === 'ArrowRight' ? -1 : n);
        return Math.min(n - 1, Math.max(0, cur + (e.key === 'ArrowRight' ? 1 : -1)));
      });
    } else if (e.key === 'Escape') setHover(null);
  };

  const path = (vals: number[]) => vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const tipLeft = hover === null ? 0 : (x(hover) / w) * 100;

  return (
    <figure class="fq-chart">
      <figcaption class="fq-chart__title">{title}</figcaption>
      {series.length > 1 && (
        <ul class="fq-chart__legend">
          {series.map((s) => <li><span class="fq-chart__key" style={{ background: s.color }} aria-hidden="true" />{s.name}</li>)}
        </ul>
      )}
      <div class="fq-chart__plot" ref={wrap}>
        <svg
          width="100%" height={height} viewBox={`0 0 ${w} ${height}`} role="img" tabIndex={0}
          aria-label={`${title}. Use the left and right arrow keys to read values. A table of the numbers follows the chart.`}
          onPointerMove={(e) => setHover(idxFromEvent(e.clientX))}
          onPointerLeave={() => setHover(null)}
          onKeyDown={onKey}
          onBlur={() => setHover(null)}
        >
          {ticks.map((t) => (
            <g>
              <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} stroke="var(--fq-grid)" stroke-width="1" />
              <text x={pad.l - 8} y={y(t) + 4} text-anchor="end" class="fq-chart__axis">{formatAxis(t)}</text>
            </g>
          ))}
          {xLabels.map((l, i) => (i % xEvery === 0 || i === n - 1) && (
            <text x={x(i)} y={height - pad.b + 20} text-anchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} class="fq-chart__axis">{l}</text>
          ))}
          <text x={pad.l + iw / 2} y={height - 4} text-anchor="middle" class="fq-chart__axis">{xTitle}</text>
          {markers.map((m, k) => (
            <g aria-hidden="true">
              <line x1={x(m.index)} x2={x(m.index)} y1={pad.t + 14} y2={pad.t + ih} stroke="var(--ji-line-strong)" stroke-width="1" opacity="0.6" />
              <circle cx={x(m.index)} cy={pad.t + 6} r="9" fill="var(--ji-surface)" stroke="var(--ji-ink-2)" stroke-width="1.5" />
              <text x={x(m.index)} y={pad.t + 10} text-anchor="middle" class="fq-chart__marker">{k + 1}</text>
            </g>
          ))}
          {series.map((s) => (
            <path d={path(s.values)} fill="none" stroke={s.color} stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
          ))}
          {series.map((s) => (
            <circle cx={x(n - 1)} cy={y(s.values[n - 1])} r="4.5" fill={s.color} stroke="var(--ji-surface)" stroke-width="2" />
          ))}
          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke="var(--ji-line-strong)" stroke-width="1" />
              {series.map((s) => <circle cx={x(hover)} cy={y(s.values[hover])} r="5" fill={s.color} stroke="var(--ji-surface)" stroke-width="2" />)}
            </g>
          )}
        </svg>
        {hover !== null && (
          <div class="fq-chart__tip" style={{ left: `${tipLeft}%`, transform: `translateX(${tipLeft > 60 ? '-105%' : '5%'})` }} aria-hidden="true">
            <div class="fq-chart__tip-x">{xTitle} {xLabels[hover]}</div>
            {markers.filter((m) => m.index === hover).map((m) => <div class="fq-chart__tip-x">{m.label}</div>)}
            {series.map((s) => (
              <div class="fq-chart__tip-row"><span class="fq-chart__tip-key" style={{ background: s.color }} /><strong>{format(s.values[hover])}</strong> <span>{s.name}</span></div>
            ))}
          </div>
        )}
        <p class="fq-visually-hidden" aria-live="polite">{hover !== null ? `${xTitle} ${xLabels[hover]}: ${series.map((s) => `${s.name} ${format(s.values[hover])}`).join(', ')}` : ''}</p>
      </div>
      <details class="fq-chart__table">
        <summary>Show the numbers as a table</summary>
        <div class="fq-chart__scroll">
          <table class="fq-table">
            <thead><tr><th scope="col">{xTitle}</th>{series.map((s) => <th scope="col" class="num">{s.name}</th>)}</tr></thead>
            <tbody>
              {xLabels.map((l, i) => <tr><th scope="row">{l}</th>{series.map((s) => <td class="num">{format(s.values[i])}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
