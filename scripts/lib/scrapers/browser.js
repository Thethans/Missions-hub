import puppeteer from 'puppeteer';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

let _browser = null;

export async function getBrowser() {
  if (!_browser) {
    _browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
  }
  return _browser;
}

export async function closeBrowser() {
  if (_browser) {
    await _browser.close();
    _browser = null;
  }
}

export async function fetchRenderedHTML(url, { waitFor = 'networkidle2', timeout = 30000, delay = 0 } = {}) {
  if (delay > 0) await sleep(delay);
  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.setUserAgent(UA);
  await page.setViewport({ width: 1280, height: 900 });
  try {
    await page.goto(url, { waitUntil: waitFor, timeout });
    await sleep(2000);
    return await page.content();
  } finally {
    await page.close();
  }
}

const LOAD_MORE_SELECTORS = [
  'button[class*="load-more"]', 'a[class*="load-more"]',
  'button[class*="loadmore"]', 'a[class*="loadmore"]',
  'button:has-text("Load More")', 'button:has-text("Load more")',
  'button:has-text("Show More")', 'button:has-text("Show more")',
  'button:has-text("View More")', 'button:has-text("View more")',
  '[class*="load-more"]', '[data-action*="load-more"]'
];

const NEXT_PAGE_SELECTORS = [
  'a[rel="next"]', 'a.next', '[class*="next"] a',
  'a[aria-label="Next"]', 'a[aria-label="Next page"]',
  '[class*="pagination"] a:last-child'
];

export async function paginateAndCollectHTML(url, { maxPages = 20, waitFor = 'networkidle2', timeout = 30000 } = {}) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.setUserAgent(UA);
  await page.setViewport({ width: 1280, height: 900 });

  const htmlPages = [];

  try {
    await page.goto(url, { waitUntil: waitFor, timeout });
    await sleep(2000);
    htmlPages.push(await page.content());

    for (let i = 1; i < maxPages; i++) {
      const advanced = await tryLoadMore(page) || await tryNextPage(page);
      if (!advanced) break;
      await sleep(2000);
      htmlPages.push(await page.content());
    }
  } finally {
    await page.close();
  }

  return htmlPages;
}

async function tryLoadMore(page) {
  for (const sel of LOAD_MORE_SELECTORS) {
    try {
      // :has-text is not real CSS — handle those with XPath
      if (sel.includes(':has-text(')) {
        const textMatch = sel.match(/:has-text\("(.+?)"\)/);
        if (!textMatch) continue;
        const text = textMatch[0].slice(11, -2);
        const tag = sel.split(':')[0] || '*';
        const [btn] = await page.$x(`//${tag}[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), "${text.toLowerCase()}")]`);
        if (btn && await btn.isIntersectingViewport()) {
          await btn.click();
          await page.waitForNetworkIdle({ idleTime: 1000, timeout: 8000 }).catch(() => {});
          return true;
        }
        continue;
      }
      const btn = await page.$(sel);
      if (btn && await btn.isIntersectingViewport()) {
        await btn.click();
        await page.waitForNetworkIdle({ idleTime: 1000, timeout: 8000 }).catch(() => {});
        return true;
      }
    } catch {
      continue;
    }
  }
  return false;
}

async function tryNextPage(page) {
  for (const sel of NEXT_PAGE_SELECTORS) {
    try {
      const link = await page.$(sel);
      if (!link) continue;
      const href = await link.evaluate((el) => el.href);
      if (!href || href === '#' || href === page.url()) continue;
      await link.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
      return true;
    } catch {
      continue;
    }
  }
  return false;
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export { UA };
