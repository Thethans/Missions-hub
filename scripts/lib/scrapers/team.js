import * as cheerio from 'cheerio';
import { BaseScraper } from './base.js';

const BASE = 'https://team.org';
const LISTING_URL = `${BASE}/opportunities`;

export default class TEAMScraper extends BaseScraper {
  constructor() {
    super('TEAM (The Evangelical Alliance Mission)', BASE);
  }

  async scrape() {
    const opportunities = [];
    let totalPages = 0;

    console.log('TEAM: fetching opportunities…');
    const html = await this.fetchPage(LISTING_URL);
    totalPages = 1;
    const $ = cheerio.load(html);

    $('a[href*="/mission-opportunity/"], a[href*="/opportunities/"]').each((_, el) => {
      const $el = $(el);
      const href = $el.attr('href') || '';
      if (href === '/opportunities' || href === '/opportunities/') return;

      const title = this.normalizeWhitespace(
        $el.find('h2, h3, h4, h5').first().text() || $el.text()
      );
      if (!title || title.length < 4 || title.length > 200) return;
      if (/^(view all|see all|learn more|apply|back)$/i.test(title)) return;

      const url = this.resolveUrl(href);
      const description = this.normalizeWhitespace(
        $el.find('p, [class*="desc"]').first().text()
      ) || null;

      opportunities.push({
        agency: this.agency,
        title,
        url,
        location: null,
        region: this.inferRegion(title),
        role_type: this.inferRole(title, description || ''),
        term_length: this.inferTerm(title, description || ''),
        description,
        date_posted: null,
        raw_html: $.html(el).slice(0, 2000),
      });
    });

    const subPages = [
      `${BASE}/mission-opportunity/teamtrek`,
      `${BASE}/mission-opportunity/teaching-ministries`,
    ];

    for (const subUrl of subPages) {
      try {
        console.log(`TEAM: fetching ${subUrl}…`);
        const subHtml = await this.fetchPage(subUrl);
        totalPages++;
        const $sub = cheerio.load(subHtml);

        $sub('a[href*="/mission-opportunity/"]').each((_, el) => {
          const $el = $sub(el);
          const href = $el.attr('href') || '';
          const title = this.normalizeWhitespace($el.find('h2, h3, h4').first().text() || $el.text());
          if (!title || title.length < 4) return;

          opportunities.push({
            agency: this.agency,
            title,
            url: this.resolveUrl(href),
            location: null,
            region: this.inferRegion(title),
            role_type: this.inferRole(title, ''),
            term_length: this.inferTerm(title, ''),
            description: null,
            date_posted: null,
            raw_html: null,
          });
        });
      } catch (err) {
        console.warn(`TEAM: ${subUrl} failed — ${err.message}`);
      }
    }

    const deduped = this.dedup(opportunities);
    console.log(`TEAM: ${deduped.length} total`);
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

  inferRegion(text) {
    if (!text) return null;
    const t = text.toLowerCase();
    if (/middle east/.test(t)) return 'Middle East / North Africa';
    if (/southeast asia/.test(t)) return 'Southeast Asia';
    if (/east asia/.test(t)) return 'East Asia';
    if (/austria|europe/.test(t)) return 'Europe';
    if (/mexico|rancho/.test(t)) return 'Latin America';
    if (/africa/.test(t)) return 'Sub-Saharan Africa';
    return null;
  }

  inferRole(title, desc) {
    const text = `${title} ${desc}`.toLowerCase();
    if (/church plant|evangel/.test(text)) return 'church planting';
    if (/teach|education|tesol/.test(text)) return 'education/TESOL';
    if (/medical|health/.test(text)) return 'medical';
    if (/member care/.test(text)) return 'member care';
    if (/sports/.test(text)) return 'sports ministry';
    if (/youth|children|camp|kid/.test(text)) return 'children/youth ministry';
    if (/refugee|diaspora|justice|mercy/.test(text)) return 'relief and development';
    if (/seminary|theolog|professor/.test(text)) return 'theological education';
    if (/creative art|media/.test(text)) return 'media/creative';
    if (/business|marketplace/.test(text)) return 'business as mission';
    if (/hospitality/.test(text)) return 'relief and development';
    if (/international church/.test(text)) return 'church planting';
    if (/unreached/.test(text)) return 'evangelism/discipleship';
    if (/community dev|creation care/.test(text)) return 'relief and development';
    if (/teamtrek/.test(text)) return 'short-term missions';
    if (/outreach/.test(text)) return 'evangelism/discipleship';
    if (/mobiliz/.test(text)) return 'mobilization';
    return null;
  }

  inferTerm(title, desc) {
    const text = `${title} ${desc}`.toLowerCase();
    if (/teamtrek|short.?term|trip|summer/.test(text)) return 'short-term (under 2 years)';
    if (/mid.?term/.test(text)) return 'mid-term (2-4 years)';
    if (/career|long.?term/.test(text)) return 'career/long-term';
    return null;
  }
}
