// "Check your Finance IQ": eight questions, feedback after each answer, and a topic breakdown at the end.
import { useEffect, useRef, useState } from 'preact/hooks';
import { QUIZ } from '../../data/quiz';
import { makeCtx } from '../../data/types';
import { useCurrency } from '../../lib/useCurrency';
import { getProgress, saveQuiz, type QuizResult } from '../../lib/storage';
import { topicLabel, url } from '../../lib/site';

const KEYS = ['A', 'B', 'C', 'D'];

function nextHref(n: (typeof QUIZ)[number]['next']) {
  return url(`${n.kind}/${n.slug}`);
}

export default function Quiz() {
  const c = useCurrency();
  const x = makeCtx(c);
  const [step, setStep] = useState(-1); // -1 intro, 0..7 questions, 8 result
  const [answers, setAnswers] = useState<(number | null)[]>(QUIZ.map(() => null));
  const [last, setLast] = useState<QuizResult | undefined>();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => { setLast(getProgress().quiz); }, []);
  useEffect(() => { if (step >= 0) heading.current?.focus(); }, [step]);

  const start = () => { setAnswers(QUIZ.map(() => null)); setStep(0); };
  const choose = (i: number) => setAnswers((a) => a.map((v, k) => (k === step ? i : v)));

  const finish = () => {
    const byTopic: QuizResult['byTopic'] = {};
    QUIZ.forEach((q, i) => {
      const t = (byTopic[q.topic] ??= { right: 0, total: 0 });
      t.total++;
      if (answers[i] === q.answer) t.right++;
    });
    const score = QUIZ.filter((q, i) => answers[i] === q.answer).length;
    const result: QuizResult = { date: new Date().toISOString().slice(0, 10), score, total: QUIZ.length, byTopic };
    saveQuiz(result);
    setLast(result);
    setStep(QUIZ.length);
  };

  if (step === -1) {
    return (
      <div class="fq-panel fq-quiz">
        <h2 class="fq-panel__title">Eight questions, about four minutes</h2>
        <p>One question for each money topic: spending plans, emergencies, interest, inflation, borrowing, investment risk, scams and paychecks. After each answer you see why it is right or wrong.</p>
        <p class="fq-help">Your score is a learning score. It shows which topics to look at next. It is not a test of intelligence, and it does not measure how ready you are to make money decisions.</p>
        {last && <p class="fq-note">Your last result, on {last.date}: <strong>{last.score} out of {last.total}</strong>.</p>}
        <div class="fq-btn-row"><button type="button" class="fq-btn fq-btn--primary" onClick={start}>{last ? 'Take it again' : 'Start the questions'}</button></div>
      </div>
    );
  }

  if (step === QUIZ.length) {
    const score = QUIZ.filter((q, i) => answers[i] === q.answer).length;
    const missed = QUIZ.filter((q, i) => answers[i] !== q.answer);
    return (
      <div class="fq-panel fq-quiz">
        <h2 class="fq-panel__title" tabIndex={-1} ref={heading}>Your learning score: {score} out of {QUIZ.length}</h2>
        <div class="fq-progress" aria-hidden="true"><span style={{ width: `${(score / QUIZ.length) * 100}%` }} /></div>
        <p class="fq-big">
          {score === QUIZ.length ? 'Every topic answered well. Try the money decisions to use what you know.' :
            score >= 6 ? 'Strong basics. Look at the topics below to fill the gaps.' :
            score >= 3 ? 'A good start. The lessons below each take about three minutes.' :
            'Everyone starts somewhere. Pick one topic below and spend three minutes on it.'}
        </p>
        <h3>By topic</h3>
        <ul class="fq-topics">
          {QUIZ.map((q, i) => {
            const right = answers[i] === q.answer;
            return (
              <li class={right ? 'is-right' : 'is-wrong'}>
                <span class={`fq-tag ${right ? 'fq-tag--good' : 'fq-tag--risky'}`}>{right ? '✓ Got it' : '✗ Review'}</span>
                <span class="fq-topics__name">{topicLabel(q.topic)}</span>
                {!right && <a href={nextHref(q.next)}>{q.next.label}</a>}
              </li>
            );
          })}
        </ul>
        {missed.length > 0 && <p>Suggested next: <a href={nextHref(missed[0].next)}>{missed[0].next.label}</a>.</p>}
        <div class="fq-btn-row">
          <a class="fq-btn fq-btn--primary" href={url('decisions')}>Try a money decision</a>
          <button type="button" class="fq-btn fq-btn--secondary" onClick={start}>Take it again</button>
        </div>
      </div>
    );
  }

  const q = QUIZ[step];
  const picked = answers[step];
  const answered = picked !== null;
  const right = picked === q.answer;
  const options = q.options(x);

  return (
    <div class="fq-panel fq-quiz">
      <p class="fq-quiz__count">Question {step + 1} of {QUIZ.length} · {topicLabel(q.topic)}</p>
      <div class="fq-progress" aria-hidden="true"><span style={{ width: `${(step / QUIZ.length) * 100}%` }} /></div>
      <h2 class="fq-quiz__q" tabIndex={-1} ref={heading}>{q.question(x)}</h2>
      <ul class="fq-options" role="list">
        {options.map((o, i) => {
          const cls = answered ? (i === q.answer ? 'fq-option--right' : i === picked ? 'fq-option--wrong' : '') : '';
          return (
            <li>
              <button type="button" class={`fq-option ${cls}`} aria-pressed={picked === i} disabled={answered} onClick={() => choose(i)}>
                <span class="fq-option__key" aria-hidden="true">{KEYS[i]}</span>
                <span>{o}{answered && i === q.answer && <span class="fq-visually-hidden"> (correct answer)</span>}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div aria-live="polite">
        {answered && (
          <div class={`fq-feedback ${right ? 'is-right' : 'is-wrong'}`}>
            <p class="fq-feedback__head"><span class={`fq-tag ${right ? 'fq-tag--good' : 'fq-tag--risky'}`}>{right ? '✓ Right' : '✗ Not quite'}</span></p>
            <p>{q.explain(x)}</p>
            <p class="fq-help">Learn more: <a href={nextHref(q.next)}>{q.next.label}</a></p>
          </div>
        )}
      </div>
      <div class="fq-btn-row">
        {step > 0 && <button type="button" class="fq-btn fq-btn--secondary" onClick={() => setStep(step - 1)}>Back</button>}
        {answered && step < QUIZ.length - 1 && <button type="button" class="fq-btn fq-btn--primary" onClick={() => setStep(step + 1)}>Next question</button>}
        {answered && step === QUIZ.length - 1 && <button type="button" class="fq-btn fq-btn--primary" onClick={finish}>See my result</button>}
      </div>
    </div>
  );
}
