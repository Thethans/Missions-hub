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

function serve(port) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const url = req.url.split('?')[0];
      let filePath = join(DIST, url);

      if (!existsSync(filePath) || !extname(filePath)) {
        filePath = join(DIST, 'index.html');
      }

      try {
        const content = readFileSync(filePath);
        const ext = extname(filePath);
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(content);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    });
    server.listen(port, () => resolve(server));
  });
}

async function prerender() {
  const PORT = 4173;
  const server = await serve(PORT);
  console.log(`Serving dist/ on http://localhost:${PORT}`);

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  for (const route of ROUTES) {
    const url = `http://localhost:${PORT}${route}`;
    console.log(`  Prerendering ${route}…`);

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait for usePageMeta's useEffect to fire
    await page.waitForFunction(
      () => document.title && document.title !== 'Fielded — Get to the Field' || document.querySelector('meta[property="og:url"]')?.content !== 'https://missions-hub.vercel.app/',
      { timeout: 5000 }
    ).catch(() => {
      // Homepage keeps the default title — that's fine
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
