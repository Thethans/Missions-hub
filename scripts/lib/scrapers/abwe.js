import * as cheerio from 'cheerio';
import { BaseScraper } from './base.js';

const BASE = 'https://www.abwe.org';
const LISTING_URL = `${BASE}/serve/browse-opportunities`;
const MAX_PAGES = 35;

export default class ABWEScraper extends BaseScraper {
  constructor() {
    super('ABWE', BASE);
  }

  async scrape() {
    const opportunities = [];
    let totalPages = 0;

    for (let page = 1; page <= MAX_PAGES; page++) {
      const url = page === 1 ? LISTING_URL : `${LISTING_URL}/page/${page}/`;
      console.log(`ABWE: fetching page ${page}…`);

      let html;
      try {
        html = await this.fetchPage(url);
        totalPages++;
      } catch (err) {
        if (page === 1) throw err;
        console.log(`ABWE: page ${page} returned error, stopping pagination`);
        break;
      }

      const $ = cheerio.load(html);
      const cards = $('a[href*="/serve/opportunities/"]').filter((_, el) => {
        const href = $(el).attr('href') || '';
        return href !== '/serve/opportunities/' && href !== '/serve/opportunities';
      });

      if (cards.length === 0) {
        console.log(`ABWE: no cards on page ${page}, stopping`);
        break;
      }

      cards.each((_, el) => {
        const $el = $(el);
        const href = $el.attr('href') || '';
        const url = this.resolveUrl(href);

        const title = this.normalizeWhitespace(
          $el.find('h2, h3, h4').first().text() || $el.text()
        );
        if (!title || title.length < 4) return;

        const description = this.normalizeWhitespace(
          $el.find('p').first().text()
        ) || null;

        const locationText = this.normalizeWhitespace(
          $el.find('[class*="location"], [class*="subtitle"]').first().text()
        ) || null;

        opportunities.push({
          agency: this.agency,
          title,
          url,
          location: locationText,
          region: this.inferRegion(locationText || title),
          role_type: this.inferRole(title, description || ''),
          term_length: this.inferTerm(title, description || ''),
          description,
          date_posted: null,
          raw_html: $.html(el).slice(0, 2000),
        });
      });
    }

    const deduped = this.dedup(opportunities);
    console.log(`ABWE: ${deduped.length} total (${opportunities.length - deduped.length} dupes removed)`);
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
    if (/brazil|colombia|peru|ecuador|mexico|guatemala|honduras|latin|south america|central america|caribbean/.test(t)) return 'Latin America';
    if (/uganda|togo|kenya|niger|south africa|cameroon|ghana|ethiopia|chad|mozambique|zambia|malawi|madagascar|congo|nigeria|tanzania|senegal/.test(t)) return 'Sub-Saharan Africa';
    if (/middle east|jordan|lebanon|iraq|egypt|north africa|morocco|tunisia|algeria|libya/.test(t)) return 'Middle East / North Africa';
    if (/japan|china|korea|mongolia|taiwan/.test(t)) return 'East Asia';
    if (/india|nepal|bangladesh|pakistan|sri lanka/.test(t)) return 'South Asia';
    if (/thailand|philippines|cambodia|vietnam|indonesia|malaysia|myanmar|laos|singapore/.test(t)) return 'Southeast Asia';
    if (/europe|germany|france|spain|italy|uk|england|ireland|scotland|portugal|romania|hungary|czech|poland|austria|ukraine|balkans|albania|croatia|serbia|greece/.test(t)) return 'Europe';
    if (/australia|new zealand|papua|fiji|pacific/.test(t)) return 'Oceania / Asia-Pacific';
    if (/canada|united states|usa|pennsylvania|ohio|michigan|florida|texas|california|oregon|carolina/.test(t)) return 'North America';
    if (/central asia|kazakhstan|uzbekistan|tajikistan|kyrgyz|turkmen/.test(t)) return 'Central Asia';
    return null;
  }

  inferRole(title, desc) {
    const text = `${title} ${desc}`.toLowerCase();
    if (/church plant/.test(text)) return 'church planting';
    if (/medical|nurse|doctor|health|clinical|nursing/.test(text)) return 'medical';
    if (/teach|education|tesol|esl|school|professor|faculty|tutor/.test(text)) return 'education/TESOL';
    if (/translat|linguist/.test(text)) return 'Bible translation/linguistics';
    if (/business|account|finance|admin/.test(text)) return 'administration';
    if (/media|creative|video|film|photo|art|music|communication/.test(text)) return 'media/creative';
    if (/aviat|pilot|maintenance|mechanic|grounds/.test(text)) return 'aviation/logistics';
    if (/relief|development|community dev/.test(text)) return 'relief and development';
    if (/youth|children|camp|kid/.test(text)) return 'children/youth ministry';
    if (/coach|counsel|member care/.test(text)) return 'member care';
    if (/intern/.test(text)) return 'internship';
    if (/evangel|disciple|outreach/.test(text)) return 'evangelism/discipleship';
    if (/seminary|theolog/.test(text)) return 'theological education';
    if (/technology|software|it |developer/.test(text)) return 'technology';
    return null;
  }

  inferTerm(title, desc) {
    const text = `${title} ${desc}`.toLowerCase();
    if (/short.?term|trip|week|summer|1-2 month|volunteer/.test(text)) return 'short-term (under 2 years)';
    if (/mid.?term|1-4 year|associate/.test(text)) return 'mid-term (2-4 years)';
    if (/career|long.?term|lifetime/.test(text)) return 'career/long-term';
    return null;
  }
}
