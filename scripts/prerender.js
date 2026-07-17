#!/usr/bin/env node

// Post-build prerender: serves dist/, visits each route with Puppeteer,
// and saves the fully-rendered HTML so crawlers/social bots see real
// per-page <title>, meta description, and OG tags without executing JS.
//
// Invoked as Vercel's buildCommand (see vercel.json: "npm run build:prerender").
// This relies on Vercel's routing order — static filesystem matches (e.g.
// dist/map/index.html for a request to /map) are served BEFORE the SPA
// catch-all `rewrites` rule runs, so real visitors/crawlers hitting a route
// directly get this prerendered HTML, while in-app client-side navigation
// (React Router) is completely unaffected either way. If a route is ever
// added to src/App.jsx, add it to ROUTES below too, or it silently falls
// back to the generic index.html <title>/meta for direct hits and crawlers.

import { createServer } from 'http';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DIST = join(__dirname, '..', 'dist');

const ROUTES = [
  '/',
  '/map',
  '/prayer-map',
  '/quiz',
  '/opportunities',
  '/checklist',
  '/about',
  '/terms',
  '/privacy',
];

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.webp': 'image/webp',
};

// The pristine, un-prerendered index.html (as vite build emitted it) — read
// once before any route is captured. The '/' route's own capture overwrites
// dist/index.html on disk with its already-injected __PRELOADED_DATA__
// script; every other route's page.goto() falls back to that same file for
// its extensionless path, so serving straight off disk would boot each
// subsequent route from '/'s leftover preload data instead of a clean
// slate. Keeping the original content in memory for the fallback case
// keeps every route's capture independent, matching how Vercel actually
// serves this in production (each route gets its own prerendered file, not
// another route's).
const pristineIndexHtml = readFileSync(join(DIST, 'index.html'));

function serve(port) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const url = req.url.split('?')[0];
      let filePath = join(DIST, url);
      let useFallback = !existsSync(filePath) || !extname(filePath);

      try {
        const content = useFallback ? pristineIndexHtml : readFileSync(filePath);
        const ext = useFallback ? '.html' : extname(filePath);
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(content);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    });
    // Bind explicitly to 127.0.0.1 rather than the default wildcard: some
    // containerized CI runners (this is what was actually causing every
    // "Navigation timeout" below) don't wire up IPv6 loopback, and Chrome
    // resolving "localhost" tries ::1 first — it hangs there instead of
    // falling back quickly, eating the whole 30s navigation timeout with
    // no other error. Talking IPv4 directly sidesteps the resolution.
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function prerender() {
  const PORT = 4173;
  const HOST = '127.0.0.1';
  const server = await serve(PORT);
  console.log(`Serving dist/ on http://${HOST}:${PORT}`);
  const debugExecPath = await puppeteer.executablePath();
  console.log('DEBUG puppeteer executablePath:', debugExecPath, 'exists:', existsSync(debugExecPath));

  // Vercel's build container has no downloadable Chrome for stock puppeteer
  // to find (see @sparticuz/chromium, a build compiled for serverless/CI
  // environments). Locally, the full puppeteer package already has its own
  // bundled Chrome, which is simpler for day-to-day dev.
  const browser = process.env.VERCEL
    ? await puppeteerCore.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: 'shell'
      })
    : await puppeteer.launch({
        headless: true,
        dumpio: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage']
      });
  const page = await browser.newPage();

  for (const route of ROUTES) {
    const url = `http://${HOST}:${PORT}${route}`;
    console.log(`  Prerendering ${route}…`);

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait for usePageMeta's useEffect to fire
    await page.waitForFunction(
      () => document.title && document.title !== 'Fielded — Get to the Field' || document.querySelector('meta[property="og:url"]')?.content !== 'https://missions-hub.vercel.app/',
      { timeout: 5000 }
    ).catch(() => {
      // Homepage keeps the default title — that's fine
    });

    // Embed whatever public data the page accumulated in window.__PRELOADED__
    // (see src/utils/preloadedData.js) so a real visitor's first hydration
    // render — which happens before any fetch effect resolves — already
    // matches this snapshot instead of racing it.
    //
    // Also reset any element flagged data-hydration-reset: third-party
    // libraries (MapLibre, cobe) attach real DOM children/attributes to
    // these containers imperatively, well after React's own render. Those
    // additions are meaningless as static markup (a WebGL canvas has no
    // useful serialized form) and would otherwise show up in this capture
    // as extra nodes React's own first render never produces, which is a
    // structural hydration mismatch, not a data one — resetting them keeps
    // the snapshot matching React's pre-effect output, same as an untouched
    // container coming from a fresh mount.
    await page.evaluate(() => {
      const script = document.createElement('script');
      script.id = '__PRELOADED_DATA__';
      script.type = 'application/json';
      script.textContent = JSON.stringify(window.__PRELOADED__ || {});
      document.body.appendChild(script);

      // Value is a space-separated list of what to strip: "children",
      // "class", "style", or any other attribute name (e.g. "width").
      // Elements only need "class"/"style" stripped when that particular
      // attribute is applied imperatively by the third-party library and
      // never appears in this element's own JSX — stripping an attribute
      // React's own render DOES set would just create a new mismatch.
      document.querySelectorAll('[data-hydration-reset]').forEach((el) => {
        const parts = (el.getAttribute('data-hydration-reset') || '').split(/\s+/).filter(Boolean);
        for (const part of parts) {
          if (part === 'children') el.replaceChildren();
          else el.removeAttribute(part);
        }
      });
    });

    const html = await page.content();

    const outDir = route === '/'
      ? DIST
      : join(DIST, ...route.split('/').filter(Boolean));

    if (!existsSync(outDir)) {
      mkdirSync(outDir, { recursive: true });
    }

    writeFileSync(join(outDir, 'index.html'), html);
  }

  await browser.close();
  server.close();
  console.log(`Prerendered ${ROUTES.length} routes.`);
}

prerender().catch((err) => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
