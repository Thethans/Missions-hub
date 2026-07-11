import { BaseScraper } from './base.js';

const LISTING_URLS = [
  'https://www.imb.org/opportunities/',
  'https://www.imb.org/get-involved/'
];

const MAX_PAGES = 20;

export default class IMBScraper extends BaseScraper {
  constructor() {
    super('International Mission Board (IMB)', 'https://www.imb.org');
  }

  async scrape() {
    const opportunities = [];
    let totalPages = 0;

    for (const listUrl of LISTING_URLS) {
      let currentUrl = listUrl;

      for (let page = 0; page < MAX_PAGES; page++) {
        let html;
        try {
          html = await this.fetchPage(currentUrl);
        } catch (err) {
          console.warn(`IMB: skipping ${currentUrl} — ${err.message}`);
          break;
        }
        totalPages++;

        const $ = this.parse$(html);

        $('article, .card, [class*="opportunity"], [class*="card"], [class*="listing"]').each((_, el) => {
          const $el = $(el);
          const title = this.normalizeWhitespace(
            $el.find('h2, h3, h4, .card-title, [class*="title"]').first().text()
          );
          if (!title || title.length < 5) return;

          const linkEl = $el.find('a[href]').first();
          const url = this.resolveUrl(linkEl.attr('href'));
          if (!url || url.includes('sendrelief.org')) return;

          const description = this.normalizeWhitespace(
            $el.find('p, .card-body, [class*="description"], [class*="excerpt"]').first().text()
          );
          const location = this.normalizeWhitespace(
            $el.find('[class*="location"], [class*="region"], [class*="country"]').first().text()
          );

          opportunities.push({
            agency: this.agency,
            title,
            url,
            location: location || null,
            region: this.inferRegion(location),
            role_type: this.inferRole(title, description),
            term_length: this.inferTerm(title, description),
            description: description || null,
            date_posted: null,
            raw_html: $.html(el)
          });
        });

        $('a[href*="/go/"], a[href*="/serve/"], a[href*="/opportunity"]').each((_, el) => {
          const $a = $(el);
          const href = this.resolveUrl($a.attr('href'));
          if (!href || opportunities.some((o) => o.url === href)) return;

          const title = this.normalizeWhitespace($a.text());
          if (!title || title.length < 5 || title.length > 150) return;

          opportunities.push({
            agency: this.agency,
            title,
            url: href,
            location: null,
            region: null,
            role_type: this.inferRole(title, ''),
            term_length: this.inferTerm(title, ''),
            description: null,
            date_posted: null,
            raw_html: $.html(el)
          });
        });

        const nextUrl = this.findNextPageUrl($, currentUrl);
        if (!nextUrl) break;
        currentUrl = nextUrl;
      }
    }

    return { opportunities, pages: totalPages };
  }

  inferRegion(location) {
    if (!location) return null;
    const l = location.toLowerCase();
    if (/africa/.test(l)) return 'Sub-Saharan Africa';
    if (/middle east|north africa/.test(l)) return 'Middle East / North Africa';
    if (/south asia|india|pakistan|bangladesh/.test(l)) return 'South Asia';
    if (/southeast asia|philippines|indonesia|thailand/.test(l)) return 'Southeast Asia';
    if (/east asia|china|japan|korea|taiwan/.test(l)) return 'East Asia';
    if (/central asia/.test(l)) return 'Central Asia';
    if (/europe/.test(l)) return 'Europe';
    if (/latin america|south america|central america/.test(l)) return 'Latin America';
    return null;
  }

  inferRole(title, desc) {
    const text = `${title} ${desc}`.toLowerCase();
    if (/church plant/.test(text)) return 'church planting';
    if (/medical|nurse|doctor|health/.test(text)) return 'medical';
    if (/teach|education|tesol|esl/.test(text)) return 'education/TESOL';
    if (/translat|linguist/.test(text)) return 'Bible translation/linguistics';
    if (/business|bam/.test(text)) return 'business as mission';
    if (/media|creative|video|photo/.test(text)) return 'media/creative';
    if (/aviation|pilot|mechanic/.test(text)) return 'aviation/logistics';
    if (/relief|development/.test(text)) return 'relief and development';
    return null;
  }

  inferTerm(title, desc) {
    const text = `${title} ${desc}`.toLowerCase();
    if (/short.?term|1.?2 (month|year)|summer|intern/.test(text)) return 'short-term (under 2 years)';
    if (/mid.?term|2.?4 year/.test(text)) return 'mid-term (2-4 years)';
    if (/career|long.?term|lifetime/.test(text)) return 'career/long-term';
    return null;
  }
}
