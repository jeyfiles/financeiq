// Site-wide constants for JeyInsights Finance IQ.

export const SITE = {
  name: 'JeyInsights Finance IQ',
  shortName: 'Finance IQ',
  author: 'Jeyadev',
  origin: 'https://jeyinsights.com',
  base: '/financeiq/',
  description:
    'Free money skills practice for students and young adults. Make a money decision, see what happens next and learn one idea in five minutes. No sign-up.',
  storagePrefix: 'jeyinsights-financeiq-',
  /** Shared with Learn AI and the main site, so the dark mode choice follows the reader. */
  themeKey: 'jeyinsights-learnai-theme',
  ogImage: 'og-financeiq.png',
} as const;

/** Build a path inside /financeiq/. Always ends with a slash unless it points to a file. */
export function url(path = ''): string {
  const clean = path.replace(/^\/+/, '');
  if (!clean) return SITE.base;
  const [, pathPart = '', rest = ''] = clean.match(/^([^?#]*)(.*)$/) ?? [];
  if (!pathPart) return `${SITE.base}${rest}`;
  const isFile = /\.[a-z0-9]+$/i.test(pathPart);
  const finalPath = isFile || pathPart.endsWith('/') ? pathPart : `${pathPart}/`;
  return `${SITE.base}${finalPath}${rest}`;
}

export function absolute(path = ''): string {
  return `${SITE.origin}${url(path)}`;
}

export const NAV = [
  { label: 'Money decisions', href: url('decisions'), match: /^\/financeiq\/decisions\// },
  { label: 'Check your Finance IQ', href: url('check'), match: /^\/financeiq\/check\// },
  { label: 'Money Lab', href: url('lab'), match: /^\/financeiq\/lab\// },
  { label: 'Learn in 3 minutes', href: url('learn'), match: /^\/financeiq\/learn\// },
] as const;

export const MAIN_SITE_LINKS = [
  { label: 'JeyInsights home', href: 'https://jeyinsights.com/' },
  { label: 'Learn AI', href: 'https://jeyinsights.com/learnai/' },
  { label: 'TNEA Compass', href: 'https://jeyinsights.com/tnea' },
  { label: 'Resources', href: 'https://jeyinsights.com/resources' },
] as const;

/** Topics used by the quiz breakdown, lessons and decisions. */
export const TOPICS = [
  { id: 'budgeting', label: 'Budgeting and spending' },
  { id: 'saving', label: 'Saving and emergencies' },
  { id: 'interest', label: 'Interest and growth' },
  { id: 'inflation', label: 'Inflation' },
  { id: 'borrowing', label: 'Credit and borrowing' },
  { id: 'investing', label: 'Investment risk' },
  { id: 'scams', label: 'Scams and fraud' },
  { id: 'paycheck', label: 'Paychecks and taxes' },
] as const;
export type TopicId = (typeof TOPICS)[number]['id'];
export const topicLabel = (id: TopicId) => TOPICS.find((t) => t.id === id)?.label ?? id;
