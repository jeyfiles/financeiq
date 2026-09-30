// "Your progress" strip on the home page. Shows nothing until something is saved on this device.
import { useEffect, useState } from 'preact/hooks';
import { getProgress, clearAll, type Progress } from '../../lib/storage';
import { SCENARIOS } from '../../data/scenarios';
import { LESSONS } from '../../data/lessons';
import { url } from '../../lib/site';

export default function HomeProgress() {
  const [p, setP] = useState<Progress | null>(null);
  useEffect(() => { setP(getProgress()); }, []);
  if (!p || (p.done.length === 0 && !p.quiz)) return null;

  const decisions = SCENARIOS.filter((s) => p.done.includes(`decision:${s.slug}`)).length;
  const lessons = LESSONS.filter((l) => p.done.includes(`lesson:${l.slug}`)).length;
  const labs = ['savings-goal', 'start-now-or-later', 'real-cost'].filter((l) => p.done.includes(`lab:${l}`)).length;
  const nextDecision = SCENARIOS.find((s) => !p.done.includes(`decision:${s.slug}`));
  const nextLesson = LESSONS.find((l) => !p.done.includes(`lesson:${l.slug}`));

  return (
    <section class="fq-wrap fq-progress-strip" aria-labelledby="fq-progress-title">
      <h2 id="fq-progress-title">Your progress on this device</h2>
      <div class="fq-stats">
        <div class="fq-stat"><span class="fq-stat__value">{decisions} of {SCENARIOS.length}</span><span class="fq-stat__label">Money decisions made</span></div>
        <div class="fq-stat"><span class="fq-stat__value">{p.quiz ? `${p.quiz.score} of ${p.quiz.total}` : 'Not yet'}</span><span class="fq-stat__label">Finance IQ learning score</span></div>
        <div class="fq-stat"><span class="fq-stat__value">{lessons} of {LESSONS.length}</span><span class="fq-stat__label">Lessons read</span></div>
        <div class="fq-stat"><span class="fq-stat__value">{labs} of 3</span><span class="fq-stat__label">Calculators tried</span></div>
      </div>
      <div class="fq-btn-row">
        {nextDecision && <a class="fq-btn fq-btn--primary" href={url(`decisions/${nextDecision.slug}`)}>Next decision: {nextDecision.title}</a>}
        {!nextDecision && nextLesson && <a class="fq-btn fq-btn--primary" href={url(`learn/${nextLesson.slug}`)}>Next lesson: {nextLesson.title}</a>}
        <button type="button" class="fq-btn fq-btn--secondary" onClick={() => { clearAll(); setP(getProgress()); }}>Clear my progress</button>
      </div>
    </section>
  );
}
