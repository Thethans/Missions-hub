import * as cheerio from 'cheerio';
import { BaseScraper } from './base.js';

const BASE = 'https://www.sim.org';
const LISTING_URL = `${BASE}/about/where-we-work/opportunities-to-serve/`;
const MAX_PAGES = 25;

export default class SIMScraper extends BaseScraper {
  constructor() {
    super('SIM International', BASE);
  }

  async scrape() {
    const opportunities = [];
    let totalPages = 0;

    for (let page = 1; page <= MAX_PAGES; page++) {
      const url = page === 1 ? LISTING_URL : `${LISTING_URL}page/${page}/`;
      console.log(`SIM: fetching page ${page}…`);

      let html;
      try {
        html = await this.fetchPage(url);
        totalPages++;
      } catch (err) {
        if (page === 1) throw err;
        console.log(`SIM: page ${page} error, stopping`);
        break;
      }

      const $ = cheerio.load(html);
      const before = opportunities.length;

      $('.opportunity-card').each((_, el) => {
        const $el = $(el);
        const title = this.normalizeWhitespace($el.find('h3').first().text());
        if (!title || title.length < 4) return;

        const metaText = this.normalizeWhitespace(
          $el.find('.card__top-meta-small').first().text()
        );
        const location = this.parseLocation(metaText);
        const duration = this.parseDuration(metaText);

        const description = this.normalizeWhitespace(
          $el.find('.card-text, .card__bottom p').first().text()
        ) || null;

        const linkEl = $el.find('a[href]').first();
        const href = linkEl.attr('href') || '';
        const rawUrl = this.resolveUrl(href);
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
        const oppUrl = (!rawUrl || rawUrl.includes('javascript:')) ? `${LISTING_URL}#${slug}` : rawUrl;

        opportunities.push({
          agency: this.agency,
          title,
          url: oppUrl,
          location,
          region: this.inferRegion(location || metaText || title),
          role_type: this.inferRole(title, description || ''),
          term_length: duration,
          description,
          date_posted: null,
          raw_html: $.html(el).slice(0, 2000),
        });
      });

      if (opportunities.length === before) {
        console.log(`SIM: no new cards on page ${page}, stopping`);
        break;
      }
    }

    const deduped = this.dedup(opportunities);
    console.log(`SIM: ${deduped.length} total (${opportunities.length - deduped.length} dupes removed)`);
    return { opportunities: deduped, pages: totalPages };
  }

  parseLocation(metaText) {
    if (!metaText) return null;
    const parts = metaText.split('|').map(s => s.trim());
    return parts[0] || null;
  }

  parseDuration(metaText) {
    if (!metaText) return null;
    const t = metaText.toLowerCase();
    if (/any duration|flexible/.test(t)) return null;
    if (/1-2 year|1–2 year|under 2 year|short.?term|weeks?|months?/.test(t)) return 'short-term (under 2 years)';
    if (/2\+|2-4|2–4|mid.?term/.test(t)) return 'mid-term (2-4 years)';
    if (/long.?term|career|permanent|5\+/.test(t)) return 'career/long-term';
    return null;
  }

  dedup(opps) {
    const seenTitle = new Set();
    const seenUrl = new Set();
    return opps.filter(o => {
      const titleKey = `${o.title.toLowerCase()}|||${(o.location || '').toLowerCase()}`;
      const urlKey = o.url.toLowerCase();
      if (seenTitle.has(titleKey) || seenUrl.has(urlKey)) return false;
      seenTitle.add(titleKey);
      seenUrl.add(urlKey);
      return true;
    });
  }

  inferRegion(text) {
    if (!text) return null;
    const t = text.toLowerCase();
    if (/brazil|colombia|peru|ecuador|mexico|guatemala|honduras|latin|south america|central america|chile|bolivia|paraguay|argentina/.test(t)) return 'Latin America';
    if (/uganda|togo|kenya|niger|south africa|cameroon|ghana|ethiopia|chad|mozambique|zambia|malawi|madagascar|congo|nigeria|tanzania|senegal|west africa|east africa|côte d'ivoire|ivory coast/.test(t)) return 'Sub-Saharan Africa';
    if (/middle east|jordan|lebanon|iraq|egypt|north africa|morocco|tunisia|algeria|libya/.test(t)) return 'Middle East / North Africa';
    if (/japan|china|korea|mongolia|taiwan|east asia/.test(t)) return 'East Asia';
    if (/india|nepal|bangladesh|pakistan|sri lanka|south asia/.test(t)) return 'South Asia';
    if (/thailand|philippines|cambodia|vietnam|indonesia|malaysia|myanmar|laos|singapore|southeast asia/.test(t)) return 'Southeast Asia';
    if (/europe|germany|france|spain|italy|uk|england|ireland|portugal|romania|hungary|czech|poland|austria|ukraine|balkans|albania|croatia|serbia|greece|czechia/.test(t)) return 'Europe';
    if (/australia|new zealand|papua|fiji|pacific|oceania/.test(t)) return 'Oceania / Asia-Pacific';
    if (/canada|united states|usa/.test(t)) return 'North America';
    if (/central asia|kazakhstan|uzbekistan|tajikistan|kyrgyz|turkmen/.test(t)) return 'Central Asia';
    return null;
  }

  inferRole(title, desc) {
    const text = `${title} ${desc}`.toLowerCase();
    if (/church plant/.test(text)) return 'church planting';
    if (/medical|nurse|doctor|health|clinical/.test(text)) return 'medical';
    if (/teach|education|tesol|esl|school|professor/.test(text)) return 'education/TESOL';
    if (/translat|linguist/.test(text)) return 'Bible translation/linguistics';
    if (/business|account|finance|admin/.test(text)) return 'administration';
    if (/media|creative|video|film|photo|art|music|communication/.test(text)) return 'media/creative';
    if (/aviat|pilot|maintenance/.test(text)) return 'aviation/logistics';
    if (/relief|development|community dev/.test(text)) return 'relief and development';
    if (/youth|children|camp|kid/.test(text)) return 'children/youth ministry';
    if (/mobilis|mobiliz/.test(text)) return 'mobilization';
    if (/leader/.test(text)) return 'training/leadership';
    if (/evangel|disciple|outreach|gospel|francophone/.test(text)) return 'evangelism/discipleship';
    return null;
  }
}
