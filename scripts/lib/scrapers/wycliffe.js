import { BaseScraper } from './base.js';

const LISTING_URL = 'https://www.wycliffe.org/serve/';

export default class WycliffeScraper extends BaseScraper {
  constructor() {
    super('Wycliffe Bible Translators', 'https://www.wycliffe.org');
  }

  async scrape() {
    const html = await this.fetchPage(LISTING_URL);
    const $ = this.parse$(html);
    const opportunities = [];

    $('article, .card, [class*="opportunity"], [class*="listing"], [class*="position"]').each((_, el) => {
      const $el = $(el);
      const title = this.normalizeWhitespace(
        $el.find('h2, h3, h4, [class*="title"]').first().text()
      );
      if (!title) return;

      const linkEl = $el.find('a[href]').first();
      const url = this.resolveUrl(linkEl.attr('href'));
      if (!url) return;

      const description = this.normalizeWhitespace(
        $el.find('p, [class*="description"], [class*="excerpt"]').first().text()
      );

      opportunities.push({
        agency: this.agency,
        title,
        url,
        location: null,
        region: null,
        role_type: 'Bible translation/linguistics',
        term_length: null,
        description: description || null,
        date_posted: null,
        raw_html: $.html(el)
      });
    });

    return opportunities;
  }
}
