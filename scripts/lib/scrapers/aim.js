import { BaseScraper } from './base.js';

const LISTING_URL = 'https://us.aimint.org/serve/';
const MAX_PAGES = 20;

export default class AIMScraper extends BaseScraper {
  constructor() {
    super('Africa Inland Mission (AIM)', 'https://us.aimint.org');
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
        console.warn(`AIM: skipping ${currentUrl} — ${err.message}`);
        break;
      }
      totalPages++;

      const $ = this.parse$(html);

      $('article, .card, [class*="opportunity"], [class*="listing"], [class*="position"], [class*="card"]').each((_, el) => {
        const $el = $(el);
        const title = this.normalizeWhitespace(
          $el.find('h2, h3, h4, [class*="title"]').first().text()
        );
        if (!title) return;

        const linkEl = $el.find('a[href]').first();
        const rawUrl = this.resolveUrl(linkEl.attr('href')) || LISTING_URL;
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const url = rawUrl === LISTING_URL ? `${LISTING_URL}#${slug}` : rawUrl;

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
          region: this.inferRegion(location),
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

    const beforeCount = opportunities.length;
    const deduped = [];
    const dedupSeen = new Set();
    for (const opp of opportunities) {
      const key = `${opp.title}|||${(opp.location || '').toLowerCase()}|||${opp.agency}`;
      if (dedupSeen.has(key)) continue;
      dedupSeen.add(key);
      deduped.push(opp);
    }
    if (beforeCount !== deduped.length) {
      console.log(`AIM: removed ${beforeCount - deduped.length} internal duplicates`);
    }

    return { opportunities: deduped, pages: totalPages };
  }

  inferRegion(location) {
    if (!location) return null;
    const l = location.toLowerCase();
    if (/kenya|tanzania|uganda|congo|sudan|chad|mozambique|madagascar|south sudan|ethiopia|somalia/.test(l)) return 'Sub-Saharan Africa';
    if (/north africa|tunisia|libya|egypt/.test(l)) return 'Middle East / North Africa';
    return 'Sub-Saharan Africa';
  }
}
