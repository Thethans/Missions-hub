import * as cheerio from 'cheerio';
import { BaseScraper } from './base.js';

const BASE = 'https://www.crossworld.org';
const LISTING_URL = `${BASE}/go/opportunities`;

export default class CrossworldScraper extends BaseScraper {
  constructor() {
    super('Crossworld', BASE);
  }

  async scrape() {
    const opportunities = [];
    let totalPages = 0;

    console.log('Crossworld: fetching opportunities…');
    const html = await this.fetchPage(LISTING_URL);
    totalPages = 1;
    const $ = cheerio.load(html);

    $('a.tpl-title[href*="/go/opportunity/"]').each((_, el) => {
      const $el = $(el);
      const title = this.normalizeWhitespace($el.text());
      if (!title || title.length < 4) return;

      const href = $el.attr('href') || '';
      const url = this.resolveUrl(href);

      const card = $el.closest('[class*="item"], [class*="card"], div').first();
      const description = this.normalizeWhitespace(
        card.find('p, [class*="desc"], [class*="excerpt"]').first().text()
      ) || null;

      const tags = [];
      card.find('[class*="tag"], [class*="category"], [class*="label"]').each((_, t) => {
        const text = $(t).text().trim();
        if (text && text.length > 2 && text.length < 60) tags.push(text);
      });
      const tagText = tags.join(' ');

      opportunities.push({
        agency: this.agency,
        title,
        url,
        location: this.extractLocation(title, tagText),
        region: this.inferRegion(title + ' ' + tagText),
        role_type: this.inferRole(title, tagText + ' ' + (description || '')),
        term_length: this.inferTerm(title, tagText),
        description,
        date_posted: null,
        raw_html: $.html(card.length ? card : el).slice(0, 2000),
      });
    });

    console.log(`Crossworld: ${opportunities.length} total`);
    return { opportunities, pages: totalPages };
  }

  extractLocation(title, catText) {
    const text = `${title} ${catText}`;
    const match = text.match(/in\s+((?:West|East|South|Southeast|Central)\s+(?:Asia|Africa|Europe)|France|Japan|Germany|Spain|Italy|Brazil|Mexico|Philippines|Thailand|India|Indonesia|Vietnam|Cambodia|Senegal|Balkans)/i);
    return match ? match[1] : null;
  }

  inferRegion(text) {
    if (!text) return null;
    const t = text.toLowerCase();
    if (/balkans|france|germany|spain|italy|europe/.test(t)) return 'Europe';
    if (/japan|east asia/.test(t)) return 'East Asia';
    if (/west asia|middle east/.test(t)) return 'Middle East / North Africa';
    if (/south asia|india/.test(t)) return 'South Asia';
    if (/southeast asia|philippines|thailand|cambodia|vietnam|indonesia/.test(t)) return 'Southeast Asia';
    if (/central asia/.test(t)) return 'Central Asia';
    if (/senegal|africa/.test(t)) return 'Sub-Saharan Africa';
    if (/brazil|mexico|latin america/.test(t)) return 'Latin America';
    return null;
  }

  inferRole(title, desc) {
    const text = `${title} ${desc}`.toLowerCase();
    if (/church plant|church ministry/.test(text)) return 'church planting';
    if (/teach|education|tesol|esl|school|professor|faculty|dorm|resident/.test(text)) return 'education/TESOL';
    if (/medical|nurse|doctor|health/.test(text)) return 'medical';
    if (/business|marketplace/.test(text)) return 'business as mission';
    if (/media|creative|art/.test(text)) return 'media/creative';
    if (/youth|children|student|college/.test(text)) return 'children/youth ministry';
    if (/evangel|disciple|outreach|ministry/.test(text)) return 'evangelism/discipleship';
    if (/translat|linguist/.test(text)) return 'Bible translation/linguistics';
    if (/relief|development|community/.test(text)) return 'relief and development';
    if (/global scholars|university professor/.test(text)) return 'theological education';
    return null;
  }

  inferTerm(title, catText) {
    const text = `${title} ${catText}`.toLowerCase();
    if (/short.?term|trip|summer|intern/.test(text)) return 'short-term (under 2 years)';
    if (/mid.?term/.test(text)) return 'mid-term (2-4 years)';
    if (/career|long.?term/.test(text)) return 'career/long-term';
    return null;
  }
}
