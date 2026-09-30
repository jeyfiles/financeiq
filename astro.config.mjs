// JeyInsights Finance IQ. Static site served from https://jeyinsights.com/financeiq/
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import preact from '@astrojs/preact';

export default defineConfig({
  site: 'https://jeyinsights.com',
  base: '/financeiq',
  trailingSlash: 'always',
  output: 'static',
  build: { format: 'directory', assets: '_assets', inlineStylesheets: 'auto' },
  compressHTML: true,
  prefetch: false,
  integrations: [
    preact(),
    sitemap({ filter: (page) => !page.includes('/404') }),
  ],
});
