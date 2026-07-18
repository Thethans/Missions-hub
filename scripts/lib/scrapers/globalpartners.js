import * as cheerio from 'cheerio';
import { BaseScraper } from './base.js';
import { isPaginationArtifact } from '../sanitize.js';

const BASE = 'https://serve.globalpartnersonline.org';
const LISTING_URL = `${BASE}/opportunities`;

export default class GlobalPartnersScraper extends BaseScraper {
  constructor() {
    super('Global Partners (Wesleyan)', BASE);
  }

  async scrape() {
    const opportunities = [];
    let totalPages = 0;

    console.log('Global Partners: fetching opportunities…');
    try {
      const html = await this.fetchPage(`${LISTING_URL}?limit=100`);
      totalPages = 1;
      const $ = cheerio.load(html);
      this.extractCards($, opportunities);
    } catch (err) {
      console.warn(`Global Partners: main page failed — ${err.message}`);
    }

    if (opportunities.length < 5) {
      for (let page = 2; page <= 5; page++) {
        try {
          const html = await this.fetchPage(`${LISTING_URL}?page=${page}`);
          totalPages++;
          const $ = cheerio.load(html);
          const before = opportunities.length;
          this.extractCards($, opportunities);
          if (opportunities.length === before) break;
        } catch {
          break;
        }
      }
    }

    if (opportunities.length === 0) {
      this.addFallbackEntries(opportunities);
    }

    const deduped = this.dedup(opportunities);
    console.log(`Global Partners: ${deduped.length} total`);
    return { opportunities: deduped, pages: totalPages };
  }

  extractCards($, opportunities) {
    const seen = new Set(opportunities.map(o => o.title.toLowerCase()));

    $('a[href*="/opportunit"], [class*="card"], [class*="opportunity"], article, [class*="thumbnail"]').each((_, el) => {
      const $el = $(el);
      const title = this.normalizeWhitespace(
        $el.find('h2, h3, h4, h5, [class*="title"]').first().text() || $el.text()
      );
      if (!title || title.length < 6 || title.length > 200) return;
      if (seen.has(title.toLowerCase())) return;
      if (/^(filter|clear|search|back|next|view|show|page)$/i.test(title)) return;
      if (isPaginationArtifact(title)) return;
      seen.add(title.toLowerCase());

      const linkEl = $el.is('a') ? $el : $el.find('a[href]').first();
      const href = linkEl.attr('href') || '';
      const url = this.resolveUrl(href) || LISTING_URL;

      const description = this.normalizeWhitespace(
        $el.find('p, [class*="desc"]').first().text()
      ) || null;

      const location = this.normalizeWhitespace(
        $el.find('[class*="location"], [class*="region"], [class*="country"]').first().text()
      ) || null;

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

  addFallbackEntries(opportunities) {
    const regions = [
      { name: 'Africa', region: 'Sub-Saharan Africa' },
      { name: 'Asia-Pacific', region: 'Oceania / Asia-Pacific' },
      { name: 'Europe', region: 'Europe' },
      { name: 'Latin America', region: 'Latin America' },
    ];
    const roles = [
      { title: 'Church Planting', role: 'church planting' },
      { title: 'Theological Education', role: 'theological education' },
      { title: 'Medical Ministry', role: 'medical' },
      { title: 'Community Development', role: 'relief and development' },
      { title: 'Short-Term Missions', role: 'short-term missions', term: 'short-term (under 2 years)' },
      { title: 'Long-Term Missionaries', role: null, term: 'career/long-term' },
      { title: 'Children & Youth Ministry', role: 'children/youth ministry' },
      { title: 'Education & Training', role: 'education/TESOL' },
    ];

    for (const r of regions) {
      opportunities.push({
        agency: this.agency,
        title: `Opportunities in ${r.name} — Global Partners`,
        url: LISTING_URL,
        location: null,
        region: r.region,
        role_type: null,
        term_length: null,
        description: `Browse Global Partners mission opportunities in ${r.name}.`,
        date_posted: null,
        raw_html: null,
      });
    }

    for (const role of roles) {
      opportunities.push({
        agency: this.agency,
        title: `${role.title} — Global Partners`,
        url: LISTING_URL,
        location: null,
        region: null,
        role_type: role.role,
        term_length: role.term || null,
        description: `Explore ${role.title.toLowerCase()} with Global Partners (Wesleyan).`,
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
    if (/africa|kenya|uganda|mozambique|zambia|sierra leone|cameroon/.test(t)) return 'Sub-Saharan Africa';
    if (/japan|china|korea|east asia/.test(t)) return 'East Asia';
    if (/thailand|cambodia|philippines|indonesia|southeast asia|pacific/.test(t)) return 'Southeast Asia';
    if (/india|nepal|south asia/.test(t)) return 'South Asia';
    if (/europe|albania|croatia|czech|hungary|germany/.test(t)) return 'Europe';
    if (/latin|mexico|brazil|colombia|peru|caribbean|haiti/.test(t)) return 'Latin America';
    if (/middle east|north africa/.test(t)) return 'Middle East / North Africa';
    if (/australia|papua|guam|oceania/.test(t)) return 'Oceania / Asia-Pacific';
    return null;
  }

  inferRole(title, desc) {
    const text = `${title} ${desc}`.toLowerCase();
    if (/church plant/.test(text)) return 'church planting';
    if (/medical|health|nurse/.test(text)) return 'medical';
    if (/teach|education|tesol/.test(text)) return 'education/TESOL';
    if (/theolog|seminary/.test(text)) return 'theological education';
    if (/youth|children/.test(text)) return 'children/youth ministry';
    if (/community dev|relief/.test(text)) return 'relief and development';
    if (/evangel|disciple/.test(text)) return 'evangelism/discipleship';
    if (/admin/.test(text)) return 'administration';
    return null;
  }

  inferTerm(title, desc) {
    const text = `${title} ${desc}`.toLowerCase();
    if (/short.?term|trip|summer|intern/.test(text)) return 'short-term (under 2 years)';
    if (/long.?term|career/.test(text)) return 'career/long-term';
    return null;
  }
}
