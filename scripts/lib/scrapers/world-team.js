import * as cheerio from 'cheerio';
import { BaseScraper } from './base.js';

const BASE = 'https://us.worldteam.org';
const LISTING_URL = `${BASE}/go/opportunities/`;

export default class WorldTeamScraper extends BaseScraper {
  constructor() {
    super('World Team', BASE);
  }

  async scrape() {
    let html;
    try {
      html = await this.fetchPage(LISTING_URL);
    } catch (err) {
      console.error(`WorldTeam: could not load ${LISTING_URL} — ${err.message}`);
      return { opportunities: [], pages: 0 };
    }

    const $ = cheerio.load(html);
    const opportunities = [];
    const seen = new Set();

    $('h3').each((_, el) => {
      const $h3 = $(el);
      const rawTitle = this.normalizeWhitespace($h3.text());
      if (!rawTitle || rawTitle.length < 4 || rawTitle.length > 200) return;
      if (/^(home|about|contact|go|give|pray|donate|filter|search|opportunities$)/i.test(rawTitle)) return;

      const $link = $h3.find('a[href*="/opportunities/"]').first();
      if (!$link.length) {
        const $parent = $h3.parent('a[href*="/opportunities/"]');
        if (!$parent.length) return;
      }
      const linkEl = $link.length ? $link : $h3.parent('a');
      const href = linkEl.attr('href') || '';
      const url = href.startsWith('http') ? href : `${BASE}${href}`;

      if (url === LISTING_URL || seen.has(url)) return;
      if (!/\/opportunities\/[a-z]/.test(url)) return;
      seen.add(url);

      const { title, location } = this.parseTitleLocation(rawTitle);

      const $card = $h3.closest('div, section, article');
      const desc = this.normalizeWhitespace($card.find('p').first().text()) || null;

      opportunities.push({
        agency: this.agency,
        title,
        url,
        location: location || null,
        region: this.inferRegion(location),
        role_type: this.inferRole(title, desc || ''),
        term_length: this.inferTerm(title, desc || '', url),
        description: desc,
        date_posted: null,
        raw_html: $.html($h3).slice(0, 2000)
      });
    });

    $('article, .card, [class*="opportunity"], [class*="card"]').each((_, el) => {
      const $el = $(el);
      const $titleEl = $el.find('h2, h3, h4, [class*="title"]').first();
      const rawTitle = this.normalizeWhitespace($titleEl.text());
      if (!rawTitle || rawTitle.length < 4) return;

      const $link = $el.find('a[href*="/opportunities/"]').first();
      const href = $link.attr('href') || '';
      const url = href.startsWith('http') ? href : href ? `${BASE}${href}` : '';
      if (!url || seen.has(url)) return;
      seen.add(url);

      const { title, location } = this.parseTitleLocation(rawTitle);
      const desc = this.normalizeWhitespace($el.find('p, [class*="desc"]').first().text()) || null;

      opportunities.push({
        agency: this.agency,
        title,
        url,
        location: location || null,
        region: this.inferRegion(location),
        role_type: this.inferRole(title, desc || ''),
        term_length: this.inferTerm(title, desc || '', url),
        description: desc,
        date_posted: null,
        raw_html: $.html(el).slice(0, 2000)
      });
    });

    console.log(`WorldTeam: ${opportunities.length} listings found`);
    return { opportunities, pages: 1 };
  }

  parseTitleLocation(raw) {
    const parts = raw.split(/\s*[-–—]\s*/);
    if (parts.length >= 2) {
      const last = parts[parts.length - 1].trim();
      if (this.isLocation(last)) {
        return { title: parts.slice(0, -1).join(' – ').trim(), location: last };
      }
    }
    const m = raw.match(/^(.+?)\s*[-–—]\s*([\w\s]+)$/);
    if (m && this.isLocation(m[2].trim())) {
      return { title: m[1].trim(), location: m[2].trim() };
    }
    return { title: raw, location: null };
  }

  isLocation(text) {
    return /^(Belgium|Brazil|Cambodia|Cameroon|Central Asia|Chad|France|Germany|Indonesia|Italy|Middle East|Moldova|Paraguay|Peru|Philippines|Senegal|South Asia|Spain|Taiwan|UK|United Kingdom|United States|USA)$/i.test(text.trim());
  }

  inferRegion(location) {
    if (!location) return null;
    const l = location.toLowerCase();
    if (/cameroon|senegal|chad|africa/.test(l)) return 'Sub-Saharan Africa';
    if (/middle east/.test(l)) return 'Middle East / North Africa';
    if (/cambodia|philippines|indonesia|south asia|taiwan/.test(l)) return 'Southeast Asia';
    if (/france|germany|belgium|italy|spain|moldova|uk|united kingdom/.test(l)) return 'Europe';
    if (/brazil|paraguay|peru/.test(l)) return 'Latin America';
    if (/usa|united states/.test(l)) return 'North America';
    if (/central asia/.test(l)) return 'Central Asia';
    return null;
  }

  inferRole(title, desc) {
    const text = `${title} ${desc}`.toLowerCase();
    if (/church plant/.test(text)) return 'church planting';
    if (/medical|nurs|doctor|health|counselor|recovery/.test(text)) return 'medical';
    if (/teach|education|tesol|esl|school|literacy/.test(text)) return 'education/TESOL';
    if (/translat|linguist/.test(text)) return 'Bible translation/linguistics';
    if (/business|bam|manager/.test(text)) return 'business as mission';
    if (/media|creative|video|photo|artist/.test(text)) return 'media/creative';
    if (/aviation|pilot|mechanic/.test(text)) return 'aviation/logistics';
    if (/relief|development|communit|agricultur|biogas/.test(text)) return 'relief and development';
    if (/disciple|evangel|outreach/.test(text)) return 'evangelism/discipleship';
    if (/intern/.test(text)) return 'internship';
    if (/admin|leadership|director/.test(text)) return 'administration';
    if (/tech|it\b|software/.test(text)) return 'technology';
    return null;
  }

  inferTerm(title, desc, url) {
    const text = `${title} ${desc}`.toLowerCase();
    if (/intern|short.?term|summer|week/.test(text)) return 'short-term (under 2 years)';
    if (/career|long.?term/.test(text)) return 'career/long-term';
    return null;
  }
}
