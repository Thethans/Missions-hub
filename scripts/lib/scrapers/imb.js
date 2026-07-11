import * as cheerio from 'cheerio';
import { fetchRenderedHTML, paginateAndCollectHTML, sleep } from './browser.js';
import { BaseScraper } from './base.js';

const FINDER_URL = 'https://www.imb.org/opportunity-finder/';
const BASE = 'https://www.imb.org';

export default class IMBScraper extends BaseScraper {
  constructor() {
    super('International Mission Board (IMB)', BASE);
  }

  async scrape() {
    const opportunities = [];
    let totalPages = 0;

    console.log('IMB: loading opportunity-finder with Puppeteer…');
    let htmlPages;
    try {
      htmlPages = await paginateAndCollectHTML(FINDER_URL, { maxPages: 10, timeout: 45000 });
    } catch (err) {
      console.warn(`IMB: paginated fetch failed, trying single page — ${err.message}`);
      try {
        const html = await fetchRenderedHTML(FINDER_URL, { timeout: 45000 });
        htmlPages = [html];
      } catch (e2) {
        console.error(`IMB: could not load opportunity-finder — ${e2.message}`);
        return { opportunities: [], pages: 0 };
      }
    }

    for (const html of htmlPages) {
      totalPages++;
      const $ = cheerio.load(html);
      this.extractCards($, opportunities);
    }

    const fallbackUrls = [
      'https://www.imb.org/opportunities/',
      'https://www.imb.org/get-involved/',
    ];

    for (const url of fallbackUrls) {
      try {
        const html = await this.fetchPage(url);
        totalPages++;
        const $ = cheerio.load(html);
        this.extractCards($, opportunities);
      } catch (err) {
        console.warn(`IMB: skipping ${url} — ${err.message}`);
      }
    }

    const deduped = this.dedup(opportunities);
    console.log(`IMB: ${deduped.length} total (${opportunities.length - deduped.length} dupes removed)`);
    return { opportunities: deduped, pages: totalPages };
  }

  extractCards($, opportunities) {
    const skipTitles = /^(filter|home|about|contact|menu|nav|what we do|get involved|clear all|donate|give)/i;
    const seen = new Set(opportunities.map(o => o.url));

    $('article, .card, [class*="card"], [class*="opportunity"], [class*="trip"]').each((_, el) => {
      const $el = $(el);
      const $titleEl = $el.find('h2, h3, h4, [class*="title"], [class*="name"]').first();
      const title = this.normalizeWhitespace($titleEl.text());
      if (!title || title.length < 8 || title.length > 200) return;
      if (skipTitles.test(title)) return;

      const $link = $el.find('a[href]').first();
      const rawHref = $link.attr('href') || '';
      const url = rawHref.startsWith('http') ? rawHref : rawHref ? `${BASE}${rawHref}` : '';
      if (!url || seen.has(url)) return;
      if (/sendrelief\.org/.test(url)) return;
      seen.add(url);

      const description = this.normalizeWhitespace(
        $el.find('p, [class*="desc"], [class*="excerpt"], [class*="summary"]').first().text()
      ) || null;

      const location = this.normalizeWhitespace(
        $el.find('[class*="location"], [class*="region"], [class*="country"]').first().text()
      ) || null;

      opportunities.push({
        agency: this.agency,
        title,
        url,
        location,
        region: this.inferRegion(location, title, description),
        role_type: this.inferRole(title, description || ''),
        term_length: this.inferTerm(title, description || ''),
        description,
        date_posted: null,
        raw_html: $.html(el).slice(0, 2000)
      });
    });

    $('a[href*="/opportunities/"]').each((_, el) => {
      const $a = $(el);
      const href = $a.attr('href') || '';
      const url = href.startsWith('http') ? href : `${BASE}${href}`;
      if (seen.has(url) || /sendrelief/.test(url)) return;

      const title = this.normalizeWhitespace($a.text());
      if (!title || title.length < 8 || title.length > 200) return;
      if (skipTitles.test(title)) return;
      seen.add(url);

      opportunities.push({
        agency: this.agency,
        title,
        url,
        location: null,
        region: this.inferRegion(null, title, ''),
        role_type: this.inferRole(title, ''),
        term_length: this.inferTerm(title, ''),
        description: null,
        date_posted: null,
        raw_html: $.html(el)
      });
    });
  }

  dedup(opps) {
    const seen = new Set();
    return opps.filter(o => {
      const key = `${o.title.toLowerCase()}|||${(o.location || '').toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  inferRegion(location, title, desc) {
    const text = `${location || ''} ${title || ''} ${desc || ''}`.toLowerCase();
    if (/africa|tanzania|kenya|nigeria|ghana|sub.saharan/.test(text)) return 'Sub-Saharan Africa';
    if (/middle east|north africa|arab/.test(text)) return 'Middle East / North Africa';
    if (/south asia|india|pakistan|bangladesh|nepal/.test(text)) return 'South Asia';
    if (/southeast asia|philippines|indonesia|thailand|vietnam|cambodia|myanmar/.test(text)) return 'Southeast Asia';
    if (/east asia|china|japan|korea|taiwan|mongolia/.test(text)) return 'East Asia';
    if (/central asia|uzbek|kazakh|tajik|kyrgyz|turkmen/.test(text)) return 'Central Asia';
    if (/europe|germany|france|spain|uk|italy/.test(text)) return 'Europe';
    if (/latin america|south america|central america|mexico|brazil|oaxaca|americas/.test(text)) return 'Latin America';
    if (/asia.pacific/.test(text)) return 'East Asia';
    if (/deaf/.test(text)) return null;
    return null;
  }

  inferRole(title, desc) {
    const text = `${title} ${desc}`.toLowerCase();
    if (/church plant/.test(text)) return 'church planting';
    if (/medical|nurs|doctor|health/.test(text)) return 'medical';
    if (/teach|education|tesol|esl|school/.test(text)) return 'education/TESOL';
    if (/translat|linguist/.test(text)) return 'Bible translation/linguistics';
    if (/business|bam/.test(text)) return 'business as mission';
    if (/media|creative|video|photo/.test(text)) return 'media/creative';
    if (/aviation|pilot|mechanic/.test(text)) return 'aviation/logistics';
    if (/relief|development/.test(text)) return 'relief and development';
    if (/deaf|sign language/.test(text)) return 'deaf ministry';
    if (/disciple|evangel|outreach/.test(text)) return 'evangelism/discipleship';
    if (/leadership|training|equip/.test(text)) return 'training/leadership';
    if (/residency/.test(text)) return 'residency program';
    return null;
  }

  inferTerm(title, desc) {
    const text = `${title} ${desc}`.toLowerCase();
    if (/short.?term|1.?2 (month|year)|summer|intern|week|trip/.test(text)) return 'short-term (under 2 years)';
    if (/mid.?term|2.?4 year/.test(text)) return 'mid-term (2-4 years)';
    if (/career|long.?term|lifetime/.test(text)) return 'career/long-term';
    if (/residency/.test(text)) return 'short-term (under 2 years)';
    return null;
  }
}
