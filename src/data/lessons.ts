// "Learn in 3 Minutes": six short lessons.
// Amounts are written as {{1000}} (base units). The page shows them in the reader's currency.
import type { Lesson } from './types';

export const LESSONS: Lesson[] = [
  {
    slug: 'make-a-spending-plan',
    title: 'Make a spending plan',
    topic: 'budgeting',
    minutes: 3,
    summary: 'Give every part of your money a job before you spend it: needs, savings, then wants.',
    bigIdea: 'A budget is not a list of things you cannot buy. It is a plan that decides where your money goes before it is gone.',
    sections: [
      {
        heading: 'Start from take-home pay',
        body: [
          'Plan with the money that reaches your account, not the number in a job offer. That is your take-home pay, after tax and other deductions.',
          'If your income changes month to month, plan with a low month, not a good one.',
        ],
      },
      {
        heading: 'Needs, savings, wants',
        body: [
          'Needs are costs you must pay: housing, food, transport, phone, loan payments. Wants are everything else: eating out, games, clothes you would like but do not need.',
          'A common starting point is the 50/30/20 split: about half for needs, a third for wants and a fifth for savings. It is a guide, not a rule. If rent is high where you live, needs may take more, and that is fine.',
        ],
      },
      {
        heading: 'Pay yourself first',
        body: [
          'Move your savings on payday, before you spend. An automatic transfer works best, because you never have to decide again.',
          'Keep a small pot for bills you know are coming, such as a yearly fee or a birthday. Then those bills do not eat your emergency savings.',
        ],
      },
    ],
    example: {
      title: 'Worked example',
      lines: [
        'Take-home pay: {{2000}} a month.',
        'Needs: {{1000}}. Savings on payday: {{400}}. Wants: {{600}}.',
        'Saving {{400}} a month builds {{4800}} in a year, before any interest.',
      ],
    },
    terms: [
      { term: 'Take-home pay', meaning: 'Pay after tax and other deductions. Also called net pay.' },
      { term: 'Fixed cost', meaning: 'A cost that is the same every month, such as rent.' },
      { term: 'Variable cost', meaning: 'A cost that changes, such as food or transport.' },
    ],
    check: {
      question: 'When is the best time to move money into savings?',
      options: ['At the end of the month, from what is left', 'On payday, before spending', 'Only when you get a bonus'],
      answer: 1,
      explain: 'Saving on payday means it happens first. Money left at the end of the month is often zero.',
    },
    tryNext: [
      { href: 'decisions/first-paycheck', label: 'Decision: Your first paycheck' },
      { href: 'lab/savings-goal', label: 'Money Lab: Savings goal' },
    ],
    sources: [
      { title: 'CFPB: Youth financial education (building blocks)', url: 'https://www.consumerfinance.gov/consumer-tools/educator-tools/youth-financial-education/' },
    ],
  },
  {
    slug: 'interest-and-growth',
    title: 'How interest grows money and debt',
    topic: 'interest',
    minutes: 3,
    summary: 'Compound interest is interest on interest. It makes savings grow faster, and it makes debt grow faster too.',
    bigIdea: 'Time is the biggest ingredient. The same monthly amount grows much more when it starts earlier.',
    sections: [
      {
        heading: 'Simple and compound interest',
        body: [
          'Simple interest is paid only on the amount you put in. Compound interest is paid on the amount you put in plus the interest you already earned.',
          'In the first years the difference is small. Over ten or twenty years it becomes large.',
        ],
      },
      {
        heading: 'The rule of 72',
        body: [
          'Divide 72 by the yearly interest rate to estimate how many years it takes to double. At 8% a year, money doubles in about 9 years. At 4%, about 18 years.',
          'The same rule works for debt. A card balance at 24% a year doubles in about 3 years if nothing is paid.',
        ],
      },
      {
        heading: 'Rates are not promises',
        body: [
          'A savings account rate can change. Investment returns are not fixed at all: some years are up and some are down. Calculators use an assumed average so you can compare choices, not predict the future.',
        ],
      },
    ],
    example: {
      title: 'Worked example',
      lines: [
        '{{1000}} at 8% a year, left alone for 10 years.',
        'Simple interest: {{1000}} plus 10 years of {{80}} = {{1800}}.',
        'Compound interest: about {{2159}}. The extra {{359}} is interest earned on interest.',
      ],
    },
    terms: [
      { term: 'Principal', meaning: 'The amount you first put in or borrow.' },
      { term: 'Compound interest', meaning: 'Interest calculated on the principal plus earlier interest.' },
      { term: 'Rate of return', meaning: 'How much an investment gains or loses in a year, as a percentage.' },
    ],
    check: {
      question: 'Using the rule of 72, about how long does money take to double at 6% a year?',
      options: ['6 years', '12 years', '72 years'],
      answer: 1,
      explain: '72 divided by 6 is 12, so about 12 years.',
    },
    tryNext: [
      { href: 'lab/start-now-or-later', label: 'Money Lab: Start now or later' },
      { href: 'decisions/credit-card-bill', label: 'Decision: Your first credit card bill' },
    ],
    sources: [
      { title: 'Investor.gov: Compound interest calculator', url: 'https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator' },
      { title: 'Investor.gov: What is compound interest? (includes the rule of 72)', url: 'https://www.investor.gov/additional-resources/information/youth/teachers-classroom-resources/what-compound-interest' },
    ],
  },
  {
    slug: 'inflation',
    title: 'Inflation: why prices creep up',
    topic: 'inflation',
    minutes: 3,
    summary: 'When prices rise, the same money buys less. Your savings need to grow at least as fast as prices to keep their value.',
    bigIdea: 'What matters is not how many coins you have, but what they can buy.',
    sections: [
      {
        heading: 'What inflation is',
        body: [
          'Inflation is the rise in prices over time. If inflation is 5% a year, something that costs {{100}} today costs about {{105}} next year.',
          'Inflation rates are different in every country and change from year to year. Central banks and statistics offices publish the current rate.',
        ],
      },
      {
        heading: 'Real return',
        body: [
          'Your real return is roughly your interest rate minus inflation. Savings at 3% while prices rise 5% lose about 2% of their buying power each year.',
          'Cash under the mattress earns nothing, so it loses the full rate of inflation.',
        ],
      },
      {
        heading: 'What you can do',
        body: [
          'Keep your emergency fund in safe, easy to reach savings, even if it trails inflation a little. Its job is to be there when you need it.',
          'For goals many years away, people often use investments that can grow faster than prices, and accept that their value goes up and down.',
        ],
      },
    ],
    example: {
      title: 'Worked example',
      lines: [
        'A laptop costs {{800}} today.',
        'With prices rising 5% a year, the same laptop costs about {{1021}} in 5 years.',
        'Savings earning 2% a year would grow {{800}} to only about {{883}}.',
      ],
    },
    terms: [
      { term: 'Inflation', meaning: 'The general rise in prices over time.' },
      { term: 'Purchasing power', meaning: 'How much your money can buy.' },
      { term: 'Real return', meaning: 'Your return after taking inflation away.' },
    ],
    check: {
      question: 'Savings pay 4% a year and inflation is 4%. What happens to your buying power?',
      options: ['It grows by 4%', 'It stays about the same', 'It falls by 4%'],
      answer: 1,
      explain: 'Your money grows as fast as prices do, so it buys about the same as before.',
    },
    tryNext: [
      { href: 'lab/start-now-or-later', label: 'Money Lab: Start now or later' },
      { href: 'check', label: 'Check your Finance IQ' },
    ],
    sources: [
      { title: 'IMF: Inflation, prices on the rise', url: 'https://www.imf.org/en/Publications/fandd/issues/Series/Back-to-Basics/Inflation' },
    ],
  },
  {
    slug: 'credit-and-borrowing',
    title: 'Credit and borrowing basics',
    topic: 'borrowing',
    minutes: 3,
    summary: 'Borrowing lets you pay later, but you pay back more. Learn the words on the paperwork and the cost of paying slowly.',
    bigIdea: 'The price of borrowing is the interest and fees. Compare the total you pay back, not the monthly payment.',
    sections: [
      {
        heading: 'APR and the total cost',
        body: [
          'The APR (annual percentage rate) is the yearly cost of borrowing, including some fees. A higher APR means you pay back more.',
          'A low monthly payment can hide a high total. Stretching a loan over more months lowers each payment but raises the total interest.',
        ],
      },
      {
        heading: 'Cards, installments and buy now pay later',
        body: [
          'On most credit cards, paying the full statement balance by the due date means no interest on purchases. Paying less means interest on the rest, often at a high rate.',
          'Installment plans and buy now pay later split a price into parts. Some charge no interest but add fees, and late payments can bring extra charges. Read the terms before you agree.',
        ],
      },
      {
        heading: 'Your credit history',
        body: [
          'Lenders keep records of how you repay. Paying on time builds a good history, which can mean lower rates later. Missed payments can stay on your record for years.',
          'How credit records and scores work depends on your country. Many countries have credit bureaus, and you can usually check your own report for free or at low cost.',
        ],
      },
    ],
    example: {
      title: 'Worked example',
      lines: [
        'You borrow {{1000}} at 12% APR.',
        'Paid back over 12 months: about {{88.85}} a month, {{66}} interest in total.',
        'Paid back over 36 months: about {{33.21}} a month, but about {{196}} interest in total.',
      ],
    },
    terms: [
      { term: 'APR', meaning: 'Annual percentage rate: the yearly cost of borrowing.' },
      { term: 'Minimum payment', meaning: 'The smallest amount you must pay to avoid a late fee. It does not stop interest.' },
      { term: 'Credit history', meaning: 'A record of how you have borrowed and repaid.' },
    ],
    check: {
      question: 'Two loans have the same APR. One lasts 12 months, the other 36 months. Which costs more interest in total?',
      options: ['The 12 month loan', 'The 36 month loan', 'They cost the same'],
      answer: 1,
      explain: 'You owe money for longer, so interest is charged for longer, even though each payment is smaller.',
    },
    tryNext: [
      { href: 'lab/real-cost', label: 'Money Lab: Real purchase cost' },
      { href: 'decisions/new-phone', label: 'Decision: You want a new phone' },
    ],
    sources: [
      { title: 'CFPB: What is a credit report?', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-a-credit-report-en-309/' },
      { title: 'CFPB: What is a buy now, pay later loan?', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-a-buy-now-pay-later-bnpl-loan-en-2119/' },
    ],
  },
  {
    slug: 'risk-and-return',
    title: 'Risk, return and spreading it out',
    topic: 'investing',
    minutes: 3,
    summary: 'Investments that can earn more can also lose more. Spreading your money and giving it time lowers the risk.',
    bigIdea: 'No investment gives high returns with no risk. Anyone who says otherwise is selling something.',
    sections: [
      {
        heading: 'Risk and return go together',
        body: [
          'Savings accounts are low risk and low return. Shares in companies can grow more over time but can also fall sharply in a single year.',
          'Risk means your investment may be worth less than you paid, at least for a while.',
        ],
      },
      {
        heading: 'Diversification',
        body: [
          'Diversification means spreading money across many investments, so one bad result hurts less. A fund that holds hundreds of companies is more spread out than one share.',
          'It lowers risk but does not remove it. When the whole market falls, most investments fall together.',
        ],
      },
      {
        heading: 'Time and fees',
        body: [
          'Money you need within a few years is usually kept in safer places, because there may not be time to recover from a fall.',
          'Fees come out every year, whether the investment goes up or down. A difference of 1% a year adds up to a large amount over decades.',
        ],
      },
    ],
    example: {
      title: 'Worked example',
      lines: [
        '{{10000}} grows at 7% a year for 30 years.',
        'With fees of 0.2% a year it grows to about {{72000}}.',
        'With fees of 1.2% a year it grows to about {{54300}}. The extra 1% in fees costs about {{17700}}.',
      ],
    },
    terms: [
      { term: 'Share (stock)', meaning: 'A small piece of ownership in a company.' },
      { term: 'Fund', meaning: 'A pool of money from many people, invested in many things at once.' },
      { term: 'Diversification', meaning: 'Spreading money across different investments to lower risk.' },
    ],
    check: {
      question: 'You need the money for college fees in one year. Which is the more suitable place for it?',
      options: ['A single company share', 'A safe savings account', 'A new coin that is rising fast'],
      answer: 1,
      explain: 'With one year to go, there is little time to recover from a fall. Safe savings protect money you need soon.',
    },
    tryNext: [
      { href: 'lab/start-now-or-later', label: 'Money Lab: Start now or later' },
      { href: 'decisions/guaranteed-returns', label: 'Decision: Guaranteed returns' },
    ],
    sources: [
      { title: 'Investor.gov: Diversify your investments', url: 'https://www.investor.gov/introduction-investing/investing-basics/save-and-invest/diversify-your-investments' },
      { title: 'Investor.gov: How fees and expenses affect your investment portfolio', url: 'https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/updated' },
    ],
  },
  {
    slug: 'spot-a-money-scam',
    title: 'Spot a money scam',
    topic: 'scams',
    minutes: 3,
    summary: 'Scams use the same few tricks: a promise that is too good, pressure to act now and a payment you cannot undo.',
    bigIdea: 'Slow down. A real opportunity will still be there after you check it.',
    sections: [
      {
        heading: 'The red flags',
        body: [
          'Guaranteed high returns, or returns with "no risk". Pressure to decide today. Requests to pay by gift card, crypto or a transfer to a personal account.',
          'Messages from someone you have only met online, screenshots of profits, and friends who were paid a small amount early to build trust.',
        ],
      },
      {
        heading: 'Never share these',
        body: [
          'One-time passwords (OTPs), card PINs, bank logins or screen-sharing access. A real bank or payment app will not ask for them.',
          'If someone asks you to "receive" money and send it on, say no. Moving money for others can make you part of a crime.',
        ],
      },
      {
        heading: 'Check, then report',
        body: [
          'Look up the person or company on your financial regulator\'s register. Search the name with the word "scam". Ask someone you trust before you pay.',
          'If you already paid, contact your bank or payment app at once, keep every message and report it. Acting fast can sometimes stop the payment.',
        ],
      },
    ],
    example: {
      title: 'Why "3% a week" is a warning',
      lines: [
        '3% a week, compounded, is about 365% a year.',
        '{{500}} would become about {{2330}} in a year.',
        'No legitimate investment can guarantee that. The promise itself is the red flag.',
      ],
    },
    terms: [
      { term: 'Ponzi scheme', meaning: 'A fraud that pays earlier investors with money from new investors.' },
      { term: 'Phishing', meaning: 'A fake message that tries to get your passwords or payment details.' },
      { term: 'Money mule', meaning: 'A person who moves stolen money for someone else.' },
    ],
    check: {
      question: 'A message from "your bank" asks you to read out the code it just sent to your phone. What do you do?',
      options: ['Read out the code so they can fix the problem', 'Hang up and call the bank on the number printed on your card', 'Send the code by text instead'],
      answer: 1,
      explain: 'Banks do not ask for one-time codes. Contact them yourself using a number you already trust.',
    },
    tryNext: [
      { href: 'decisions/guaranteed-returns', label: 'Decision: Guaranteed returns' },
      { href: 'check', label: 'Check your Finance IQ' },
    ],
    countryNotes: {
      title: 'Where to check and where to report',
      intro: 'Each country has its own regulator and fraud reporting service. Here are official places for some countries. If yours is not listed, search for your national financial regulator and police fraud service.',
      rows: [
        {
          place: 'United States',
          check: { label: 'FINRA BrokerCheck', href: 'https://brokercheck.finra.org/' },
          report: { label: 'FTC: ReportFraud', href: 'https://reportfraud.ftc.gov/' },
        },
        {
          place: 'India',
          check: { label: 'SEBI: Recognised intermediaries', href: 'https://www.sebi.gov.in/intermediaries.html' },
          report: { label: 'National Cyber Crime Reporting Portal', href: 'https://cybercrime.gov.in/' },
          note: 'For online financial fraud you can also call the helpline 1930.',
        },
        {
          place: 'United Kingdom',
          check: { label: 'FCA: Financial Services Register', href: 'https://register.fca.org.uk/' },
          report: { label: 'Report Fraud (replaced Action Fraud)', href: 'https://www.reportfraud.police.uk/' },
        },
        {
          place: 'Canada',
          check: { label: 'CSA: Are they registered?', href: 'https://www.securities-administrators.ca/investor-tools/are-they-registered/' },
          report: { label: 'Canadian Anti-Fraud Centre', href: 'https://antifraudcentre-centreantifraude.ca/' },
        },
        {
          place: 'Australia',
          check: { label: 'Moneysmart: Check before you invest', href: 'https://moneysmart.gov.au/check-and-report-scams/check-before-you-invest' },
          report: { label: 'Scamwatch', href: 'https://www.scamwatch.gov.au/' },
        },
      ],
    },
    sources: [
      { title: 'Investor.gov: What you can do to avoid investment fraud', url: 'https://www.investor.gov/protect-your-investments/fraud/how-avoid-fraud/what-you-can-do-avoid-investment-fraud' },
      { title: 'FINRA: Artificial intelligence and investment fraud', url: 'https://www.finra.org/investors/insights/artificial-intelligence-and-investment-fraud' },
    ],
  },
];

export const lessonBySlug = (slug: string) => LESSONS.find((l) => l.slug === slug);
