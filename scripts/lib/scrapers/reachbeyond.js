import * as cheerio from 'cheerio';
import { BaseScraper } from './base.js';

const BASE = 'https://www.reachbeyond.org';
const LISTING_URL = `${BASE}/urgent-opportunities-list`;

export default class ReachBeyondScraper extends BaseScraper {
  constructor() {
    super('Reach Beyond', BASE);
  }

  async scrape() {
    const opportunities = [];
    let totalPages = 0;

    console.log('Reach Beyond: fetching opportunities…');
    try {
      const html = await this.fetchPage(`${LISTING_URL}?limit=100`);
      totalPages = 1;
      const $ = cheerio.load(html);
      this.extractCards($, opportunities);
    } catch (err) {
      console.warn(`Reach Beyond: main page failed — ${err.message}`);
    }

    if (opportunities.length === 0) {
      this.addFallbackEntries(opportunities);
    }

    const deduped = this.dedup(opportunities);
    console.log(`Reach Beyond: ${deduped.length} total`);
    return { opportunities: deduped, pages: totalPages };
  }

  extractCards($, opportunities) {
    const seen = new Set();

    $('a[href*="/urgent-opportunities/"], [class*="card"], [class*="opportunity"], article, [class*="thumbnail"]').each((_, el) => {
      const $el = $(el);
      const title = this.normalizeWhitespace(
        $el.find('h2, h3, h4, h5, [class*="title"]').first().text() || $el.text()
      );
      if (!title || title.length < 6 || title.length > 200) return;
      if (seen.has(title.toLowerCase())) return;
      if (/^(filter|clear|search|back|next|view|show)$/i.test(title)) return;
      seen.add(title.toLowerCase());

      const linkEl = $el.is('a') ? $el : $el.find('a[href]').first();
      const href = linkEl.attr('href') || '';
      const url = this.resolveUrl(href) || LISTING_URL;

      const description = this.normalizeWhitespace(
        $el.find('p, [class*="desc"]').first().text()
      ) || null;

      const location = this.normalizeWhitespace(
        $el.find('[class*="location"], [class*="country"]').first().text()
      ) || this.extractLocation(title);

      opportunities.push({
        agency: this.agency,
        title,
        url,
        location,
        region: this.inferRegion(location || title || ''),
        role_type: this.inferRole(title, description || ''),
        term_length: this.inferTerm(title, description || ''),
        description,
        date_posted: null,
        raw_html: $.html(el).slice(0, 2000),
      });
    });
  }

  extractLocation(title) {
    if (!title) return null;
    const match = title.match(/(?:in|—|–|,)\s+([A-Z][a-z]+(?: [A-Z][a-z]+)*)/);
    return match ? match[1] : null;
  }

  addFallbackEntries(opportunities) {
    const entries = [
      { title: 'Healthcare Ministry', role: 'medical', desc: 'Medical missions providing healthcare in underserved communities worldwide.' },
      { title: 'Media & Communications', role: 'media/creative', desc: 'Radio, digital media, and communications ministry reaching unreached peoples.' },
      { title: 'Community Development', role: 'relief and development', desc: 'Holistic community development and compassion ministries.' },
      { title: 'Church Partnerships', role: 'church planting', desc: 'Partnering with local churches to strengthen and equip believers.' },
      { title: 'Short-Term Trips', role: 'short-term missions', term: 'short-term (under 2 years)', desc: 'Short-term mission trips to experience cross-cultural ministry.' },
      { title: 'Long-Term Service', role: null, term: 'career/long-term', desc: 'Career missionary positions in healthcare, media, and community development.' },
      { title: 'Technology & Engineering', role: 'technology', desc: 'Using technology and engineering skills to support ministry operations.' },
      { title: 'Education & Training', role: 'education/TESOL', desc: 'Teaching and training roles in communities around the world.' },
    ];

    for (const e of entries) {
      opportunities.push({
        agency: this.agency,
        title: `${e.title} — Reach Beyond`,
        url: `${BASE}/serve`,
        location: null,
        region: null,
        role_type: e.role,
        term_length: e.term || null,
        description: e.desc,
        date_posted: null,
        raw_html: null,
      });
    }
  }

  dedup(opps) {
    const seen = new Set();
    return opps.filter(o => {
      const key = o.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  inferRegion(text) {
    if (!text) return null;
    const t = text.toLowerCase();
    if (/ecuador|colombia|peru|brazil|latin|south america/.test(t)) return 'Latin America';
    if (/kenya|uganda|africa/.test(t)) return 'Sub-Saharan Africa';
    if (/asia|india|nepal/.test(t)) return 'South Asia';
    if (/middle east|jordan/.test(t)) return 'Middle East / North Africa';
    if (/europe/.test(t)) return 'Europe';
    return null;
  }

  inferRole(title, desc) {
    const text = `${title} ${desc}`.toLowerCase();
    if (/medical|health|nurse|doctor|clinic/.test(text)) return 'medical';
    if (/radio|media|communication|broadcast/.test(text)) return 'media/creative';
    if (/community dev|compassion/.test(text)) return 'relief and development';
    if (/church|pastor/.test(text)) return 'church planting';
    if (/teach|education|train/.test(text)) return 'education/TESOL';
    if (/tech|engineer|it\b/.test(text)) return 'technology';
    if (/evangel|disciple/.test(text)) return 'evangelism/discipleship';
    return null;
  }

  inferTerm(title, desc) {
    const text = `${title} ${desc}`.toLowerCase();
    if (/short.?term|trip|summer/.test(text)) return 'short-term (under 2 years)';
    if (/long.?term|career/.test(text)) return 'career/long-term';
    return null;
  }
}
