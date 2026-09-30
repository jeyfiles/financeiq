// Checks every built page for SEO and link problems. Runs in `npm run build` after the writing check.
// Fails the build on: broken internal links or #anchors, missing or duplicate titles and descriptions,
// wrong canonical or og:url, pages without exactly one h1, images without alt text, JSON-LD that does
// not parse, and a sitemap that does not match the indexable pages.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist', import.meta.url));
const SITE = 'https://jeyinsights.com';
const BASE = '/financeiq/';

const walk = (d, out = []) => {
  for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? walk(p, out) : p.endsWith('.html') && out.push(p); }
  return out;
};
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const pages = walk(DIST).map((file) => {
  const html = readFileSync(file, 'utf8');
  const rel = relative(DIST, file).replace(/\\/g, '/');
  const path = BASE + rel.replace(/index\.html$/, '');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  return { file, rel, path, html, ids };
});
const byPath = new Map(pages.map((p) => [p.path, p]));
const errors = [];
const err = (p, msg) => errors.push(`${p.rel}: ${msg}`);
const titles = new Map();
const descs = new Map();
const indexable = [];

for (const p of pages) {
  const { html } = p;
  const is404 = p.rel === '404.html';
  const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '');
  const desc = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '');
  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
  const ogUrl = html.match(/<meta property="og:url" content="([^"]*)"/)?.[1];
  const noindex = /<meta name="robots" content="[^"]*noindex/.test(html);

  if (!/<html lang="en"/.test(html)) err(p, 'missing lang="en"');
  if (!title) err(p, 'missing <title>');
  else if (title.length > 70) err(p, `title is ${title.length} characters (keep it under 70; long lesson titles show without the site name)`);
  if (!desc) err(p, 'missing meta description');
  else if (desc.length < 50 || desc.length > 170) err(p, `description is ${desc.length} characters (aim for 50 to 170)`);
  if (!is404) {
    if (titles.has(title)) err(p, `same title as ${titles.get(title)}`); else titles.set(title, p.rel);
    if (descs.has(desc)) err(p, `same description as ${descs.get(desc)}`); else descs.set(desc, p.rel);
    if (canonical !== SITE + p.path) err(p, `canonical is ${canonical}, expected ${SITE + p.path}`);
    if (ogUrl !== canonical) err(p, 'og:url does not match the canonical address');
  }
  if (is404 && !noindex) err(p, 'the 404 page must be noindex');
  if (!noindex && !is404) indexable.push(SITE + p.path);

  const h1s = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1s !== 1) err(p, `has ${h1s} h1 headings (expected 1)`);

  for (const m of html.matchAll(/<img\b[^>]*>/g)) if (attr(m[0], 'alt') === undefined) err(p, `image without alt: ${m[0].slice(0, 80)}`);

  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch { err(p, 'JSON-LD does not parse'); }
  }

  // Internal links and anchors
  for (const m of html.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)) {
    const href = decode(m[1]);
    if (/^(https?:|mailto:|tel:)/.test(href)) {
      if (href.startsWith('http:')) err(p, `insecure link ${href}`);
      continue;
    }
    const [pathPart, hash] = href.split('#');
    const targetPath = pathPart === '' ? p.path : pathPart;
    if (!targetPath.startsWith(BASE)) { err(p, `link outside /financeiq/ without a full address: ${href}`); continue; }
    const target = byPath.get(targetPath) ?? byPath.get(targetPath.endsWith('/') ? targetPath : `${targetPath}/`);
    const isFile = !targetPath.endsWith('/') && existsSync(join(DIST, targetPath.slice(BASE.length)));
    if (!target && !isFile) { err(p, `broken link ${href}`); continue; }
    if (hash && target && !target.ids.has(hash)) err(p, `link to missing anchor ${href}`);
  }
}

// Sitemap must list exactly the indexable pages
const smFile = join(DIST, 'sitemap-0.xml');
if (!existsSync(smFile)) errors.push('sitemap-0.xml is missing');
else {
  const listed = new Set([...readFileSync(smFile, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
  for (const u of indexable) if (!listed.has(u)) errors.push(`sitemap is missing ${u}`);
  for (const u of listed) if (!indexable.includes(u)) errors.push(`sitemap lists ${u}, which is not an indexable page`);
}

if (errors.length) {
  console.error(`\nSite audit failed (${errors.length}):\n  ` + errors.join('\n  '));
  process.exit(1);
}
console.log(`Site audit passed: ${pages.length} pages, links, anchors, titles, descriptions, canonicals, headings and sitemap.`);
