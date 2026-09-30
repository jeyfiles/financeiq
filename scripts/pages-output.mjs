// Prepares the folder that Cloudflare Pages publishes for the Finance IQ project.
// Runs after `astro build` in `npm run build:pages` (the build command in Cloudflare).
//
// Every address starts with /financeiq/, so the files go into dist-pages/financeiq/.
// jeyinsights.com/financeiq/... is then passed through, unchanged, to <project>.pages.dev/financeiq/...
import { existsSync, rmSync, mkdirSync, cpSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');
const OUT = join(ROOT, 'dist-pages');

if (!existsSync(join(DIST, 'index.html')) || !existsSync(join(DIST, '404.html'))) {
  console.error('dist/ is missing or incomplete. Run "npm run build" first.');
  process.exit(1);
}
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync(DIST, join(OUT, 'financeiq'), { recursive: true });

// Pages serves the nearest 404.html for missing addresses, so a copy at the root catches everything.
cpSync(join(DIST, '404.html'), join(OUT, '404.html'));

// The pages.dev address on its own sends visitors to the real site.
writeFileSync(join(OUT, '_redirects'), '/  https://jeyinsights.com/financeiq/  301\n/financeiq  /financeiq/  301\n');

writeFileSync(join(OUT, '_headers'), `# Build files have a content hash in their names, so they can be cached for a year.
/financeiq/_assets/*
  Cache-Control: public, max-age=31536000, immutable

/financeiq/fonts/*
  Cache-Control: public, max-age=31536000, immutable

/financeiq/*
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  X-Content-Type-Options: nosniff

# Keep the pages.dev copy out of search results. The jeyinsights-proxy Worker removes this header,
# so the real pages at jeyinsights.com/financeiq/ are indexed as normal.
https://:project.pages.dev/*
  X-Robots-Tag: noindex
`);

console.log('Pages output ready in dist-pages/ (site in dist-pages/financeiq/).');
