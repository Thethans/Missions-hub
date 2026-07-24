import * as cheerio from 'cheerio';
import { BaseScraper } from './base.js';

// teamexpansion.org — plain server-rendered WordPress (AWSM Job Openings
// plugin), no Cloudflare challenge, no JS rendering needed.
const BASE = 'https://teamexpansion.org';
const LIST_URL = `${BASE}/jobopenings/`;

const TERM_MAP = {
  'full time': 'career/long-term',
  'part time': 'career/long-term',
  intern: 'short-term (under 2 years)',
  'apprenticeship (quest)': 'short-term (under 2 years)',
  'short term': 'short-term (under 2 years)',
  volunteer: 'short-term (under 2 years)'
};

export default class TeamExpansionScraper extends BaseScraper {
  constructor() {
    super('Team Expansion', BASE);
  }

  async scrape() {
    let html;
    try {
      html = await this.fetchPage(LIST_URL);
    } catch (err) {
      console.warn(`Team Expansion: list page failed — ${err.message}`);
      return { opportunities: [], pages: 0 };
    }

    const $ = cheerio.load(html);
    const opportunities = [];

    $('a.awsm-job-item').each((_, el) => {
      const $el = $(el);
      const title = this.normalizeWhitespace($el.find('.awsm-job-post-title').first().text());
      if (!title || title.length < 5) return;

      const url = $el.attr('href') || LIST_URL;
      const category = this.normalizeWhitespace(
        $el.find('.awsm-job-specification-job-category .awsm-job-specification-term').first().text()
      );
      const jobType = this.normalizeWhitespace(
        $el.find('.awsm-job-specification-job-type .awsm-job-specification-term').first().text()
      );
      const location = this.normalizeWhitespace(
        $el.find('.awsm-job-specification-job-location .awsm-job-specification-term').first().text()
      ) || null;

      opportunities.push({
        agency: this.agency,
        title,
        url,
        location,
        region: this.inferRegion(location),
        role_type: this.classifyRole(category, title),
        term_length: TERM_MAP[jobType.toLowerCase()] || null,
        description: null,
        date_posted: null,
        raw_html: null
      });
    });

    const deduped = this.dedup(opportunities);
    console.log(`Team Expansion: ${deduped.length} total`);
    return { opportunities: deduped, pages: 1 };
  }

  dedup(opps) {
    const seen = new Set();
    return opps.filter((o) => {
      const key = o.url.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  classifyRole(category, title) {
    const t = `${category} ${title}`.toLowerCase();
    if (/disciple maker|media to movement|che\b|community health evangelism/.test(t)) return 'evangelism/discipleship';
    if (/trauma medical|medical/.test(t)) return 'medical';
    if (/teach to transform|teacher|ttt/.test(t)) return 'education/TESOL';
    if (/finance|accountant/.test(t)) return 'administration';
    if (/administrative/.test(t)) return 'administration';
    if (/communications|media/.test(t)) return 'media/creative';
    if (/facilities|maintenance/.test(t)) return 'construction/maintenance';
    if (/member care/.test(t)) return 'member care';
    if (/mobilization/.test(t)) return 'mobilization';
    if (/marketplace/.test(t)) return 'business as mission';
    if (/pathways|intern/.test(t)) return 'internship';
    return null;
  }

  inferRegion(location) {
    const t = (location || '').toLowerCase();
    if (!t) return null;
    if (/central asia/.test(t)) return 'Central Asia';
    if (/east asia|taiwan/.test(t)) return 'East Asia';
    if (/south asia/.test(t)) return 'South Asia';
    if (/southeast asia/.test(t)) return 'Southeast Asia';
    if (/middle east/.test(t)) return 'Middle East / North Africa';
    if (/north africa|west africa/.test(t)) return 'Sub-Saharan Africa';
    if (/europe|budapest|france/.test(t)) return 'Europe';
    if (/north america|louisville|california|remote/.test(t)) return 'North America';
    return null;
  }
}
