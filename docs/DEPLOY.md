# Deploy Finance IQ to jeyinsights.com/financeiq

```
visitor -> jeyinsights.com/financeiq/...  -> jeyinsights-proxy Worker -> <project>.pages.dev/financeiq/...
```

Same pattern as Learn AI and TNEA Compass. Finance IQ has its own GitHub repo and its own Cloudflare **Pages** project
(create it from the Pages tab, not Workers: the Pages screen has no "Deploy command" box). After the first setup, every `git push` deploys.

## 1. Check it on your computer

```bash
cd C:\Ramya\Personal\code-repo\financeiq
npm install
npm run dev
```

Open http://localhost:4321/financeiq/. To see the production build: `npm run build` then `npm run preview`.

## 2. Push to GitHub

Create an empty repo **jeyfiles/financeiq** on GitHub (no README, no .gitignore), then:

```bash
git init
git add .
git commit -m "Finance IQ first release"
git branch -M main
git remote add origin https://github.com/jeyfiles/financeiq.git
git push -u origin main
```

`.gitignore` keeps out `node_modules/`, build output, test reports, `screenshots/`, `notes/` and `FINANCEIQ_PROGRESS.md`
(working notes from our sessions). Check with `git status` before the first commit: only source files should be listed.

## 3. Create the Cloudflare Pages project

Cloudflare dashboard > Workers & Pages > Create > **Pages** tab > Import an existing Git repository > **jeyfiles/financeiq**.

| Setting | Value |
|---|---|
| Project name | `financeiq`. The address `financeiq.pages.dev` already belongs to another site, so Cloudflare gives yours a different one, such as `financeiq-abc.pages.dev`. Note it down |
| Production branch | `main` |
| Framework preset | None |
| Build command | `npm run build:pages` |
| Build output directory | `dist-pages` |
| Environment variable | `NODE_VERSION` = `22` (the repo also has `.nvmrc`) |

After the build, open `https://<project>.pages.dev/financeiq/`. The bare `https://<project>.pages.dev/` sends you to jeyinsights.com/financeiq/.

## 4. Add Finance IQ to the jeyinsights-proxy Worker

Workers & Pages > **jeyinsights-proxy** > Edit code.

1. Paste the block from `deploy/proxy-worker/financeiq-block.js` next to the Learn AI block, before the final line that serves the rest of the site.
2. Change `FINANCEIQ_ORIGIN` in the block to your pages.dev address from step 3. Deploy.
3. Settings > Domains & Routes > Add route (zone jeyinsights.com):

| Route | Why |
|---|---|
| `jeyinsights.com/financeiq*` | Finance IQ itself |
| `jeyinsights.com/finance` | Sends the old placeholder address to Finance IQ |

Add the same with `www.` only if your Learn AI routes also have a `www.` version.

Check: https://jeyinsights.com/financeiq/ shows Finance IQ, and https://jeyinsights.com/finance moves to it.

## 5. Update the main site links

The main site linked to `/finance`. The changed files have been written into the jeyinsights repo
(copies are in `notes/jeyinsights-changes/`, not in git):

| From notes/jeyinsights-changes/ | To jeyinsights repo | Change |
|---|---|---|
| `index.html` | `index.html` | Nav, card and footer link to /financeiq/. Card chip "Coming soon" becomes "New" |
| `site.js` | `assets/site.js` | The guide's Finance IQ answer and link |
| `_redirects` | `_redirects` | `/finance` to `/financeiq/` (backup for the Worker route). Placeholder lines switched off |
| `robots.txt` | `robots.txt` (new) | Lists the main, Learn AI and Finance IQ sitemaps |
| `neet.html`, `resources.html` | same | Nav and footer links to /financeiq/ |
| `finance.html` | same | Now a small page that forwards to /financeiq/ (you can delete it instead) |

Commit and push the jeyinsights repo after step 4 works.

## 6. Check the live site

```bash
npm run check:live
```

Then in Google Search Console, add the sitemap `https://jeyinsights.com/financeiq/sitemap-index.xml`.

## Updating later

Edit, run `npm run build` (it fails on writing rule or link problems), commit and push. Cloudflare rebuilds in about a minute.
