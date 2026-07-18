import * as cheerio from 'cheerio';
import { BaseScraper } from './base.js';

const BASE = 'https://www.interserveusa.org';
const LISTING_URL = `${BASE}/service-opportunities/`;
const MAX_PAGES = 20;

// Interserve's own "Profession" column is a controlled taxonomy — mapped
// straight to the app's role_type vocabulary instead of re-inferring from
// the title, since the source category is more reliable than a keyword
// guess. Only mapped where a confident match exists; anything else (e.g.
// "Hospitality", "Skilled Trades") stays null rather than force-fit.
const PROFESSION_TO_ROLE = {
  'administration': 'administration',
  'business': 'business as mission',
  'community development': 'relief and development',
  'education': 'education/TESOL',
  'information technology': 'technology',
  'media': 'media/creative',
  'medical / health': 'medical',
  'theology / church': 'theological education'
};

// Same reasoning as PROFESSION_TO_ROLE: Interserve's own "Location" column
// only distinguishes "Arab World" / "Asia" / "Other" — "Asia" alone is too
// coarse to safely pick one of the app's East/South/Southeast Asia buckets,
// so only the unambiguous case is mapped.
const LOCATION_TO_REGION = {
  'arab world': 'Middle East / North Africa'
};

// First duration listed is taken as representative when a role lists
// several (e.g. "1-11 months, 12-23 months, 2+ years" all mean "we're
// flexible") — same lossy-single-value tradeoff other scrapers already
// make for term_length.
const DURATION_TO_TERM = {
  '1-11 months': 'short-term (under 2 years)',
  '12-23 months': 'short-term (under 2 years)',
  '2+ years': 'career/long-term'
};

export default class InterserveScraper extends BaseScraper {
  constructor() {
    super('Interserve', BASE);
  }

  async scrape() {
    const opportunities = [];
    const seenUrls = new Set();
    let totalPages = 0;

    // Past the real last page, Interserve's pager doesn't 404 or go empty —
    // it silently wraps around and re-serves page 1's rows forever. A fixed
    // MAX_PAGES would either cut off real listings (if too low) or fetch
    // endless repeats (if too high, since the site has no fixed page count
    // as new roles are added/removed). Stopping the first time a page adds
    // zero URLs we haven't already seen catches the wraparound regardless
    // of how many real pages exist on any given day.
    for (let page = 1; page <= MAX_PAGES; page++) {
      const url = page === 1 ? LISTING_URL : `${LISTING_URL}page/${page}/`;
      console.log(`Interserve: fetching page ${page}…`);

      let html;
      try {
        html = await this.fetchPage(url);
        totalPages++;
      } catch (err) {
        if (page === 1) throw err;
        console.log(`Interserve: page ${page} returned error, stopping pagination`);
        break;
      }

      const $ = cheerio.load(html);
      const rows = $('.isdata_job tbody tr');
      if (rows.length === 0) {
        console.log(`Interserve: no rows on page ${page}, stopping`);
        break;
      }

      const rowUrls = rows.map((_, el) => {
        const href = $(el).find('td').eq(0).find('a').first().attr('href') || '';
        return this.resolveUrl(href) || '';
      }).get();
      const newUrlCount = rowUrls.filter((u) => u && !seenUrls.has(u)).length;
      if (page > 1 && newUrlCount === 0) {
        console.log(`Interserve: page ${page} had no new listings (pager wrapped around), stopping`);
        break;
      }
      rowUrls.forEach((u) => u && seenUrls.add(u));

      rows.each((_, el) => {
        const cells = $(el).find('td');
        const titleLink = cells.eq(0).find('a').first();
        const title = this.normalizeWhitespace(titleLink.text());
        if (!title || title.length < 4) return;

        const href = titleLink.attr('href') || '';
        const url = this.resolveUrl(href) || LISTING_URL;

        const locationText = this.normalizeWhitespace(cells.eq(1).text());
        const professionText = this.normalizeWhitespace(cells.eq(2).text()).toLowerCase();
        const firstDuration = this.normalizeWhitespace(
          cells.eq(3).find('a').first().text()
        ).toLowerCase();

        opportunities.push({
          agency: this.agency,
          title,
          url,
          location: locationText || null,
          region: LOCATION_TO_REGION[locationText.toLowerCase()] || null,
          role_type: PROFESSION_TO_ROLE[professionText] || null,
          term_length: DURATION_TO_TERM[firstDuration] || null,
          description: null,
          date_posted: null,
          raw_html: $.html(el).slice(0, 2000),
        });
      });
    }

    const deduped = this.dedup(opportunities);
    console.log(`Interserve: ${deduped.length} total`);
    return { opportunities: deduped, pages: totalPages };
  }

  dedup(opps) {
    const seen = new Set();
    return opps.filter(o => {
      const key = o.url.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
