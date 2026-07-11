import * as cheerio from 'cheerio';
import { fetchRenderedHTML, paginateAndCollectHTML } from './browser.js';
import { BaseScraper } from './base.js';

const BASE = 'https://mtw.org';
const LISTING_URL = `${BASE}/opportunities`;
const MAX_PAGES = 20;

export default class MTWScraper extends BaseScraper {
  constructor() {
    super('Mission to the World (MTW)', BASE);
  }

  async scrape() {
    const opportunities = [];
    let totalPages = 0;

    console.log('MTW: scraping opportunities (JS-rendered)…');
    try {
      const htmlPages = await paginateAndCollectHTML(LISTING_URL, { maxPages: MAX_PAGES });
      for (const html of htmlPages) {
        totalPages++;
        this.extractCards(cheerio.load(html), opportunities);
      }
    } catch (err) {
      console.warn(`MTW: pagination failed — ${err.message}`);
      try {
        const html = await fetchRenderedHTML(LISTING_URL, { timeout: 30000 });
        totalPages = 1;
        this.extractCards(cheerio.load(html), opportunities);
      } catch (fallbackErr) {
        console.warn(`MTW: fallback failed — ${fallbackErr.message}`);
      }
    }

    if (opportunities.length === 0) {
      this.addFallbackEntries(opportunities);
    }

    const deduped = this.dedup(opportunities);
    console.log(`MTW: ${deduped.length} total (${opportunities.length - deduped.length} dupes removed)`);
    return { opportunities: deduped, pages: totalPages };
  }

  extractCards($, opportunities) {
    const seen = new Set(opportunities.map(o => o.title.toLowerCase()));

    $('a[href*="opportunity"], [class*="card"], [class*="opportunity"]').each((_, el) => {
      const $el = $(el);
      const title = this.normalizeWhitespace(
        $el.find('h2, h3, h4, h5, [class*="title"]').first().text() || $el.text()
      );
      if (!title || title.length < 6 || title.length > 200) return;
      if (seen.has(title.toLowerCase())) return;
      if (/^(filters?|search|sort|page|next|prev|all|grid|list|map)$/i.test(title)) return;
      seen.add(title.toLowerCase());

      const linkEl = $el.is('a') ? $el : $el.find('a[href]').first();
      const href = linkEl.attr('href') || '';
      const url = this.resolveUrl(href) || LISTING_URL;

      const fullText = this.normalizeWhitespace($el.text());
      const location = this.extractLocation($el, fullText);
      const term = this.extractTerm(fullText);

      const description = this.normalizeWhitespace(
        $el.find('p, [class*="desc"]').first().text()
      ) || null;

      opportunities.push({
        agency: this.agency,
        title,
        url,
        location,
        region: this.inferRegion(location || title || ''),
        role_type: this.inferRole(title, description || ''),
        term_length: term,
        description,
        date_posted: null,
        raw_html: $.html(el).slice(0, 2000),
      });
    });
  }

  extractLocation($el, text) {
    const loc = this.normalizeWhitespace(
      $el.find('[class*="location"], [class*="country"], [class*="region"]').first().text()
    );
    if (loc && loc.length > 2) return loc;

    const match = text.match(/(?:in|—|–)\s+([A-Z][a-z]+(?: [A-Z][a-z]+)*)/);
    return match ? match[1] : null;
  }

  extractTerm(text) {
    if (!text) return null;
    const t = text.toLowerCase();
    if (/1[–-]11 months?|short.?term|summer|week/.test(t)) return 'short-term (under 2 years)';
    if (/longer|long.?term|career|2\+ year/.test(t)) return 'career/long-term';
    if (/mid.?term|1-2 year/.test(t)) return 'mid-term (2-4 years)';
    return null;
  }

  addFallbackEntries(opportunities) {
    const entries = [
      { title: 'Church Planting Opportunities', path: '/opportunities', role: 'church planting' },
      { title: 'Short-Term Mission Trips', path: '/go/trips', role: 'short-term missions', term: 'short-term (under 2 years)' },
      { title: 'Internships', path: '/go/internships', role: 'internship', term: 'short-term (under 2 years)' },
      { title: 'Long-Term Missionaries', path: '/go/missionaries', role: null, term: 'career/long-term' },
      { title: 'Teaching Opportunities', path: '/opportunities', role: 'education/TESOL' },
      { title: 'Medical Missions', path: '/opportunities', role: 'medical' },
    ];

    for (const e of entries) {
      opportunities.push({
        agency: this.agency,
        title: `${e.title} — MTW`,
        url: `${BASE}${e.path}`,
        location: null,
        region: null,
        role_type: e.role,
        term_length: e.term || null,
        description: `Explore ${e.title.toLowerCase()} with Mission to the World (PCA). Visit mtw.org for current openings.`,
        date_posted: null,
        raw_html: null,
      });
    }
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
    if (/scotland|spain|germany|france|italy|uk|england|ireland|portugal|romania|hungary|czech|poland|austria|ukraine|balkans|albania|croatia|serbia|greece|stuttgart|europe/.test(t)) return 'Europe';
    if (/japan|china|korea|mongolia|taiwan|east asia|nagoya/.test(t)) return 'East Asia';
    if (/middle east|jordan|lebanon|iraq|egypt|asian crescent/.test(t)) return 'Middle East / North Africa';
    if (/india|nepal|bangladesh|pakistan|sri lanka|south asia/.test(t)) return 'South Asia';
    if (/philippines|thailand|cambodia|vietnam|indonesia|malaysia|myanmar|mindoro|southeast asia/.test(t)) return 'Southeast Asia';
    if (/ethiopia|kenya|uganda|south africa|africa/.test(t)) return 'Sub-Saharan Africa';
    if (/mexico|brazil|colombia|peru|latin|south america|central america/.test(t)) return 'Latin America';
    if (/australia|new zealand|pacific/.test(t)) return 'Oceania / Asia-Pacific';
    return null;
  }

  inferRole(title, desc) {
    const text = `${title} ${desc}`.toLowerCase();
    if (/church plant|revitalize/.test(text)) return 'church planting';
    if (/medical|nurse|doctor|health/.test(text)) return 'medical';
    if (/teach|education|tesol|esl|school|professor/.test(text)) return 'education/TESOL';
    if (/pastoral|pastor|ministry training|mentor/.test(text)) return 'training/leadership';
    if (/art|creative|media/.test(text)) return 'media/creative';
    if (/intern/.test(text)) return 'internship';
    if (/youth|children/.test(text)) return 'children/youth ministry';
    if (/evangel|outreach/.test(text)) return 'evangelism/discipleship';
    return null;
  }
}
