import * as cheerio from 'cheerio';
import { fetchRenderedHTML } from './browser.js';
import { BaseScraper } from './base.js';

// bmm.org sits behind a Cloudflare bot challenge (plain fetch() gets a 403),
// and the opportunity tiles themselves only appear after client-side JS
// runs — needs the same headless-render approach as the other
// BROWSER_SCRAPERS.
const BASE = 'https://www.bmm.org';
const LIST_URL = `${BASE}/serve/opportunities/`;

// Bootstrap/layout classes shared by every tile — stripping these off each
// card's class list leaves exactly [opportunityType, ...ministrySlugs,
// countrySlug], confirmed against the live markup (e.g. "opp-card-link
// col-12 col-sm-6 col-md-4 ministry-opportunity-tile internships
// church-planting brazil").
const STRIP_CLASSES = new Set(['opp-card-link', 'ministry-opportunity-tile', 'col-12', 'col-sm-6', 'col-md-4']);
const TERM_MAP = {
  internships: 'short-term (under 2 years)',
  'short-term': 'short-term (under 2 years)',
  'mission-trips': 'short-term (under 2 years)',
  'long-term': 'career/long-term'
};

export default class BaptistMidMissionsScraper extends BaseScraper {
  constructor() {
    super('Baptist Mid-Missions', BASE);
  }

  async scrape() {
    let html;
    try {
      html = await fetchRenderedHTML(LIST_URL, { timeout: 30000 });
    } catch (err) {
      console.warn(`Baptist Mid-Missions: list page failed — ${err.message}`);
      return { opportunities: [], pages: 0 };
    }

    const $ = cheerio.load(html);
    const opportunities = [];

    $('.ministry-opportunity-tile').each((_, el) => {
      const $el = $(el);
      const title = this.normalizeWhitespace($el.find('h3').first().text());
      if (!title || title.length < 5) return;

      const tokens = ($el.attr('class') || '')
        .trim()
        .split(/\s+/)
        .filter((c) => c && !STRIP_CLASSES.has(c));
      const opportunityType = tokens[0] || null;
      const countrySlug = tokens[tokens.length - 1] || null;
      const ministrySlugs = tokens.slice(1, -1);

      const location = countrySlug
        ? countrySlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : null;

      // The card's own numeric id (e.g. "opportunity-id-294877") is a real,
      // stable, unique anchor into the one shared listing page — there's no
      // distinct per-item URL since "Learn More" opens an in-page modal
      // rather than navigating anywhere (confirmed in the live markup).
      const cardId = $el.attr('id') || '';
      const url = cardId ? `${LIST_URL}#${cardId}` : LIST_URL;

      // The modal with the fuller description is a sibling element
      // elsewhere in the DOM, linked only via the "Learn More" button's
      // data-target, not by any shared id with the card itself.
      const modalTarget = $el.find('[data-toggle="modal"]').first().attr('data-target');
      const description = modalTarget
        ? this.normalizeWhitespace($(`${modalTarget} .opportunity-description`).first().text()) || null
        : null;

      opportunities.push({
        agency: this.agency,
        title,
        url,
        location,
        region: this.inferRegion(location),
        role_type: this.classifyRole(ministrySlugs.join(' '), `${title} ${description || ''}`),
        term_length: TERM_MAP[opportunityType] || null,
        description,
        date_posted: null,
        raw_html: null
      });
    });

    const deduped = this.dedup(opportunities);
    console.log(`Baptist Mid-Missions: ${deduped.length} total`);
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

  classifyRole(slugText, freeText) {
    const t = `${slugText} ${freeText}`.toLowerCase();
    if (/church.?plant/.test(t)) return 'church planting';
    if (/bible.?translat/.test(t)) return 'Bible translation/linguistics';
    if (/teaching.?esl|tesol|english/.test(t)) return 'education/TESOL';
    if (/camp.?ministry/.test(t)) return 'children/youth ministry';
    if (/medical|health|nurse|doctor/.test(t)) return 'medical';
    if (/administrat|finance|accounting/.test(t)) return 'administration';
    if (/aviation|pilot/.test(t)) return 'aviation/logistics';
    if (/construction|maintenance|building/.test(t)) return 'construction/maintenance';
    if (/media|graphic|video/.test(t)) return 'media/creative';
    if (/relief|development/.test(t)) return 'relief and development';
    if (/group.?trip|mission.?trip/.test(t)) return 'short-term missions';
    return null;
  }

  inferRegion(location) {
    const t = (location || '').toLowerCase();
    if (!t) return null;
    if (/brazil|ecuador|honduras|peru|latin/.test(t)) return 'Latin America';
    if (/germany|spain|netherlands|romania|europe/.test(t)) return 'Europe';
    if (/ghana|africa/.test(t)) return 'Sub-Saharan Africa';
    if (/japan|thailand|cambodia|asia/.test(t)) return 'Southeast Asia';
    if (/united states|new zealand/.test(t)) return null;
    return null;
  }
}
