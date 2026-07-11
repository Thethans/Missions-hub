import * as cheerio from 'cheerio';
import { fetchRenderedHTML, sleep } from './browser.js';
import { BaseScraper } from './base.js';

const BASE = 'https://pioneers.org';

const PROGRAM_PAGES = [
  { url: `${BASE}/go/edge`, category: 'edge', label: 'Edge (1-2 year)', term: 'short-term (under 2 years)' },
  { url: `${BASE}/go/long-term`, category: 'long-term', label: 'Long-Term', term: 'career/long-term' },
  { url: `${BASE}/go/internships`, category: 'internships', label: 'Internships', term: 'short-term (under 2 years)' },
  { url: `${BASE}/go/venture`, category: 'venture', label: 'Venture (short-term teams)', term: 'short-term (under 2 years)' },
  { url: `${BASE}/go/encore`, category: 'encore', label: 'Encore (50+)', term: 'career/long-term' },
  { url: `${BASE}/go/switchboard`, category: 'switchboard', label: 'Switchboard (creative access)', term: 'career/long-term' },
];

export default class PioneersScraper extends BaseScraper {
  constructor() {
    super('Pioneers', BASE);
  }

  async scrape() {
    const opportunities = [];
    let totalPages = 0;

    for (let i = 0; i < PROGRAM_PAGES.length; i++) {
      const { url, category, label, term } = PROGRAM_PAGES[i];
      if (i > 0) await sleep(3000 + Math.random() * 2000);

      console.log(`Pioneers: loading ${label}…`);
      let html;
      try {
        html = await fetchRenderedHTML(url, { waitFor: 'networkidle2', timeout: 45000 });
        totalPages++;
      } catch (err) {
        console.warn(`Pioneers: skipping ${label} — ${err.message}`);
        opportunities.push(this.fallbackEntry(url, label, term));
        continue;
      }

      const $ = cheerio.load(html);

      if (this.isErrorPage($)) {
        console.warn(`Pioneers: ${label} returned error page`);
        opportunities.push(this.fallbackEntry(url, label, term));
        continue;
      }

      const pageOpps = this.extractFromPage($, url, label, term);
      if (pageOpps.length === 0) {
        console.warn(`Pioneers: no listings found on ${label}, using fallback`);
        opportunities.push(this.fallbackEntry(url, label, term));
      } else {
        opportunities.push(...pageOpps);
      }
    }

    const mainPage = await this.scrapeMainGo();
    if (mainPage) {
      totalPages++;
      opportunities.push(...mainPage);
    }

    const deduped = this.dedup(opportunities);
    console.log(`Pioneers: ${deduped.length} total (${opportunities.length - deduped.length} dupes removed)`);
    return { opportunities: deduped, pages: totalPages };
  }

  async scrapeMainGo() {
    try {
      const html = await fetchRenderedHTML(`${BASE}/go`, { timeout: 45000 });
      const $ = cheerio.load(html);
      if (this.isErrorPage($)) return null;

      const results = [];
      $('a[href*="/go/"]').each((_, el) => {
        const $a = $(el);
        const href = $a.attr('href') || '';
        const text = this.normalizeWhitespace($a.text());
        if (!text || text.length < 5 || text.length > 100) return;
        if (/^(home|about|contact|menu|nav|go|learn)/i.test(text)) return;

        const url = href.startsWith('http') ? href : `${BASE}${href}`;
        if (results.some(r => r.url === url)) return;

        const $parent = $a.closest('div, section, article');
        const desc = this.normalizeWhitespace($parent.find('p').first().text()) || null;

        results.push({
          agency: this.agency,
          title: `Pioneers — ${text}`,
          url,
          location: null,
          region: null,
          role_type: null,
          term_length: null,
          description: desc,
          date_posted: null,
          raw_html: $.html($a)
        });
      });
      return results;
    } catch {
      return null;
    }
  }

  isErrorPage($) {
    const body = $('body').text().toLowerCase();
    return /cloudflare|error 1|error 5|access denied|ray id/.test(body);
  }

  extractFromPage($, sourceUrl, label, term) {
    const results = [];
    const seen = new Set();

    $('article, .card, [class*="card"], [class*="opportunity"], [class*="listing"], [class*="grid"] > div').each((_, el) => {
      const $el = $(el);
      const title = this.normalizeWhitespace(
        $el.find('h2, h3, h4, .title, [class*="title"]').first().text()
      );
      if (!title || title.length < 4 || title.length > 150 || seen.has(title.toLowerCase())) return;
      if (/^(home|about|contact|menu|subscribe|sign up)/i.test(title)) return;
      seen.add(title.toLowerCase());

      const linkEl = $el.find('a[href]').first();
      const rawHref = linkEl.attr('href') || '';
      const url = rawHref.startsWith('http') ? rawHref : rawHref ? `${BASE}${rawHref}` : sourceUrl;

      const description = this.normalizeWhitespace(
        $el.find('p, .excerpt, [class*="description"], [class*="summary"]').first().text()
      ) || null;

      const location = this.normalizeWhitespace(
        $el.find('[class*="location"], [class*="region"]').first().text()
      ) || null;

      results.push({
        agency: this.agency,
        title,
        url,
        location,
        region: null,
        role_type: this.inferRole(title, description || ''),
        term_length: term,
        description,
        date_posted: null,
        raw_html: $.html(el).slice(0, 2000)
      });
    });

    if (results.length === 0) {
      const mainDesc = this.normalizeWhitespace($('main p, .content p, article p, section p').first().text());
      if (mainDesc && mainDesc.length > 20) {
        results.push({
          agency: this.agency,
          title: `Pioneers — ${label}`,
          url: sourceUrl,
          location: null,
          region: null,
          role_type: null,
          term_length: term,
          description: mainDesc,
          date_posted: null,
          raw_html: null
        });
      }
    }

    return results;
  }

  fallbackEntry(url, label, term) {
    return {
      agency: this.agency,
      title: `Pioneers — ${label}`,
      url,
      location: null,
      region: null,
      role_type: null,
      term_length: term,
      description: `Explore ${label} opportunities with Pioneers. Visit pioneers.org for current openings.`,
      date_posted: null,
      raw_html: null
    };
  }

  dedup(opps) {
    const seen = new Set();
    return opps.filter(o => {
      const key = `${o.title.toLowerCase()}|||${(o.location || '').toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  inferRole(title, desc) {
    const text = `${title} ${desc}`.toLowerCase();
    if (/church plant/.test(text)) return 'church planting';
    if (/medical|nurs|doctor|health/.test(text)) return 'medical';
    if (/teach|education|tesol|esl/.test(text)) return 'education/TESOL';
    if (/translat|linguist/.test(text)) return 'Bible translation/linguistics';
    if (/business|bam/.test(text)) return 'business as mission';
    if (/media|creative/.test(text)) return 'media/creative';
    if (/aviation|pilot/.test(text)) return 'aviation/logistics';
    if (/relief|development/.test(text)) return 'relief and development';
    return null;
  }
}
