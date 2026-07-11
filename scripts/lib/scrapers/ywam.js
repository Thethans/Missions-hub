import * as cheerio from 'cheerio';
import { paginateAndCollectHTML } from './browser.js';
import { BaseScraper } from './base.js';

const LISTING_URL = 'https://ywam.org/explore';

const NOISE_PATTERNS = /^(explore|get involved|who we are|frequently|pray$|donate$|for parents|blog$|for ywamers|contact|discover$|regions$|passions$|info$|endorsements|update your|privacy|cookie|ywam\.org jobs|data service|uptimerob|our story|our purpose|our blog|our leadership|our founders|our documents|know god$|make god known$)/i;

export default class YWAMScraper extends BaseScraper {
  constructor() {
    super('Youth With A Mission (YWAM)', 'https://ywam.org');
  }

  async scrape() {
    const htmlPages = await paginateAndCollectHTML(LISTING_URL);
    const opportunities = [];
    const seen = new Set();

    for (const html of htmlPages) {
      const $ = cheerio.load(html);

      const mainContent = $('main, [role="main"], .content, #content, article').first();
      const $scope = mainContent.length ? mainContent : $.root();

      $scope.find('article, .card, [class*="opportunity"], [class*="card"], [class*="program"], [class*="item"], [class*="grid"] > div').each((_, el) => {
        const $el = $(el);
        const title = this.normalizeWhitespace(
          $el.find('h2, h3, h4, [class*="title"], [class*="heading"], [class*="name"]').first().text() ||
          $el.find('a').first().text()
        );
        if (!title || title.length < 4 || title.length > 200) return;
        if (seen.has(title) || NOISE_PATTERNS.test(title)) return;
        seen.add(title);

        const linkEl = $el.is('a') ? $el : $el.find('a[href]').first();
        const href = linkEl.attr('href') || '';
        if (/privacy|cookie|update$|blog$|about-us\/(history|values|leadership|founders|documents|endorsements|for-churches)|ywam-org-jobs|ifocus|uptime/i.test(href)) return;

        const url = this.resolveUrl(href) || LISTING_URL;

        const description = this.normalizeWhitespace(
          $el.find('p, [class*="description"], [class*="excerpt"], [class*="text"]').first().text()
        );
        const location = this.normalizeWhitespace(
          $el.find('[class*="location"], [class*="country"], [class*="region"]').first().text()
        );

        opportunities.push({
          agency: this.agency,
          title,
          url,
          location: location || null,
          region: null,
          role_type: this.inferRole(title, description),
          term_length: this.inferTerm(title, description),
          description: description || null,
          date_posted: null,
          raw_html: $.html(el)
        });
      });
    }

    return { opportunities, pages: htmlPages.length };
  }

  inferRole(title, desc) {
    const text = `${title} ${desc}`.toLowerCase();
    if (/church plant/.test(text)) return 'church planting';
    if (/medical|nurse|doctor|health/.test(text)) return 'medical';
    if (/teach|education|tesol|esl|school/.test(text)) return 'education/TESOL';
    if (/translat|linguist/.test(text)) return 'Bible translation/linguistics';
    if (/business|bam/.test(text)) return 'business as mission';
    if (/media|creative|video|film|photo|art|music|worship/.test(text)) return 'media/creative';
    if (/aviat|pilot|ship|mercy/.test(text)) return 'aviation/logistics';
    if (/relief|development|justice/.test(text)) return 'relief and development';
    return null;
  }

  inferTerm(title, desc) {
    const text = `${title} ${desc}`.toLowerCase();
    if (/dts|discipleship training|short.?term|intern|summer|week|month|outreach trip/.test(text)) return 'short-term (under 2 years)';
    if (/mid.?term|2.?4 year/.test(text)) return 'mid-term (2-4 years)';
    if (/career|long.?term|staff|join staff|lifetime/.test(text)) return 'career/long-term';
    return null;
  }
}
