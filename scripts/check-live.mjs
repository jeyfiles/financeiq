// Checks the live site after a deploy. Usage: npm run check:live
// Against another server: BASE_URL=https://financeiq.pages.dev npm run check:live
const BASE = (process.env.BASE_URL ?? 'https://jeyinsights.com').replace(/\/$/, '');
const CANON = 'https://jeyinsights.com';

const checks = [
  { path: '/financeiq', status: [301, 302, 307, 308], location: '/financeiq/' },
  { path: '/financeiq/', status: 200, type: 'text/html', contains: `<link rel="canonical" href="${CANON}/financeiq/"` },
  { path: '/financeiq/decisions/first-paycheck/', status: 200, contains: 'Your first paycheck' },
  { path: '/financeiq/check/', status: 200 },
  { path: '/financeiq/lab/start-now-or-later/', status: 200 },
  { path: '/financeiq/learn/spot-a-money-scam/', status: 200 },
  { path: '/financeiq/sitemap-index.xml', status: 200, type: 'xml', contains: `${CANON}/financeiq/sitemap-0.xml` },
  { path: '/financeiq/og-financeiq.png', status: 200, type: 'image/png' },
  { path: '/financeiq/fonts/oswald-latin-var.woff2', status: 200, cache: 'immutable' },
  { path: '/financeiq/this-page-does-not-exist/', status: 404, contains: 'We could not find that page' },
  // The old placeholder address should send visitors to Finance IQ.
  { path: '/finance', status: [301, 302, 307, 308], location: '/financeiq/' },
];

let failed = 0;
for (const c of checks) {
  const problems = [];
  let res;
  try {
    res = await fetch(BASE + c.path, { redirect: 'manual' });
  } catch (e) {
    console.log(`FAIL ${c.path}  could not connect (${e.message})`); failed++; continue;
  }
  const ok = Array.isArray(c.status) ? c.status.includes(res.status) : res.status === c.status;
  if (!ok) problems.push(`status ${res.status}, expected ${c.status}`);
  const type = res.headers.get('content-type') ?? '';
  if (c.type && !type.includes(c.type)) problems.push(`content-type "${type}"`);
  if (c.location && !(res.headers.get('location') ?? '').endsWith(c.location)) problems.push(`redirects to "${res.headers.get('location')}"`);
  if (c.cache && !(res.headers.get('cache-control') ?? '').includes(c.cache)) problems.push(`cache-control "${res.headers.get('cache-control')}"`);
  if (res.headers.get('x-robots-tag')?.includes('noindex') && BASE === CANON) problems.push('x-robots-tag noindex is still set (the Worker should remove it)');
  if (c.contains) {
    const body = await res.text();
    if (!body.includes(c.contains)) problems.push(`does not contain ${c.contains}`);
  }
  if (problems.length) { failed++; console.log(`FAIL ${c.path}  ${problems.join('; ')}`); }
  else console.log(`ok   ${c.path}  ${res.status}`);
}
console.log(failed ? `\n${failed} check(s) failed on ${BASE}` : `\nAll checks passed on ${BASE}`);
process.exit(failed ? 1 : 0);
