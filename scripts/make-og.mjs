// Renders the Open Graph image (1200x630 PNG) with the brand fonts. Only needed if the brand changes.
// Run: node scripts/make-og.mjs   (needs Playwright's Chromium: npx playwright install chromium)
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const font = (n) => `data:font/woff2;base64,${readFileSync(`${root}public/fonts/${n}`).toString('base64')}`;
const mark = readFileSync(`${root}src/components/BrandMark.astro`, 'utf8').match(/<svg[\s\S]*<\/svg>/)[0]
  .replace(/width=\{size\} height=\{size\}/, 'width="220" height="220"');
const html = `<!doctype html><html><head><style>
@font-face{font-family:Oswald;src:url(${font('oswald-latin-var.woff2')});font-weight:200 700}
@font-face{font-family:Atk;src:url(${font('atkinson-next-latin-var.woff2')});font-weight:200 800}
body{margin:0;width:1200px;height:630px;background:#52745F;font-family:Atk;overflow:hidden;position:relative;color:#fff}
.ring{position:absolute;right:-140px;bottom:-200px;width:560px;height:560px;border-radius:50%;border:64px solid rgba(255,255,255,.08)}
.wrap{position:absolute;inset:0;display:flex;align-items:center;gap:64px;padding:0 90px}
svg{flex:none;filter:drop-shadow(0 12px 30px rgba(0,0,0,.18))} svg circle{fill:#3F6450}
.eyebrow{font-size:26px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin:0 0 14px}
h1{font-family:Oswald;font-weight:500;font-size:92px;line-height:1.02;margin:0 0 22px}
h1 span{background:linear-gradient(transparent 70%,#E3A13A 70%)}
p{font-size:32px;line-height:1.35;margin:0;max-width:700px}
.small{font-size:24px;margin-top:26px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;opacity:.9}
</style></head><body><div class="ring"></div><div class="wrap">${mark}<div>
<p class="eyebrow">JeyInsights Finance IQ</p><h1>Your money.<br><span>Your move.</span></h1>
<p>Make a money decision, see what happens next and learn one idea in five minutes.</p>
<p class="small">jeyinsights.com/financeiq</p></div></div></body></html>`;
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(html); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
await p.screenshot({ path: `${root}public/og-financeiq.png`, type: 'png' });
await b.close();
console.log('wrote public/og-financeiq.png');
