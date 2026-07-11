import * as cheerio from 'cheerio';
import { paginateAndCollectHTML } from './browser.js';
import { BaseScraper } from './base.js';

const LISTING_URL = 'https://ethnos360.org/go';

export default class Ethnos360Scraper extends BaseScraper {
  constructor() {
    super('Ethnos360', 'https://ethnos360.org');
  }

  async scrape() {
    const htmlPages = await paginateAndCollectHTML(LISTING_URL);
    const opportunities = [];
    const seen = new Set();

    for (const html of htmlPages) {
      const $ = cheerio.load(html);

      $('article, .card, [class*="opportunity"], [class*="listing"], [class*="card"], [class*="grid"] > div, [class*="pathway"], section a').each((_, el) => {
        const $el = $(el);
        const title = this.normalizeWhitespace(
          $el.find('h2, h3, h4, [class*="title"], [class*="heading"]').first().text() ||
          $el.find('a').first().text()
        );
        if (!title || title.length < 4 || title.length > 200) return;
        if (seen.has(title)) return;
        seen.add(title);

        const linkEl = $el.is('a') ? $el : $el.find('a[href]').first();
        const url = this.resolveUrl(linkEl.attr('href')) || LISTING_URL;

        const description = this.normalizeWhitespace(
          $el.find('p, [class*="description"], [class*="excerpt"], [class*="text"]').first().text()
        );
        const location = this.normalizeWhitespace(
          $el.find('[class*="location"], [class*="country"]').first().text()
        );

        opportunities.push({
          agency: this.agency,
          title,
          url,
          location: location || null,
          region: null,
          role_type: this.inferRole(title, description),
          term_length: this.inferTerm(title, description),
          description: description || null,
          date_posted: null,
          raw_html: $.html(el)
        });
      });
    }

    return { opportunities, pages: htmlPages.length };
  }

  inferRole(title, desc) {
    const text = `${title} ${desc}`.toLowerCase();
    if (/church plant/.test(text)) return 'church planting';
    if (/translat|linguist/.test(text)) return 'Bible translation/linguistics';
    if (/medical|nurse|doctor|health/.test(text)) return 'medical';
    if (/teach|education|tesol/.test(text)) return 'education/TESOL';
    if (/aviat|pilot|mechanic/.test(text)) return 'aviation/logistics';
    if (/media|creative/.test(text)) return 'media/creative';
    return null;
  }

  inferTerm(title, desc) {
    const text = `${title} ${desc}`.toLowerCase();
    if (/short.?term|intern|summer/.test(text)) return 'short-term (under 2 years)';
    if (/mid.?term/.test(text)) return 'mid-term (2-4 years)';
    if (/career|long.?term|lifetime/.test(text)) return 'career/long-term';
    return null;
  }
}
