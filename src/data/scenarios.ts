// "Your Money. Your Move." Six money decisions from school to college to a first paycheck.
// Every amount is written in base units and shown in the reader's currency (see src/lib/money.ts).
// Numbers in outcomes are worked out with src/lib/calc.ts, so they always match the calculators.
import type { Scenario } from './types';
import { loanPayment, minimumPayoff, growthByYear } from '../lib/calc';

export const PAYCHECK = {
  takeHome: 2400,
  needs: [
    { label: 'Rent share', base: 900 },
    { label: 'Food', base: 400 },
    { label: 'Phone and transport', base: 200 },
  ],
  /** What is left after needs. The reader splits this between fun, savings and a set-aside pot. */
  flexible: 900,
  surprise: { month: 2, label: 'Your phone screen cracks. The repair costs', base: 150 },
  planned: { month: 3, label: 'Your yearly course and exam fee is due', base: 300 },
  step: 50,
  cardRate: 36,
};

export const SCENARIOS: Scenario[] = [
  {
    slug: 'first-paycheck',
    title: 'Your first paycheck',
    stage: 'first-job',
    topics: ['budgeting', 'saving', 'paycheck'],
    minutes: 5,
    summary: 'Split your first paycheck between fun, savings and a pot for bills you know are coming. Then live three months with your plan.',
    kind: 'paycheck',
    lesson: 'make-a-spending-plan',
    lab: 'savings-goal',
    build: ({ m }) => ({
      situation: [
        `You started your first job. Your take-home pay, after tax and other deductions, is ${m(PAYCHECK.takeHome)} a month.`,
        `Your needs come first: rent share ${m(900)}, food ${m(400)}, phone and transport ${m(200)}. That leaves ${m(PAYCHECK.flexible)} each month for you to plan.`,
        `You know one bill is coming: a yearly course and exam fee of ${m(PAYCHECK.planned.base)} in month 3. You do not know what else might happen.`,
      ],
      question: 'How will you split the money that is left each month?',
      choices: [],
      takeaway: 'Give every part of your pay a job before you spend it. A small pot for known bills stops them from eating your savings, and savings stop a surprise from turning into debt.',
    }),
  },
  {
    slug: 'new-phone',
    title: 'You want a new phone',
    stage: 'college',
    topics: ['borrowing', 'saving', 'interest'],
    minutes: 4,
    summary: 'Save first, pay in installments, buy a cheaper model or put it on a card. See what each one really costs.',
    kind: 'choices',
    lesson: 'credit-and-borrowing',
    lab: 'real-cost',
    build: ({ s, f, m }) => {
      const price = s(800);
      const fee = s(25);
      const monthly = loanPayment(price, 20, 12);
      const planTotal = monthly * 12 + fee;
      const card = minimumPayoff(price, 36, 1, s(25));
      const cheaper = s(350);
      return {
        situation: [
          `Your phone still works, but it is slow and the battery is weak. The phone you want costs ${f(price)}.`,
          `You have ${m(500)} in savings, which is your only cushion for emergencies. You can put aside about ${m(100)} a month.`,
          `The shop offers a 12 month installment plan at 20% interest a year, plus a ${f(fee)} setup fee.`,
        ],
        facts: [
          { label: 'Phone price', value: f(price) },
          { label: 'Your savings', value: m(500) },
          { label: 'You can save each month', value: m(100) },
        ],
        question: 'What do you do?',
        choices: [
          {
            id: 'save-first', label: `Keep the old phone and save ${m(100)} a month until you can pay in full`, verdict: 'good',
            now: 'You wait 8 months with a slow phone. Your emergency savings stay untouched.',
            later: `You pay ${f(price)} and owe nothing. Phone prices often drop within a year, so you may pay less.`,
            fitsIf: 'Your current phone still does what you need.',
          },
          {
            id: 'installments', label: 'Take the 12 month installment plan', verdict: 'mixed',
            now: `You get the phone today and pay ${f(monthly)} a month. That takes ${Math.round((monthly / s(100)) * 100)}% of the ${m(100)} you can save each month.`,
            later: `You pay ${f(planTotal)} in total, which is ${f(planTotal - price)} more than the price. For a year, other savings stop.`,
            fitsIf: 'The plan has no interest and no fees, and the payment fits easily in your budget.',
          },
          {
            id: 'cheaper', label: `Buy a cheaper model for ${f(cheaper)} from savings`, verdict: 'good',
            now: `You get a better phone today and keep ${f(s(500) - cheaper)} in savings.`,
            later: `No debt. Refill the ${f(cheaper)} in about 4 months of saving.`,
            fitsIf: 'You mainly need a faster phone, not a specific model.',
          },
          {
            id: 'card-minimum', label: 'Put it on a credit card and pay the minimum each month', verdict: 'risky',
            now: 'You get the phone today and the first payment looks small.',
            later: card.neverEnds
              ? 'At the minimum payment the balance never clears.'
              : `At 36% interest, paying only the minimum takes about ${Math.round(card.months / 12)} years and costs ${f(card.interest)} in interest. The phone will be long gone.`,
          },
        ],
        takeaway: 'The price tag is not the cost. Add the interest, the fees and the months of payments before you decide, and protect your emergency savings.',
      };
    },
  },
  {
    slug: 'two-colleges',
    title: 'Two colleges, two prices',
    stage: 'college',
    topics: ['budgeting', 'borrowing'],
    minutes: 5,
    summary: 'One college gives a bigger scholarship. The other has lower tuition. Work out which one costs less over four years.',
    kind: 'choices',
    lesson: 'credit-and-borrowing',
    lab: 'real-cost',
    build: ({ s, f }) => {
      const A = { tuition: s(20000), scholarship: s(8000), housing: s(9000), travel: s(600) };
      const B = { tuition: s(12000), scholarship: 0, housing: s(3000), travel: s(1500) };
      const yearA = A.tuition - A.scholarship + A.housing + A.travel;
      const yearB = B.tuition - B.scholarship + B.housing + B.travel;
      const totalA = yearA * 4;
      const totalB = yearB * 4;
      const family = s(40000);
      const loanA = Math.max(0, totalA - family);
      const loanB = Math.max(0, totalB - family);
      const interestA = loanPayment(loanA, 7, 120) * 120 - loanA;
      const interestB = loanPayment(loanB, 7, 120) * 120 - loanB;
      const lost = A.scholarship * 3;
      return {
        situation: [
          'You got offers from two colleges for the course you want. Both have a good record for your subject.',
          `College A is in another city and offers a scholarship of ${f(A.scholarship)} a year. College B has lower tuition but no scholarship, and you can live at home.`,
          `Your family can put ${f(family)} towards college in total. The rest would be a loan at 7% a year, paid back over 10 years.`,
          'College A keeps the scholarship only while your grades stay above a set level.',
        ],
        facts: [
          { label: 'College A, per year', value: `Tuition ${f(A.tuition)}, scholarship ${f(A.scholarship)}, housing ${f(A.housing)}, travel ${f(A.travel)}` },
          { label: 'College B, per year', value: `Tuition ${f(B.tuition)}, living at home ${f(B.housing)}, commute ${f(B.travel)}` },
        ],
        table: {
          caption: 'Four year cost, worked out',
          head: ['', 'College A', 'College B'],
          rows: [
            ['Tuition after scholarship, per year', f(A.tuition - A.scholarship), f(B.tuition)],
            ['Housing and travel, per year', f(A.housing + A.travel), f(B.housing + B.travel)],
            ['Total for one year', f(yearA), f(yearB)],
            ['Total for four years', f(totalA), f(totalB)],
            ['Loan needed', f(loanA), f(loanB)],
            ['Loan interest over 10 years', f(interestA), f(interestB)],
          ],
        },
        question: 'Which college costs less over four years?',
        choices: [
          {
            id: 'a', label: 'College A, because the scholarship is bigger', verdict: 'mixed', verdictText: 'Not on the numbers',
            now: `The scholarship looks big, but housing away from home adds ${f(A.housing + A.travel)} a year.`,
            later: `College A costs ${f(totalA - totalB)} more over four years, and you would pay about ${f(interestA - interestB)} more in loan interest. If you lose the scholarship after year 1, add ${f(lost)}.`,
            fitsIf: 'College A has a program or opportunity you cannot get at B, and you have planned how to pay the difference.',
          },
          {
            id: 'b', label: 'College B, because the total cost is lower', verdict: 'good', verdictText: 'Right on the numbers',
            now: `You pay ${f(yearB)} a year instead of ${f(yearA)}.`,
            later: `You save ${f(totalA - totalB)} over four years and borrow ${f(loanB)} instead of ${f(loanA)}.`,
          },
          {
            id: 'same', label: 'They cost about the same', verdict: 'risky', verdictText: 'Not on the numbers',
            now: 'Tuition alone hides the difference. Housing and travel are real college costs too.',
            later: `The gap is ${f(totalA - totalB)} over four years, before loan interest.`,
          },
        ],
        takeaway: 'Compare the total cost of attending for every year, not the tuition or the scholarship alone. Read the rules for keeping a scholarship, and count the interest on any loan.',
      };
    },
  },
  {
    slug: 'guaranteed-returns',
    title: 'An influencer promises guaranteed returns',
    stage: 'school',
    topics: ['scams', 'investing'],
    minutes: 4,
    summary: 'A popular account says its trading group pays 3% a week, guaranteed. Decide what to do before the offer "ends tonight".',
    kind: 'choices',
    lesson: 'spot-a-money-scam',
    build: ({ s, f }) => {
      const stake = s(500);
      const year = stake * 1.03 ** 52;
      return {
        situation: [
          'An account with a large following posts screenshots of big profits. It invites you to a private trading group.',
          `The minimum is ${f(stake)}. The post says returns are 3% a week, guaranteed, and the offer ends tonight.`,
          'Two friends joined last month and say they already withdrew a small profit.',
        ],
        facts: [
          { label: 'Promised return', value: '3% a week, guaranteed' },
          { label: `What that would turn ${f(stake)} into in one year`, value: f(year) },
        ],
        question: 'What do you do?',
        choices: [
          {
            id: 'join', label: 'Join now before the offer ends. Your friends made money', verdict: 'risky',
            now: 'You send the money to an account you cannot check.',
            later: 'Early small withdrawals are a common trick to build trust. When bigger amounts go in, withdrawals often stop and the group disappears.',
          },
          {
            id: 'small', label: `Put in a small test amount first, say ${f(s(100))}`, verdict: 'risky',
            now: 'It feels safer, but a test tells you nothing. Scams often pay out small amounts on purpose.',
            later: 'You also share your details and bank or card information with people who may target you again.',
          },
          {
            id: 'check', label: 'Stop and check: who runs it, are they registered, and where does the profit come from', verdict: 'good',
            now: 'You look the seller up on your financial regulator\'s register and search the name with the word "scam".',
            later: 'You learn that real investments cannot guarantee returns, and you keep your money. If it is a scam, reporting it can protect others.',
          },
          {
            id: 'ignore', label: 'Ignore it and warn your friends', verdict: 'good',
            now: 'You lose nothing, and your friends hear why the promise does not add up.',
            later: 'If they already sent money, they should stop, save all messages and report it.',
          },
        ],
        takeaway: 'Guaranteed high returns, pressure to act fast and payment to an account you cannot check are three signs of an investment scam. Any one of them is a reason to stop.',
      };
    },
  },
  {
    slug: 'subscriptions',
    title: 'Small subscriptions add up',
    stage: 'school',
    topics: ['budgeting', 'interest'],
    minutes: 3,
    summary: 'Six small monthly payments look harmless. Add them up for a year, then decide which ones earn their place.',
    kind: 'choices',
    lesson: 'make-a-spending-plan',
    lab: 'start-now-or-later',
    build: ({ s, f }) => {
      const subs = [
        { name: 'Music', base: 11, used: true },
        { name: 'Video', base: 16, used: true },
        { name: 'Cloud storage', base: 3, used: true },
        { name: 'Game pass', base: 10, used: false },
        { name: 'Fitness app', base: 13, used: false },
        { name: 'News', base: 5, used: false },
      ].map((x) => ({ ...x, amt: s(x.base) }));
      const month = subs.reduce((a, x) => a + x.amt, 0);
      const unused = subs.filter((x) => !x.used).reduce((a, x) => a + x.amt, 0);
      const invested = growthByYear({ monthly: unused, annualRate: 6, years: 5 })[5];
      return {
        situation: [
          'You check your bank app and count six subscriptions. Each one felt small when you signed up.',
          `You use music, video and cloud storage every week. The game pass, fitness app and news app have not been opened in two months.`,
        ],
        facts: subs.map((x) => ({ label: `${x.name}${x.used ? '' : ' (not used lately)'}`, value: `${f(x.amt)} a month` })),
        table: {
          caption: 'The subscriptions over time',
          head: ['', 'Per month', 'Per year'],
          rows: [
            ['All six', f(month), f(month * 12)],
            ['The three you do not use', f(unused), f(unused * 12)],
          ],
        },
        question: 'What do you do?',
        choices: [
          {
            id: 'keep', label: 'Keep them all. They are small', verdict: 'mixed',
            now: `Nothing changes. You pay ${f(month)} a month.`,
            later: `That is ${f(month * 12)} a year, and ${f(unused * 12)} of it pays for things you do not use.`,
            fitsIf: 'You use them all and they fit your plan after saving.',
          },
          {
            id: 'cancel', label: 'Cancel the three you have not used', verdict: 'good',
            now: `You free up ${f(unused)} a month.`,
            later: `Saved and invested at an example return of 6% a year, that grows to about ${f(invested)} in 5 years.`,
          },
          {
            id: 'rotate', label: 'Keep one streaming service at a time and switch each month', verdict: 'good',
            now: 'You still watch and play what you want, one service at a time.',
            later: 'Rotating and checking for student plans can cut the total without giving up the things you enjoy.',
            fitsIf: 'You are happy to cancel and restart services.',
          },
        ],
        takeaway: 'Small repeat payments are easy to forget. Add them up for a year, keep what you use, and set a reminder to review them every few months.',
      };
    },
  },
  {
    slug: 'credit-card-bill',
    title: 'Your first credit card bill',
    stage: 'first-job',
    topics: ['borrowing', 'interest'],
    minutes: 4,
    summary: 'The statement shows a balance and a small minimum payment. Choose how much to pay and see how long the debt lasts.',
    kind: 'choices',
    lesson: 'credit-and-borrowing',
    lab: 'real-cost',
    build: ({ s, f }) => {
      const bal = s(1000);
      const min = minimumPayoff(bal, 30, 1, s(25));
      const fixed = minimumPayoff(bal, 30, 0, s(200));
      const lateFee = s(30);
      return {
        situation: [
          `Your first credit card statement arrives. The balance is ${f(bal)}, mostly a laptop you needed for work.`,
          `The card charges 30% interest a year on any balance you do not pay by the due date. The minimum payment this month is ${f(Math.max(bal * 0.01 + bal * 0.025, s(25)))}.`,
          `Payday was yesterday, so you have ${f(s(2200))} in your account. Rent of ${f(s(900))} is due next week.`,
        ],
        question: 'How much do you pay?',
        choices: [
          {
            id: 'full', label: `Pay the full ${f(bal)} by the due date`, verdict: 'good',
            now: `You have ${f(s(2200) - bal)} left, which still covers rent. The rest of the month is tighter.`,
            later: 'You pay no interest. On most cards, paying the full statement balance on time means the purchases cost nothing extra.',
            fitsIf: 'Rent and other needs are still covered after the payment.',
          },
          {
            id: 'fixed', label: `Pay ${f(s(200))} a month until it is cleared`, verdict: 'mixed',
            now: 'You keep more cash for rent this month.',
            later: `It takes about ${fixed.months} months and costs about ${f(fixed.interest)} in interest.`,
            fitsIf: 'Paying in full would leave you short for needs.',
          },
          {
            id: 'minimum', label: 'Pay only the minimum', verdict: 'risky',
            now: 'It feels easy. Most of the payment goes to interest.',
            later: min.neverEnds
              ? 'At the minimum payment the balance never clears.'
              : `It takes about ${Math.round(min.months / 12)} years and costs about ${f(min.interest)} in interest, if you never use the card again.`,
          },
          {
            id: 'skip', label: 'Skip this month and pay next month', verdict: 'risky',
            now: `You are charged a late fee of about ${f(lateFee)} plus interest.`,
            later: 'A missed payment can go on your credit history, which lenders and some landlords check.',
          },
        ],
        takeaway: 'Treat the statement balance as the real bill. Paying in full on time costs nothing extra, and paying only the minimum can turn a one-time purchase into years of payments.',
      };
    },
  },
];

export const scenarioBySlug = (slug: string) => SCENARIOS.find((x) => x.slug === slug);
