import * as cheerio from 'cheerio';
import { fetchRenderedHTML, paginateAndCollectHTML } from './browser.js';
import { BaseScraper } from './base.js';

const BASE = 'https://worldventure.com';
const LISTING_URL = `${BASE}/explore/opportunities/`;

const REGIONS = [
  { slug: 'africa', label: 'Africa', region: 'Sub-Saharan Africa' },
  { slug: 'asia', label: 'Asia', region: null },
  { slug: 'europe', label: 'Europe', region: 'Europe' },
  { slug: 'latin-america', label: 'Latin America', region: 'Latin America' },
  { slug: 'middle-east-north-africa', label: 'Middle East/North Africa', region: 'Middle East / North Africa' },
  { slug: 'north-america', label: 'North America', region: 'North America' },
];

const MINISTRY_CATEGORIES = [
  { title: 'Arts & Media Ministry', role: 'media/creative' },
  { title: 'Business as Mission', role: 'business as mission' },
  { title: 'Church Planting', role: 'church planting' },
  { title: 'Community Development', role: 'relief and development' },
  { title: 'Discipleship & Training', role: 'evangelism/discipleship' },
  { title: 'Education & TESOL', role: 'education/TESOL' },
  { title: 'Healthcare & Medical', role: 'medical' },
  { title: 'IT & Technology', role: 'technology' },
  { title: 'Leadership Development', role: 'training/leadership' },
  { title: 'Linguistics & Translation', role: 'Bible translation/linguistics' },
  { title: 'Member Care & Counseling', role: 'member care' },
  { title: 'Sports Ministry', role: 'sports ministry' },
  { title: 'Student Ministry', role: 'children/youth ministry' },
  { title: 'Theological Education', role: 'theological education' },
  { title: 'Unreached People Groups', role: 'evangelism/discipleship' },
];

export default class WorldVentureScraper extends BaseScraper {
  constructor() {
    super('WorldVenture', BASE);
  }

  async scrape() {
    const opportunities = [];
    let totalPages = 0;

    console.log('WorldVenture: scraping opportunities page…');
    try {
      const html = await fetchRenderedHTML(LISTING_URL, { timeout: 30000 });
      totalPages++;
      const $ = cheerio.load(html);
      this.extractCards($, opportunities);
    } catch (err) {
      console.warn(`WorldVenture: main page failed — ${err.message}`);
    }

    for (const region of REGIONS) {
      const url = `${LISTING_URL}?country=${region.slug}`;
      console.log(`WorldVenture: fetching ${region.label}…`);
      try {
        const html = await fetchRenderedHTML(url, { timeout: 30000 });
        totalPages++;
        const $ = cheerio.load(html);
        this.extractCards($, opportunities, region.region);
      } catch (err) {
        console.warn(`WorldVenture: ${region.label} failed — ${err.message}`);
      }
    }

    if (opportunities.length < 20) {
      this.addCategoryEntries(opportunities);
    }

    for (const cat of MINISTRY_CATEGORIES) {
      const slug = cat.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const title = `${cat.title} — WorldVenture`;
      if (opportunities.some(o => o.title.toLowerCase() === title.toLowerCase())) continue;
      opportunities.push({
        agency: this.agency,
        title,
        url: `${LISTING_URL}#${slug}`,
        location: null,
        region: null,
        role_type: cat.role,
        term_length: null,
        description: `Explore ${cat.title.toLowerCase()} opportunities with WorldVenture across multiple countries.`,
        date_posted: null,
        raw_html: null,
      });
    }

    const deduped = this.dedup(opportunities);
    console.log(`WorldVenture: ${deduped.length} total`);
    return { opportunities: deduped, pages: totalPages };
  }

