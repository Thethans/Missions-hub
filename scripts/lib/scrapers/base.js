import * as cheerio from 'cheerio';

// Node's native fetch has no default timeout — a single agency site that
// accepts the TCP connection but never responds (rather than erroring or
// refusing) hangs this call forever. Since sync-opportunities.js runs a
// worker-pool of these across 21 agencies and only resolves once every
// task settles, one hung fetch stalls the entire scrape indefinitely
// instead of just failing that one agency. Confirmed live: the first CI
// run to get past the unrelated npm-lockfile/Node-version bugs this fixed
// alongside ran for 15+ minutes with no completion before this was added.
const FETCH_TIMEOUT_MS = 20000;

export class BaseScraper {
  constructor(agencyName, baseUrl) {
    this.agency = agencyName;
    this.baseUrl = baseUrl;
  }

  async fetchPage(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let res;
    try {
      res = await fetch(url, {
        headers: {
          'User-Agent': 'FieldedBot/1.0 (missions-hub; educational project)',
          'Accept': 'text/html,application/xhtml+xml'
        },
        signal: controller.signal
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error(`${this.agency}: timed out after ${FETCH_TIMEOUT_MS}ms fetching ${url}`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) throw new Error(`${this.agency}: HTTP ${res.status} for ${url}`);
    return res.text();
  }

  parse$(html) {
    return cheerio.load(html);
  }

  resolveUrl(path) {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return new URL(path, this.baseUrl).href;
  }

  normalizeWhitespace(text) {
    return (text || '').replace(/\s+/g, ' ').trim();
  }

  findNextPageUrl($, currentUrl) {
    const next = $(
      'a[rel="next"], a.next, [class*="next"] a, [class*="pagination"] a:contains("Next"), ' +
      '[class*="pagination"] a:contains("›"), [class*="pagination"] a:contains("»"), ' +
      'a[aria-label="Next"], a[aria-label="Next page"]'
    ).first();
    if (!next.length) return null;
    const href = next.attr('href');
    if (!href || href === '#') return null;
    const resolved = this.resolveUrl(href);
    return resolved !== currentUrl ? resolved : null;
  }

  async fetchDetailDescription(url, selectors = 'main p, article p, .content p, section p, .entry-content p') {
    try {
      const html = await this.fetchPage(url);
      const $ = cheerio.load(html);
      const paragraphs = [];
      $(selectors).each((_, el) => {
        const text = this.normalizeWhitespace($(el).text());
        if (text.length > 30 && !/cookie|privacy|subscribe|sign up|newsletter/i.test(text)) {
          paragraphs.push(text);
        }
      });
      return paragraphs.slice(0, 3).join(' ').slice(0, 1000) || null;
    } catch {
      return null;
    }
  }

  async scrape() {
    throw new Error(`${this.agency}: scrape() not implemented`);
  }
}

export function dedupeOpportunities(opportunities) {
  const seen = new Set();
  return opportunities.filter((opp) => {
    const key = `${opp.agency}|||${(opp.title || '').toLowerCase()}|||${(opp.location || '').toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
