import { BaseScraper } from './base.js';

const BASE = 'https://wgm.org';
// The paginated /opportunities view returns 12 at a time across 13 pages,
// but the site's own "show all" link (?show=all) returns the full list in
// one request — verified live 2026-08-24: 156 real listings, same markup.
const LISTING_URL = `${BASE}/opportunities?show=all`;

export default class WGMScraper extends BaseScraper {
  constructor() {
    super('World Gospel Mission', BASE);
  }

  async scrape() {
    const html = await this.fetchPage(LISTING_URL);
    const $ = this.parse$(html);
    const opportunities = [];

    $('.tpl-title-holder').each((_, el) => {
      const $link = $(el).find('a.tpl-title');
      const rawTitle = this.normalizeWhitespace($link.text());
      const url = this.resolveUrl($link.attr('href'));
      if (!rawTitle || !url) return;

      // Titles are consistently "Country/Region: Role" (e.g. "Kenya: Family
      // Medicine (Tenwek)") — a real, stated field, not inferred from free
      // text, so split on the first colon rather than pattern-matching.
      const colonIdx = rawTitle.indexOf(':');
      const location = colonIdx > 0 ? rawTitle.slice(0, colonIdx).trim() : null;
      const title = colonIdx > 0 ? rawTitle.slice(colonIdx + 1).trim() : rawTitle;

      const description =
        this.normalizeWhitespace($(el).closest('.tpl-details').find('.tpl-summary').text()) || null;

      opportunities.push({
        agency: this.agency,
        title,
        url,
        location,
        region: this.inferRegion(location),
        role_type: this.inferRole(title, description || ''),
        term_length: /team|camp/i.test(title) ? 'short-term (under 2 years)' : null,
        description,
        date_posted: null,
        raw_html: $.html($(el).closest('.tpl-architect-summary'))
      });
    });

    console.log(`World Gospel Mission: ${opportunities.length} total`);
    return { opportunities, pages: 1 };
  }

  inferRegion(location) {
    if (!location) return null;
    const l = location.toLowerCase();
    if (/middle east/.test(l)) return 'Middle East / North Africa';
    if (/india|south korea|korea/.test(l)) return 'South Asia';
    if (/honduras|bolivia|paraguay|mexico|latin america/.test(l)) return 'Latin America';
    if (/uganda|kenya|africa/.test(l)) return 'Sub-Saharan Africa';
    if (/albania|europe/.test(l)) return 'Europe';
    return null;
  }

  inferRole(title, desc) {
    const t = `${title} ${desc}`.toLowerCase();
    if (/medical|medicine|clinic|nurs|doctor|health/.test(t)) return 'medical';
    if (/teach|professor|school|education|tesol|esl/.test(t)) return 'education/TESOL';
    if (/agricult/.test(t)) return 'relief and development';
    if (/business as mission|bam\b/.test(t)) return 'business as mission';
    if (/coach|camp|team\b/.test(t)) return 'short-term missions';
    if (/hospitality|client relation|coordinator|manager|admin/.test(t)) return 'administration';
    if (/church plant|discipl|evangel/.test(t)) return 'evangelism/discipleship';
    return null;
  }
}