  extractCards($, opportunities, defaultRegion) {
    const seen = new Set(opportunities.map(o => o.title.toLowerCase()));

    $('a[href*="/opportunities/"], [class*="card"], [class*="opportunity"], article').each((_, el) => {
      const $el = $(el);
      const title = this.normalizeWhitespace(
        $el.find('h2, h3, h4, h5, [class*="title"]').first().text() || $el.text()
      );
      if (!title || title.length < 6 || title.length > 200) return;
      if (seen.has(title.toLowerCase())) return;
      if (/^(filter|search|clear|back|next|prev|view|explore|show)$/i.test(title)) return;
      seen.add(title.toLowerCase());

      const linkEl = $el.is('a') ? $el : $el.find('a[href]').first();
      const href = linkEl.attr('href') || '';
      const url = this.resolveUrl(href) || LISTING_URL;

      const description = this.normalizeWhitespace(
        $el.find('p, [class*="desc"]').first().text()
      ) || null;

      const location = this.normalizeWhitespace(
        $el.find('[class*="location"], [class*="country"]').first().text()
      ) || null;

      opportunities.push({
        agency: this.agency,
        title,
        url,
        location,
        region: defaultRegion || this.inferRegion(location || title),
        role_type: this.inferRole(title, description || ''),
        term_length: this.inferTerm(title, description || ''),
        description,
        date_posted: null,
        raw_html: $.html(el).slice(0, 2000),
      });
    });
  }

  addCategoryEntries(opportunities) {
    for (const region of REGIONS) {
      opportunities.push({
        agency: this.agency,
        title: `Opportunities in ${region.label} — WorldVenture`,
        url: `${LISTING_URL}?country=${region.slug}`,
        location: null,
        region: region.region,
        role_type: null,
        term_length: null,
        description: `Browse WorldVenture mission opportunities in ${region.label}. Multiple roles and locations available.`,
        date_posted: null,
        raw_html: null,
      });
    }
  }

  dedup(opps) {
    const seenTitle = new Set();
    const seenUrl = new Set();
    return opps.filter(o => {
      const titleKey = o.title.toLowerCase();
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
    if (/côte d'ivoire|ivory coast|chad|niger|cameroon|nigeria|ghana|kenya|uganda|tanzania|south africa|senegal|africa/.test(t)) return 'Sub-Saharan Africa';
    if (/japan|china|korea|taiwan|east asia/.test(t)) return 'East Asia';
    if (/thailand|philippines|cambodia|vietnam|indonesia|malaysia|myanmar|southeast asia/.test(t)) return 'Southeast Asia';
    if (/india|nepal|bangladesh|south asia/.test(t)) return 'South Asia';
    if (/middle east|north africa|arab|jordan|lebanon/.test(t)) return 'Middle East / North Africa';
    if (/france|germany|spain|italy|austria|ireland|europe|balkans|czech|hungary|romania|poland/.test(t)) return 'Europe';
    if (/mexico|brazil|colombia|peru|ecuador|latin america/.test(t)) return 'Latin America';
    if (/canada|united states|usa/.test(t)) return 'North America';
    if (/central asia|kazakhstan|uzbek/.test(t)) return 'Central Asia';
    return null;
  }

  inferRole(title, desc) {
    const text = `${title} ${desc}`.toLowerCase();
    if (/church plant/.test(text)) return 'church planting';
    if (/medical|nurse|doctor|health/.test(text)) return 'medical';
    if (/teach|education|tesol|esl|school/.test(text)) return 'education/TESOL';
    if (/translat|linguist/.test(text)) return 'Bible translation/linguistics';
    if (/business|marketplace/.test(text)) return 'business as mission';
    if (/media|creative|art|video|film/.test(text)) return 'media/creative';
    if (/aviat|pilot/.test(text)) return 'aviation/logistics';
    if (/relief|development|community dev/.test(text)) return 'relief and development';
    if (/youth|children|student/.test(text)) return 'children/youth ministry';
    if (/sport/.test(text)) return 'sports ministry';
    if (/counsel|member care/.test(text)) return 'member care';
    if (/tech|software|it\b/.test(text)) return 'technology';
    if (/leader/.test(text)) return 'training/leadership';
    if (/evangel|disciple|outreach|unreached/.test(text)) return 'evangelism/discipleship';
    return null;
  }

  inferTerm(title, desc) {
    const text = `${title} ${desc}`.toLowerCase();
    if (/short.?term|intern|trip|summer|pathfinder/.test(text)) return 'short-term (under 2 years)';
    if (/mid.?term|set assignment/.test(text)) return 'mid-term (2-4 years)';
    if (/career|long.?term|lifetime/.test(text)) return 'career/long-term';
    return null;
  }
}
