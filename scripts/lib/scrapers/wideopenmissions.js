import { BaseScraper } from './base.js';

const BASE = 'https://wideopenmissions.org';
const LISTING_URL = `${BASE}/opportunities`;
const MAX_PAGES = 15;

// Wide Open Missions is Assemblies of God World Missions' own official
// placement service (its site literally states this) — AGWM itself has no
// opportunities page of its own on agwm.org, despite already being a real
// entry in agencies.json for the quiz, so this fills a genuine gap rather
// than duplicating an existing scraper. Real, clean, individually-linked
// listings — verified live 2026-08-24, 15 per page with working pagination.
export default class WideOpenMissionsScraper extends BaseScraper {
  constructor() {
    super('Assemblies of God World Missions (AGWM)', BASE);
  }

  async scrape() {
    const opportunities = [];
    let pages = 0;

    for (let page = 1; page <= MAX_PAGES; page++) {
      const url = page === 1 ? LISTING_URL : `${LISTING_URL}?page=${page}`;
      let html;
      try {
        html = await this.fetchPage(url);
      } catch (err) {
        if (page === 1) console.warn(`Wide Open Missions: page 1 failed — ${err.message}`);
        break;
      }
      pages++;

      const $ = this.parse$(html);
      const cards = $('article.opportunity').toArray();
      if (cards.length === 0) break;

      for (const card of cards) {
        const $card = $(card);
        const title = this.normalizeWhitespace($card.find('.opportunity-title').text());
        const url = this.resolveUrl($card.find('a.opportunity-link').attr('href'));
        if (!title || !url) continue;

        // .opportunity-details holds two columns: the sending org/team name
        // (h4) and one-or-more term-length badges (h5, e.g. "Missionary
        // Associate (1-2 years)" / "Career (3+ years)" when a role is open
        // to either commitment).
        const orgName = this.normalizeWhitespace($card.find('.opportunity-details h4').first().text());
        const termLabels = $card
          .find('.opportunity-details h5')
          .map((_, el) => this.normalizeWhitespace($(el).text()))
          .get();
        const { location, region } = this.inferWomLocation(orgName);

        opportunities.push({
          agency: this.agency,
          title,
          url,
          location,
          region,
          role_type: this.inferRole(title),
          term_length: this.inferTerm(termLabels),
          description: orgName && orgName !== title ? orgName : null,
          date_posted: null,
          raw_html: $.html(card)
        });
      }

      if (cards.length < 15) break; // short of a full page — last one
    }

    console.log(`Wide Open Missions: ${opportunities.length} total`);
    return { opportunities, pages };
  }

  // This field is inconsistent across cards: sometimes "Country, Region"
  // (e.g. "Netherlands, Europe"), sometimes "Team, Ministry-type" (e.g.
  // "Network211, International Ministries") with no real place name at
  // all. Only trust it as a location when the trailing token is one of the
  // site's own actual region labels — otherwise leave both null rather than
  // mislabeling an org/ministry name as a place.
  inferWomLocation(orgName) {
    if (!orgName) return { location: null, region: null };
    const parts = orgName.split(',').map((s) => s.trim());
    if (parts.length < 2) return { location: null, region: null };
    const trailing = parts[parts.length - 1];
    const region = this.matchRegion(trailing);
    if (!region) return { location: null, region: null };
    return { location: parts[parts.length - 2] || null, region };
  }

  matchRegion(label) {
    const l = label.toLowerCase();
    if (/^europe$/.test(l)) return 'Europe';
    if (/^asia pacific$/.test(l)) return 'Southeast Asia';
    if (/^eurasia$/.test(l)) return 'Central Asia';
    if (/^africa$/.test(l)) return 'Sub-Saharan Africa';
    if (/^latin america$/.test(l)) return 'Latin America';
    if (/^middle east/.test(l)) return 'Middle East / North Africa';
    return null;
  }

  inferRole(title) {
    const t = title.toLowerCase();
    if (/church plant|campus pastor|international church/.test(t)) return 'church planting';
    if (/medical|health|nurs|doctor|clinic/.test(t)) return 'medical';
    if (/teach|tesol|esl|school/.test(t)) return 'education/TESOL';
    if (/writer|content|video|media|design|photograph/.test(t)) return 'media/creative';
    if (/business|marketplace|bam\b/.test(t)) return 'business as mission';
    if (/director|administrat|bookkeep|analytics|coordinator/.test(t)) return 'administration';
    if (/prayer|vision trip/.test(t)) return 'short-term missions';
    return null;
  }

  inferTerm(termLabels) {
    if (!termLabels.length) return null;
    const text = termLabels.join(' ').toLowerCase();
    const hasCareer = /career/.test(text);
    const hasAssociate = /associate|1-2 years/.test(text);
    if (hasCareer && hasAssociate) return null; // open to either — don't overclaim one
    if (hasCareer) return 'career/long-term';
    if (hasAssociate) return 'short-term (under 2 years)';
    return null;
  }
}
