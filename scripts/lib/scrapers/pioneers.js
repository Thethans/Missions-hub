import * as cheerio from 'cheerio';
import { fetchRenderedHTML, sleep } from './browser.js';
import { BaseScraper } from './base.js';

const LISTING_URLS = [
  'https://pioneers.org/go/edge',
  'https://pioneers.org/go/long-term',
  'https://pioneers.org/go/internships',
  'https://pioneers.org/go/venture',
  'https://pioneers.org/go/encore',
  'https://pioneers.org/go/switchboard'
];

export default class PioneersScraper extends BaseScraper {
  constructor() {
    super('Pioneers', 'https://pioneers.org');
  }

  async scrape() {
    const opportunities = [];
    let totalPages = 0;

    for (let i = 0; i < LISTING_URLS.length; i++) {
      const url = LISTING_URLS[i];
      const category = url.split('/go/')[1] || '';

      if (i > 0) await sleep(2000 + Math.random() * 2000);

      let html;
      try {
        html = await fetchRenderedHTML(url, { waitFor: 'networkidle2', timeout: 40000 });
        totalPages++;
      } catch (err) {
        console.warn(`Pioneers: skipping ${url} — ${err.message}`);
        opportunities.push({
          agency: this.agency,
          title: `Pioneers — ${this.formatCategory(category)}`,
          url,
          location: null,
          region: null,
          role_type: null,
          term_length: this.inferTerm(category),
          description: `Explore ${this.formatCategory(category)} opportunities with Pioneers.`,
          date_posted: null,
          raw_html: null
        });
        continue;
      }

      const pageOpps = this.extractFromPage(html, url, category);
      opportunities.push(...pageOpps);
    }

    return { opportunities, pages: totalPages };
  }

  extractFromPage(html, sourceUrl, category) {
    const $ = cheerio.load(html);
    const results = [];
    const seen = new Set();

    $('article, .card, [class*="opportunity"], [class*="listing"], [class*="card"], [class*="grid"] > div').each((_, el) => {
      const $el = $(el);
      const title = this.normalizeWhitespace(
        $el.find('h2, h3, h4, .title, [class*="title"]').first().text()
      );
      if (!title || title.length < 4 || seen.has(title)) return;
      seen.add(title);

      const linkEl = $el.find('a[href]').first();
      const url = this.resolveUrl(linkEl.attr('href')) || sourceUrl;

      const description = this.normalizeWhitespace(
        $el.find('p, .excerpt, [class*="description"], [class*="summary"]').first().text()
      );
      const location = this.normalizeWhitespace(
        $el.find('[class*="location"], [class*="region"]').first().text()
      );

      results.push({
        agency: this.agency,
        title,
        url,
        location: location || null,
        region: null,
        role_type: null,
        term_length: this.inferTerm(category),
        description: description || null,
        date_posted: null,
        raw_html: $.html(el)
      });
    });

    if (results.length === 0) {
      const desc = this.normalizeWhitespace($('main p, .content p, article p').first().text());
      results.push({
        agency: this.agency,
        title: `Pioneers — ${this.formatCategory(category)}`,
        url: sourceUrl,
        location: null,
        region: null,
        role_type: null,
        term_length: this.inferTerm(category),
        description: desc || `Explore ${this.formatCategory(category)} opportunities with Pioneers.`,
        date_posted: null,
        raw_html: null
      });
    }

    return results;
  }

  formatCategory(slug) {
    const labels = {
      edge: 'Edge (1-2 year)',
      'long-term': 'Long-Term',
      internships: 'Internships',
      venture: 'Venture (short-term teams)',
      encore: 'Encore (50+)',
      switchboard: 'Switchboard (creative access)'
    };
    return labels[slug] || slug;
  }

  inferTerm(category) {
    if (/intern|venture|edge/.test(category)) return 'short-term (under 2 years)';
    if (/long-term|encore|switchboard/.test(category)) return 'career/long-term';
    return null;
  }
}
