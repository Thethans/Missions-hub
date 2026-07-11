import * as cheerio from 'cheerio';
import { BaseScraper } from './base.js';

const BASE = 'https://explore.aimint.org';
const LISTING_URL = `${BASE}/us/`;
const MAX_PAGES = 25;
const PER_PAGE = 9;

export default class AIMScraper extends BaseScraper {
  constructor() {
    super('Africa Inland Mission (AIM)', BASE);
  }

  async scrape() {
    const opportunities = [];
    let totalPages = 0;

    for (let page = 1; page <= MAX_PAGES; page++) {
      const url = page === 1 ? LISTING_URL : `${LISTING_URL}?_pagination=${page}`;
      let html;
      try {
        html = await this.fetchPage(url);
      } catch (err) {
        console.warn(`AIM: page ${page} failed — ${err.message}`);
        if (page === 1) break;
        continue;
      }
      totalPages++;

      const $ = cheerio.load(html);
      let foundOnPage = 0;

      $('h3').each((_, el) => {
        const $h3 = $(el);
        const $link = $h3.find('a[href]').first();
        if (!$link.length) return;

        const title = this.normalizeWhitespace($h3.text());
        if (!title || title.length < 4 || title.length > 150) return;
        if (/^(home|about|contact|menu|search|filter|nav)/i.test(title)) return;

        const rawHref = $link.attr('href');
        const detailUrl = rawHref?.startsWith('http') ? rawHref : `${BASE}${rawHref}`;

        const $card = $h3.closest('article, .card, div').first();
        const cardText = this.normalizeWhitespace($card.text());

        const termMatch = cardText.match(/\b(Full Term|Short Term)\b/i);
        const term = termMatch ? termMatch[1] : null;

        let location = null;
        const locPatterns = [
          /(?:Location:\s*)([A-Z][^|]+)/,
          /\b(Kenya|Uganda|Tanzania|Congo|Sudan|South Sudan|Chad|Mozambique|Madagascar|Ethiopia|Somalia|Niger|Namibia|Lesotho|Comoros|Sicily|Europe|USA|Islands)\b/i,
          /\b(Diaspora\s*-\s*\w+)/i,
        ];
        for (const pat of locPatterns) {
          const m = cardText.match(pat);
          if (m) { location = this.normalizeWhitespace(m[1]); break; }
        }

        const $desc = $card.find('p').first();
        const description = this.normalizeWhitespace($desc.text()) || null;

        opportunities.push({
          agency: this.agency,
          title,
          url: detailUrl,
          location: location || null,
          region: this.inferRegion(location),
          role_type: this.inferRole(title, description || ''),
          term_length: this.normalizeTerm(term),
          description,
          date_posted: null,
          raw_html: $.html($card.length ? $card : $h3)
        });
        foundOnPage++;
      });

      console.log(`AIM: page ${page} → ${foundOnPage} listings`);
      if (foundOnPage === 0 && page > 1) break;
    }

    const deduped = this.dedup(opportunities);
    console.log(`AIM: ${deduped.length} total (${opportunities.length - deduped.length} dupes removed)`);
    return { opportunities: deduped, pages: totalPages };
  }

  dedup(opps) {
    const seen = new Set();
    return opps.filter(o => {
      const key = `${o.title}|||${(o.location || '').toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  normalizeTerm(raw) {
    if (!raw) return null;
    if (/short/i.test(raw)) return 'short-term (under 2 years)';
    if (/full/i.test(raw)) return 'career/long-term';
    return null;
  }

  inferRole(title, desc) {
    const text = `${title} ${desc}`.toLowerCase();
    if (/pilot|aviation|mechanic|air\b/.test(text)) return 'aviation/logistics';
    if (/teach|school|faculty|professor|lecturer|education|tesol|esl/.test(text)) return 'education/TESOL';
    if (/medical|nurs|doctor|health|clinic/.test(text)) return 'medical';
    if (/church plant/.test(text)) return 'church planting';
    if (/translat|linguist|bible trans/.test(text)) return 'Bible translation/linguistics';
    if (/business|bam/.test(text)) return 'business as mission';
    if (/media|creative|video|photo|communic/.test(text)) return 'media/creative';
    if (/admin|director|manager|coordinator/.test(text)) return 'administration';
    if (/relief|development|community dev/.test(text)) return 'relief and development';
    if (/intern/.test(text)) return 'internship';
    if (/outreach|evangel|disciple/.test(text)) return 'evangelism/discipleship';
    return null;
  }

  inferRegion(location) {
    if (!location) return null;
    const l = location.toLowerCase();
    if (/kenya|tanzania|uganda|congo|sudan|south sudan|chad|mozambique|madagascar|ethiopia|somalia|niger|namibia|lesotho|comoros|africa/.test(l)) return 'Sub-Saharan Africa';
    if (/north africa|tunisia|libya|egypt/.test(l)) return 'Middle East / North Africa';
    if (/sicily|europe/.test(l)) return 'Europe';
    if (/usa|diaspora.*usa/.test(l)) return 'North America';
    if (/islands/.test(l)) return 'Islands / Oceania';
    return 'Sub-Saharan Africa';
  }
}
