import { BaseScraper } from './base.js';

const LISTING_URL = 'https://us.worldteam.org/go/opportunities/';
const MAX_PAGES = 20;

export default class WorldTeamScraper extends BaseScraper {
  constructor() {
    super('World Team', 'https://us.worldteam.org');
  }

  async scrape() {
    const opportunities = [];
    let currentUrl = LISTING_URL;
    let totalPages = 0;

    for (let page = 0; page < MAX_PAGES; page++) {
      let html;
      try {
        html = await this.fetchPage(currentUrl);
      } catch (err) {
        console.warn(`WorldTeam: skipping ${currentUrl} — ${err.message}`);
        break;
      }
      totalPages++;

      const $ = this.parse$(html);

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
        const location = this.normalizeWhitespace(
          $el.find('[class*="location"], [class*="country"]').first().text()
        );

        opportunities.push({
          agency: this.agency,
          title,
          url,
          location: location || null,
          region: null,
          role_type: null,
          term_length: null,
          description: description || null,
          date_posted: null,
          raw_html: $.html(el)
        });
      });

      const nextUrl = this.findNextPageUrl($, currentUrl);
      if (!nextUrl) break;
      currentUrl = nextUrl;
    }

    return { opportunities, pages: totalPages };
  }
}
