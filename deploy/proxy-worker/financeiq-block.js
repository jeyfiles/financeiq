    // ---- JeyInsights Finance IQ -----------------------------------------------------------
    // jeyinsights.com/financeiq/... is served by the Finance IQ Pages project.
    // The path is passed on unchanged: /financeiq/lab/ -> <FINANCEIQ_ORIGIN>/financeiq/lab/
    // Put this block next to the Learn AI block, before the line that serves everything else.
    if (url.pathname === '/financeiq' || url.pathname.startsWith('/financeiq/')) {
      // CHANGE THIS to your Finance IQ project's pages.dev address (no slash at the end).
      // financeiq.pages.dev is taken by another site, so yours looks like financeiq-abc.pages.dev.
      const FINANCEIQ_ORIGIN = 'https://YOUR-PROJECT.pages.dev';
      const upstream = new URL(url.pathname + url.search, FINANCEIQ_ORIGIN);
      const headers = new Headers(request.headers);
      headers.delete('host');
      const res = await fetch(upstream, { method: request.method, headers, redirect: 'manual' });
      const out = new Headers(res.headers);
      // The pages.dev copy is marked noindex; the real address must stay indexable.
      out.delete('x-robots-tag');
      // Keep visitors on jeyinsights.com if Pages answers with a full pages.dev address.
      const loc = out.get('location');
      if (loc && loc.startsWith(FINANCEIQ_ORIGIN)) out.set('location', loc.slice(FINANCEIQ_ORIGIN.length) || '/');
      return new Response(res.body, { status: res.status, statusText: res.statusText, headers: out });
    }

    // The old placeholder page lived at /finance. Send it to Finance IQ.
    if (url.pathname === '/finance' || url.pathname === '/finance/' || url.pathname === '/finance.html') {
      return Response.redirect(`${url.origin}/financeiq/`, 301);
    }
    // ---- end of Finance IQ ----------------------------------------------------------------
