import { BaseScraper } from './base.js';

const LISTING_URL = 'https://opportunities.omf.org/Locations/';
const MAX_PAGES = 20;

export default class OMFScraper extends BaseScraper {
  constructor() {
    super('OMF International', 'https://opportunities.omf.org');
  }

  async scrape() {
    const opportunities = [];
    const seen = new Set();
    let currentUrl = LISTING_URL;
    let totalPages = 0;

    for (let page = 0; page < MAX_PAGES; page++) {
      let html;
      try {
        html = await this.fetchPage(currentUrl);
      } catch (err) {
        console.warn(`OMF: skipping ${currentUrl} — ${err.message}`);
        break;
      }
      totalPages++;

      const $ = this.parse$(html);

      $('h2, h3, h4').each((_, el) => {
        const $el = $(el);
        const country = this.normalizeWhitespace($el.text());
        if (!country || country.length > 80 || seen.has(country)) return;
        if (/location|opportunit|filter|search|home|menu|nav/i.test(country)) return;

        seen.add(country);

        let desc = '';
        let $next = $el.next();
        while ($next.length && !$next.is('h2, h3, h4')) {
          const text = this.normalizeWhitespace($next.text());
          if (text) desc += (desc ? ' ' : '') + text;
          $next = $next.next();
        }

        const slug = country.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        opportunities.push({
          agency: this.agency,
          title: `Serve in ${country}`,
          url: `${LISTING_URL}#${slug}`,
          location: country,
          region: this.inferRegion(country),
          role_type: null,
          term_length: null,
          description: desc || `OMF has opportunities to serve in ${country}. Visit the OMF website for current openings.`,
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
      console.log(`OMF: removed ${beforeCount - deduped.length} internal duplicates`);
    }

    return { opportunities: deduped, pages: totalPages };
  }

  inferRegion(location) {
    if (!location) return null;
    const l = location.toLowerCase();
    if (/japan|south korea|north korea|china|taiwan|mongolia|hong kong/.test(l)) return 'East Asia';
    if (/thailand|cambodia|philippines|indonesia|malaysia|vietnam|myanmar|singapore|laos|east timor|brunei/.test(l)) return 'Southeast Asia';
    if (/india|nepal|bangladesh|sri lanka|pakistan|bhutan/.test(l)) return 'South Asia';
    return null;
  }
}
