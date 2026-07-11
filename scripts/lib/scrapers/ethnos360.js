import * as cheerio from 'cheerio';
import { fetchRenderedHTML, sleep } from './browser.js';
import { BaseScraper } from './base.js';

const BASE = 'https://ethnos360.org';
const FIND_URL = `${BASE}/go/find-opportunities`;
const MAX_PAGES = 15;

const SHORT_TERM_TRIPS = [
  { slug: 'wayumi', label: 'Wayumi Retreat', location: 'Pennsylvania, USA', term: 'short-term (under 2 years)', desc: 'Spend a few days on our 100-acre campus in scenic Pennsylvania exploring what the Bible says about reaching all peoples.' },
  { slug: 'encounter', label: 'Encounter Trip', location: 'Brazil, Philippines, USA', term: 'short-term (under 2 years)', desc: 'A two-week missions experience exploring long-term work among unreached groups and visiting indigenous communities.' },
  { slug: 'interface', label: 'Interface Program', location: 'Papua New Guinea & Brazil', term: 'short-term (under 2 years)', desc: 'A college-level missions course across the globe where participants learn from missionaries in field settings.' },
  { slug: 'internships', label: 'Field Support Internship', location: 'Papua New Guinea', term: 'short-term (under 2 years)', desc: 'Work alongside full-time missionaries in support ministries following the Interface experience.' },
  { slug: 'church-planting-internships', label: 'Church Planting Internship', location: 'Papua New Guinea', term: 'short-term (under 2 years)', desc: 'Semester-long opportunity for hands-on church planting insights with experienced missionaries.' },
  { slug: 'stateside-internships', label: 'Stateside Internship', location: 'USA', term: 'short-term (under 2 years)', desc: 'Support missionaries at domestic centers using your skills to help advance global missions work. 2-12 months.' },
];

export default class Ethnos360Scraper extends BaseScraper {
  constructor() {
    super('Ethnos360', BASE);
  }

  async scrape() {
    const opportunities = [];
    let totalPages = 0;

    for (let page = 1; page <= MAX_PAGES; page++) {
      const url = page === 1 ? FIND_URL : `${FIND_URL}?page=${page}`;
      console.log(`Ethnos360: loading page ${page}…`);

      let html;
      try {
        html = await fetchRenderedHTML(url, { timeout: 45000 });
        totalPages++;
      } catch (err) {
        console.warn(`Ethnos360: page ${page} failed — ${err.message}`);
        if (page === 1) break;
        continue;
      }

      const $ = cheerio.load(html);
      let foundOnPage = 0;

      $('h3').each((_, el) => {
        const $h3 = $(el);
        const title = this.normalizeWhitespace($h3.text());
        if (!title || title.length < 5 || title.length > 200) return;
        if (/^(home|about|contact|go|give|pray|search|filter)/i.test(title)) return;

        const $link = $h3.find('a[href]').first() || $h3.closest('a[href]');
        const $card = $h3.closest('div, article, section').first();
        const cardText = this.normalizeWhitespace($card.text());

        let href = '';
        if ($link.length) href = $link.attr('href') || '';
        if (!href) {
          const $parentLink = $h3.parent('a');
          if ($parentLink.length) href = $parentLink.attr('href') || '';
        }
        const detailUrl = href.startsWith('http') ? href : href ? `${BASE}${href}` : FIND_URL;

        const locMatch = cardText.match(/(?:Region|Country|Location)[:\s]*([A-Z][^,\n]+)/i);
        const location = locMatch ? this.normalizeWhitespace(locMatch[1]) : this.extractLocation(cardText);

        const typeMatch = cardText.match(/(?:Type)[:\s]*([A-Z][^,\n]+)/i);
        const roleType = typeMatch ? this.classifyRole(typeMatch[1]) : this.classifyRole(title);

        const durMatch = cardText.match(/(?:Duration)[:\s]*([^\n]+)/i);
        const termLength = durMatch ? this.normalizeTerm(durMatch[1]) : null;

        const $desc = $card.find('p').first();
        const description = this.normalizeWhitespace($desc.text()) || null;

        opportunities.push({
          agency: this.agency,
          title,
          url: detailUrl,
          location: location || null,
          region: this.inferRegion(location || cardText),
          role_type: roleType,
          term_length: termLength,
          description,
          date_posted: null,
          raw_html: $.html($card.length ? $card : $h3).slice(0, 2000)
        });
        foundOnPage++;
      });

      console.log(`Ethnos360: page ${page} → ${foundOnPage} listings`);
      if (foundOnPage === 0 && page > 1) break;
      if (page < MAX_PAGES) await sleep(2000);
    }

    for (const trip of SHORT_TERM_TRIPS) {
      opportunities.push({
        agency: this.agency,
        title: `Ethnos360 — ${trip.label}`,
        url: `${BASE}/short-term-trips/${trip.slug}`,
        location: trip.location,
        region: this.inferRegion(trip.location),
        role_type: 'short-term missions',
        term_length: trip.term,
        description: trip.desc,
        date_posted: null,
        raw_html: null
      });
    }

    const deduped = this.dedup(opportunities);
    console.log(`Ethnos360: ${deduped.length} total (${opportunities.length - deduped.length} dupes removed)`);
    return { opportunities: deduped, pages: totalPages };
  }

  extractLocation(text) {
    const countries = /\b(Papua New Guinea|United States|USA|Brazil|Philippines|Senegal|Paraguay|Canada|United Kingdom|UK)\b/i;
    const m = text.match(countries);
    return m ? m[1] : null;
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

  classifyRole(text) {
    const t = (text || '').toLowerCase();
    if (/church plant|evangel/.test(t)) return 'church planting';
    if (/translat|linguist|bible trans/.test(t)) return 'Bible translation/linguistics';
    if (/medical|nurs|doctor|health|physiotherap/.test(t)) return 'medical';
    if (/teach|education|school|teacher/.test(t)) return 'education/TESOL';
    if (/aviat|pilot|mechanic|avionics/.test(t)) return 'aviation/logistics';
    if (/media|creative|video|social media|communic/.test(t)) return 'media/creative';
    if (/business|admin|account|finance|hr|human resource/.test(t)) return 'administration';
    if (/tech|software|network|it\b|systems admin|computer/.test(t)) return 'technology';
    if (/construc|maint|electric|groundskeep/.test(t)) return 'construction/maintenance';
    if (/member care|counsel|mentor|training/.test(t)) return 'member care';
    return null;
  }

  normalizeTerm(raw) {
    if (!raw) return null;
    const t = raw.toLowerCase();
    if (/career/.test(t)) return 'career/long-term';
    if (/4 year|3 year|2 year|1.4 year|2.4 year/.test(t)) return 'mid-term (2-4 years)';
    if (/1 year|month|short|intern|semester/.test(t)) return 'short-term (under 2 years)';
    return null;
  }

  inferRegion(text) {
    if (!text) return null;
    const t = text.toLowerCase();
    if (/papua new guinea|asia.pacific|philippines/.test(t)) return 'Oceania / Asia-Pacific';
    if (/brazil|latin america|paraguay/.test(t)) return 'Latin America';
    if (/senegal|west africa|cameroon|africa/.test(t)) return 'Sub-Saharan Africa';
    if (/chad/.test(t)) return 'Sub-Saharan Africa';
    if (/united states|usa|north america|canada/.test(t)) return 'North America';
    if (/united kingdom|uk|europe/.test(t)) return 'Europe';
    return null;
  }
}
