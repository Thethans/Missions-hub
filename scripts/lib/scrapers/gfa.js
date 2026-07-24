import * as cheerio from 'cheerio';
import { BaseScraper } from './base.js';

// gfamissions.org — Gospel Fellowship Association Missions, founded in 1939
// by Bob Jones Sr. Plain server-rendered ASP.NET markup, no Cloudflare
// challenge and no JS rendering needed (a plain fetch() already returns the
// full opportunity table).
const BASE = 'https://gfamissions.org';
const LIST_URL = `${BASE}/pages/find-an-opportunity/default.aspx`;

// Country-code -> region, built from the flag-icon classes actually present
// on the live page (ar/at/au/br/ca/de/fr/kh/mx/pg/ph/pr/th/tw/us/za/zm) —
// falls back to the broader continent text (which the page always supplies
// alongside the code, e.g. "KH, Asia") for any code not in this table.
const COUNTRY_REGION = {
  ar: 'Latin America', at: 'Europe', au: 'Islands / Oceania', br: 'Latin America',
  ca: 'North America', de: 'Europe', fr: 'Europe', kh: 'Southeast Asia',
  mx: 'Latin America', pg: 'Oceania / Asia-Pacific', ph: 'Southeast Asia',
  pr: 'North America', th: 'Southeast Asia', tw: 'East Asia', us: 'North America',
  za: 'Sub-Saharan Africa', zm: 'Sub-Saharan Africa'
};
const CONTINENT_REGION = {
  europe: 'Europe', 'north america': 'North America', 'south america': 'Latin America',
  africa: 'Sub-Saharan Africa'
};

export default class GFAScraper extends BaseScraper {
  constructor() {
    super('Gospel Fellowship Association Missions', BASE);
  }

  async scrape() {
    let html;
    try {
      html = await this.fetchPage(LIST_URL);
    } catch (err) {
      console.warn(`GFA: list page failed — ${err.message}`);
      return { opportunities: [], pages: 0 };
    }

    const $ = cheerio.load(html);
    const opportunities = [];

    $('a.hItem').each((_, el) => {
      const $el = $(el);
      const $cols = $el.find('.row > .column');
      if ($cols.length < 3) return;

      const title = this.normalizeWhitespace(
        $cols.eq(0).clone().children('span').remove().end().text()
      );
      if (!title || title.length < 5) return;

      const fieldText = this.normalizeWhitespace($cols.eq(1).text());
      const countryCode = ($cols.eq(1).find('.flag-icon').attr('class') || '')
        .match(/flag-icon-([a-z]+)/)?.[1];

      const href = $el.attr('href') || '';
      const baseUrl = this.resolveUrl(href) || LIST_URL;
      // A missionary with multiple current needs shares one page/href across
      // several distinct opportunities (confirmed on the live site — e.g.
      // one missionary's page backs "Church Planters Needed in Denmark",
      // "Neglected Eastern Germany", and three others). The `url` column has
      // a unique constraint, so a batch upsert with duplicate urls fails
      // outright ("ON CONFLICT DO UPDATE command cannot affect row a second
      // time") — a title-based fragment keeps every row's conflict key
      // unique while the link itself still opens the right missionary page.
      const url = `${baseUrl}#${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;

      opportunities.push({
        agency: this.agency,
        title,
        url,
        location: fieldText || null,
        region: this.inferRegion(countryCode, fieldText),
        role_type: this.classifyRole(title),
        // The "Types of Opportunities" filter (Career, Short-Term, Summer
        // Teams, SIP internships, etc.) isn't attached per-row in the
        // markup, only usable as a search filter — term length here comes
        // from the title/field text itself instead, same approach as every
        // other scraper's inferTerm.
        term_length: this.inferTerm(title, fieldText),
        description: null,
        date_posted: null,
        raw_html: null
      });
    });

    const deduped = this.dedup(opportunities);
    console.log(`GFA: ${deduped.length} total`);
    return { opportunities: deduped, pages: 1 };
  }

  dedup(opps) {
    const seen = new Set();
    return opps.filter((o) => {
      const key = `${o.title.toLowerCase()}|||${o.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  classifyRole(title) {
    const t = (title || '').toLowerCase();
    if (/church plant|bible teacher/.test(t)) return 'church planting';
    if (/internship|intern\b/.test(t)) return 'internship';
    if (/homeschool|teach/.test(t)) return 'education/TESOL';
    if (/medical/.test(t)) return 'medical';
    if (/refugee|migrant|discipl|reach\b/.test(t)) return 'evangelism/discipleship';
    if (/communications|media|graphic/.test(t)) return 'media/creative';
    if (/it\b|technology|digital/.test(t)) return 'technology';
    return null;
  }

  inferTerm(title, fieldText) {
    const t = `${title} ${fieldText}`.toLowerCase();
    if (/internship|summer team|short.?term/.test(t)) return 'short-term (under 2 years)';
    if (/church planter|team member|career/.test(t)) return 'career/long-term';
    return null;
  }

  inferRegion(countryCode, fieldText) {
    if (countryCode && COUNTRY_REGION[countryCode]) return COUNTRY_REGION[countryCode];
    const continent = (fieldText || '').split(',').pop().trim().toLowerCase();
    return CONTINENT_REGION[continent] || null;
  }
}
