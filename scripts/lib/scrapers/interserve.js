import * as cheerio from 'cheerio';
import { BaseScraper } from './base.js';

const BASE = 'https://www.interserveusa.org';

const VIEWS = [
  { path: '/service-opportunities/long-term/', term: 'career/long-term' },
  { path: '/service-opportunities/short-term/', term: 'short-term (under 2 years)' }
];

const MAX_PAGES = 20; // safety cap — real page counts (11 long-term, 8 short-term) discovered from each view's own pagination links

export default class InterserveScraper extends BaseScraper {
  constructor() {
    super('Interserve', BASE);
  }

  async scrape() {
    const opportunities = [];
    let totalPages = 0;

    for (const view of VIEWS) {
      let pageCount = 1;
      for (let page = 1; page <= MAX_PAGES; page++) {
        const url = page === 1 ? `${BASE}${view.path}` : `${BASE}${view.path}page/${page}/`;
        let html;
        try {
          html = await this.fetchPage(url);
        } catch (err) {
          console.warn(`Interserve: ${url} failed — ${err.message}`);
          break;
        }
        totalPages++;

        const $ = cheerio.load(html);
        const rows = $('table.isdata_job tbody tr');
        if (rows.length === 0) break;

        rows.each((_, el) => {
          const $row = $(el);
          const $cells = $row.find('td');
          const title = this.normalizeWhitespace($cells.eq(0).text());
          const jobUrl = $cells.eq(0).find('a').attr('href') || url;
          const location = this.normalizeWhitespace($cells.eq(1).text()) || null;
          const profession = this.normalizeWhitespace($cells.eq(2).text()) || null;
          if (!title) return;

          opportunities.push({
            agency: this.agency,
            title,
            url: jobUrl,
            location,
            region: this.inferRegion(location),
            role_type: this.classifyRole(profession, title),
            term_length: view.term,
            description: null,
            date_posted: null,
            raw_html: null
          });
        });

        // Discovered page count only tells us there's more to fetch — the
        // real per-view total (11 for long-term, 8 for short-term at time
        // of writing) is read straight from the page's own pagination
        // links rather than hardcoded, so this stays correct if Interserve
        // adds or removes postings.
        if (page === 1) {
          const pageLinks = $('a[href*="/page/"]')
            .map((_, a) => {
              const m = $(a).attr('href').match(/\/page\/(\d+)\//);
              return m ? Number(m[1]) : 1;
            })
            .get();
          pageCount = pageLinks.length > 0 ? Math.max(...pageLinks) : 1;
        }
        if (page >= pageCount) break;
      }
    }

    const deduped = this.dedup(opportunities);
    console.log(`Interserve: ${deduped.length} total`);
    return { opportunities: deduped, pages: totalPages };
  }

  dedup(opps) {
    const seen = new Set();
    return opps.filter((o) => {
      const key = o.url.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  classifyRole(profession, title) {
    const t = `${profession || ''} ${title || ''}`.toLowerCase();
    if (/medical|health|doctor|nurse/.test(t)) return 'medical';
    if (/education|teach|school/.test(t)) return 'education/TESOL';
    if (/theology|church/.test(t)) return 'theological education';
    if (/administration/.test(t)) return 'administration';
    if (/agriculture|community development/.test(t)) return 'relief and development';
    if (/business/.test(t)) return 'business as mission';
    if (/engineering|skilled trades/.test(t)) return 'construction/maintenance';
    if (/information technology/.test(t)) return 'technology';
    if (/media/.test(t)) return 'media/creative';
    if (/hospitality/.test(t)) return 'member care';
    return null;
  }

  inferRegion(location) {
    const t = (location || '').toLowerCase();
    if (/arab world/.test(t)) return 'Middle East / North Africa';
    return null;
  }
}
