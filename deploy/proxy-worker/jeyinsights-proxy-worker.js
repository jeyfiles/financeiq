// worker.js
// Handles all traffic for jeyinsights.com and www.jeyinsights.com
// - /learnai and /learnai/*     → proxied to learnai-2wy.pages.dev (URL stays the same)
// - /financeiq and /financeiq/* → proxied to financeiq-519.pages.dev (URL stays the same)
// - /finance (old placeholder)  → 301 redirect to /financeiq/
// - /tnea and /tnea/*           → proxied to tneacompasslite.pages.dev (URL stays the same)
// - everything else             → proxied to jeyinsights.pages.dev

const LEARNAI_ORIGIN     = 'https://learnai-2wy.pages.dev';
const FINANCEIQ_ORIGIN   = 'https://financeiq-519.pages.dev';
const TNEA_ORIGIN        = 'https://tneacompasslite.pages.dev';
const JEYINSIGHTS_ORIGIN = 'https://jeyinsights.pages.dev';

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Proxy /learnai and /learnai/* to the Learn AI Pages project (path unchanged)
    if (url.pathname === '/learnai' || url.pathname.startsWith('/learnai/')) {
      const upstreamURL = LEARNAI_ORIGIN + url.pathname + url.search;

      // Set correct Host header for upstream
      const headers = new Headers(request.headers);
      headers.set('Host', 'learnai-2wy.pages.dev');

      const proxyRequest = new Request(upstreamURL, {
        method  : request.method,
        headers,
        body    : request.method !== 'GET' && request.method !== 'HEAD'
                    ? request.body
                    : undefined,
      });

      const response = await fetch(proxyRequest);

      // The pages.dev copy is marked noindex so it stays out of search results.
      // Remove that header here so the real address (jeyinsights.com/learnai/) is indexed normally.
      const outHeaders = new Headers(response.headers);
      outHeaders.delete('x-robots-tag');

      return new Response(response.body, {
        status     : response.status,
        statusText : response.statusText,
        headers    : outHeaders,
      });
    }

    // Old Finance IQ placeholder address → the real Finance IQ page
    if (url.pathname === '/finance' || url.pathname === '/finance/' || url.pathname === '/finance.html') {
      return Response.redirect(`${url.origin}/financeiq/`, 301);
    }

    // Proxy /financeiq and /financeiq/* to the Finance IQ Pages project (path unchanged)
    if (url.pathname === '/financeiq' || url.pathname.startsWith('/financeiq/')) {
      const upstreamURL = FINANCEIQ_ORIGIN + url.pathname + url.search;

      // Set correct Host header for upstream
      const headers = new Headers(request.headers);
      headers.set('Host', 'financeiq-519.pages.dev');

      const proxyRequest = new Request(upstreamURL, {
        method   : request.method,
        headers,
        body     : request.method !== 'GET' && request.method !== 'HEAD'
                     ? request.body
                     : undefined,
        // Pass redirects (for example /financeiq → /financeiq/) to the browser instead of following them here,
        // so the address bar always shows the right page.
        redirect : 'manual',
      });

      const response = await fetch(proxyRequest);

      const outHeaders = new Headers(response.headers);
      // The pages.dev copy is marked noindex; the real address (jeyinsights.com/financeiq/) must stay indexable.
      outHeaders.delete('x-robots-tag');
      // If Pages answers with a full pages.dev address, keep the visitor on jeyinsights.com.
      const location = outHeaders.get('location');
      if (location && location.startsWith(FINANCEIQ_ORIGIN)) {
        outHeaders.set('location', location.slice(FINANCEIQ_ORIGIN.length) || '/');
      }

      return new Response(response.body, {
        status     : response.status,
        statusText : response.statusText,
        headers    : outHeaders,
      });
    }

    // Proxy /tnea and /tnea/* to tneacompasslite
    if (url.pathname === '/tnea' || url.pathname.startsWith('/tnea/')) {
      const upstreamPath = url.pathname === '/tnea'
        ? '/'
        : url.pathname.slice('/tnea'.length);

      const upstreamURL = TNEA_ORIGIN + upstreamPath + url.search;

      // Set correct Host header for upstream
      const headers = new Headers(request.headers);
      headers.set('Host', 'tneacompasslite.pages.dev');

      const proxyRequest = new Request(upstreamURL, {
        method  : request.method,
        headers,
        body    : request.method !== 'GET' && request.method !== 'HEAD'
                    ? request.body
                    : undefined,
      });

      const response = await fetch(proxyRequest);
      return new Response(response.body, {
        status     : response.status,
        statusText : response.statusText,
        headers    : response.headers,
      });
    }

    // Everything else → serve jeyinsights.pages.dev
    const upstreamURL = JEYINSIGHTS_ORIGIN + url.pathname + url.search;

    // Set correct Host header for upstream
    const headers = new Headers(request.headers);
    headers.set('Host', 'jeyinsights.pages.dev');

    const proxyRequest = new Request(upstreamURL, {
      method  : request.method,
      headers,
      body    : request.method !== 'GET' && request.method !== 'HEAD'
                  ? request.body
                  : undefined,
    });

    const response = await fetch(proxyRequest);
    return new Response(response.body, {
      status     : response.status,
      statusText : response.statusText,
      headers    : response.headers,
    });
  },
};
