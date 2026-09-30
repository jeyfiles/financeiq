// "Check your Finance IQ": eight questions, one per topic.
// The result is a learning score with an explanation for every answer. It is not a test of intelligence
// or a measure of financial readiness, and the page says so.
import type { QuizQuestion } from './types';
import { compound } from '../lib/calc';

export const QUIZ: QuizQuestion[] = [
  {
    id: 'q-budget',
    topic: 'budgeting',
    question: ({ m }) => `Your take-home pay is ${m(2000)} a month. Which plan is most likely to keep you out of trouble?`,
    options: ({ m }) => [
      'Spend what you want, then save whatever is left at the end of the month',
      `Pay needs first, move ${m(200)} to savings on payday, then spend the rest`,
      'Save everything and spend only when something runs out',
      'Use a credit card for everything and pay it off when you can',
    ],
    answer: 1,
    explain: () => 'Paying needs first and moving savings on payday means saving happens before spending. "Whatever is left" is often nothing. Saving everything is hard to keep up, and a card you pay "when you can" builds interest.',
    next: { kind: 'learn', slug: 'make-a-spending-plan', label: 'Make a spending plan' },
  },
  {
    id: 'q-emergency',
    topic: 'saving',
    question: () => 'What is an emergency fund for?',
    options: () => [
      'A holiday you have been planning for a year',
      'Unexpected costs such as a repair, a medical bill or a gap between jobs',
      'Buying shares when prices drop',
      'Paying your regular monthly bills',
    ],
    answer: 1,
    explain: () => 'An emergency fund covers costs you did not plan for, so a surprise does not become debt. Planned costs, such as a holiday, get their own savings goal. Many guides suggest building up to three to six months of essential costs over time.',
    next: { kind: 'decisions', slug: 'first-paycheck', label: 'Try: Your first paycheck' },
  },
  {
    id: 'q-compound',
    topic: 'interest',
    question: ({ m }) => `You invest ${m(1000)} at 8% a year and leave the interest in. Roughly how much do you have after 10 years?`,
    options: ({ m, s, f }) => [m(1080), m(1800), f(compound(s(1000), 8, 10)), m(8000)],
    answer: 2,
    explain: ({ m, s, f }) => `With compound interest you earn interest on earlier interest too, so ${m(1000)} grows to about ${f(compound(s(1000), 8, 10))}. Simple interest of 8% a year for 10 years would give only ${m(1800)}.`,
    next: { kind: 'learn', slug: 'interest-and-growth', label: 'How interest grows' },
  },
  {
    id: 'q-inflation',
    topic: 'inflation',
    question: () => 'Your savings account pays 3% a year. Prices are rising by 5% a year. After one year, what can your savings buy?',
    options: () => ['More than today', 'The same as today', 'Less than today', 'It depends on the bank'],
    answer: 2,
    explain: () => 'Your money grew by 3%, but prices grew by 5%, so it buys about 2% less. This is the real return: the return minus inflation.',
    next: { kind: 'learn', slug: 'inflation', label: 'Inflation: why prices creep up' },
  },
  {
    id: 'q-credit',
    topic: 'borrowing',
    question: ({ m }) => `Your credit card statement shows a balance of ${m(600)} and a minimum payment of ${m(25)}. What happens if you pay only the minimum?`,
    options: () => [
      'Nothing. The minimum means the card is paid for this month',
      'Interest is charged on the unpaid balance, and the debt can take years to clear',
      'The bank closes your card',
      'Your balance is cut in half next month',
    ],
    answer: 1,
    explain: () => 'The minimum only keeps the account in good standing. On most cards, interest is charged on whatever you do not pay, and at typical card rates the debt can last for years.',
    next: { kind: 'learn', slug: 'credit-and-borrowing', label: 'Credit and borrowing basics' },
  },
  {
    id: 'q-diversify',
    topic: 'investing',
    question: () => 'Which choice spreads your investment risk the most?',
    options: () => [
      'All your money in one company you like',
      'A fund that holds hundreds of companies across many industries',
      'Two companies in the same industry',
      'A new coin a friend recommended',
    ],
    answer: 1,
    explain: () => 'Spreading money across many companies and industries means one bad result hurts less. This is diversification. It lowers risk but does not remove it: the whole market can still fall.',
    next: { kind: 'learn', slug: 'risk-and-return', label: 'Risk, return and spreading it out' },
  },
  {
    id: 'q-scam',
    topic: 'scams',
    question: () => 'Which of these is the clearest sign of an investment scam?',
    options: () => [
      'The investment has a long written document',
      'The seller promises high returns with no risk and says to decide today',
      'The price of the investment goes up and down',
      'You need to be 18 to open an account',
    ],
    answer: 1,
    explain: () => 'Real investments can lose money, so "guaranteed" high returns are a warning sign. Pressure to decide fast is another. Prices going up and down is normal for real investments.',
    next: { kind: 'learn', slug: 'spot-a-money-scam', label: 'Spot a money scam' },
  },
  {
    id: 'q-paycheck',
    topic: 'paycheck',
    question: ({ m }) => `A job offer says ${m(3000)} a month. Your first paycheck is ${m(2400)}. What is the most likely reason?`,
    options: () => [
      'The employer made a mistake',
      'The offer was gross pay. Take-home pay is lower after tax and other deductions',
      'First paychecks are always smaller',
      'The bank took a fee',
    ],
    answer: 1,
    explain: () => 'Offers usually state gross pay. Your paycheck is net (take-home) pay, after deductions such as income tax, social insurance or retirement contributions. Plan your budget on take-home pay, and check your pay slip to see each deduction.',
    next: { kind: 'decisions', slug: 'first-paycheck', label: 'Try: Your first paycheck' },
  },
];
