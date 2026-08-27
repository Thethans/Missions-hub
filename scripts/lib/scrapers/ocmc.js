import { BaseScraper } from './base.js';

const BASE = 'https://ocmc.org';
const LISTING_URL = `${BASE}/missionary-opportunities/`;

// Orthodox Christian Mission Center — the flagship US-based Orthodox
// missionary-sending agency (an official agency of the Assembly of Canonical
// Orthodox Bishops), filling a real gap: every other scraper in this
// directory sends Protestant/evangelical agencies, none Orthodox. Their
// long-term missionary-opportunities page is a real, clean, individually-
// linked card grid (title/country/detail-page-per-role), not a hand-curated
// situation like reachingandteaching.js or frontiers.js needed — verified
// live 2026-08-24: 27 real open roles, each its own URL.
//
// Deliberately not scraping /mission-team-opportunities/ — that page lists
// specific-dated short-term trips (e.g. "Oct 16-25, 2026") rather than
// standing roles, which would go stale within months and isn't the kind of
// listing sanitize.js's stale_flag/merged_titles machinery was built around.
export default class OCMCScraper extends BaseScraper {
  constructor() {
    super('Orthodox Christian Mission Center (OCMC)', BASE);
  }

  async scrape() {
    const html = await this.fetchPage(LISTING_URL);
    const $ = this.parse$(html);
    const opportunities = [];

    const cards = $('.open-missionary-card').toArray();
    for (const card of cards) {
      const $card = $(card);
      const title = this.normalizeWhitespace($card.find('.missionary-title').text());
      const location = this.normalizeWhitespace($card.find('.missionary-country').text()) || null;
      const rawHref = $card.find('a.learn-more-button').attr('href') || $card.find('a[href]').first().attr('href');
      const url = this.resolveUrl(rawHref);
      if (!title || !url) continue;

      const description = await this.fetchOcmcDescription(url);

      opportunities.push({
        agency: this.agency,
        title,
        url,
        location,
        region: this.inferOcmcRegion(location),
        role_type: this.inferRole(title),
        term_length: 'career/long-term',
        description,
        date_posted: null,
        raw_html: $.html(card)
      });
    }

    console.log(`OCMC: ${opportunities.length} total`);
    return { opportunities, pages: 1 };
  }

  // Divi page-builder markup has no semantic content container (see
  // ethnos360.js/frontiers.js-style comments elsewhere in this directory for
  // the same "the template fights automation" problem) — the real
  // description sits in the same generic .et_pb_text_inner class as nav and
  // footer boilerplate. Take the first block long enough to be real prose
  // and not matching known chrome text, same defensive spirit as
  // BaseScraper.fetchDetailDescription but with OCMC's own template's actual
  // false positives (nav link lists, address/EIN footer) filtered instead of
  // the generic cookie/privacy list.
  async fetchOcmcDescription(url) {
    try {
      const html = await this.fetchPage(url);
      const $ = this.parse$(html);
      const blocks = $('.et_pb_text_inner')
        .map((_, el) => this.normalizeWhitespace($(el).text()))
        .get();
      const real = blocks.find(
        (text) =>
          text.length > 60 &&
          !/meet our missionaries|privacy policy|cfc number|^address:|download materials|terms.*conditions|501\(c\)\(3\)/i.test(text)
      );
      return real ? real.slice(0, 1000) : null;
    } catch {
      return null;
    }
  }

  inferRole(title) {
    const t = title.toLowerCase();
    if (/health|medical|nurs|doctor|clinic/.test(t)) return 'medical';
    if (/teach|tutor|school|catechist trainer/.test(t)) return 'education/TESOL';
    if (/priest|catechist|religious education/.test(t)) return 'church planting';
    if (/music/.test(t)) return 'media/creative';
    if (/social work|caretaker|orphanage|youth/.test(t)) return 'relief and development';
    if (/agricult|groundskeep|engineer|computer|it\b/.test(t)) return 'administration';
    if (/legal|administrative/.test(t)) return 'administration';
    return null;
  }

  inferOcmcRegion(location) {
    if (!location) return null;
    const l = location.toLowerCase();
    if (/congo|kenya|ghana|rwanda|tanzania|uganda/.test(l)) return 'Sub-Saharan Africa';
    if (/fiji|tonga|new zealand/.test(l)) return 'Islands / Oceania';
    if (/mexico/.test(l)) return 'Latin America';
    return null;
  }
}
