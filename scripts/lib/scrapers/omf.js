import * as cheerio from 'cheerio';
import { BaseScraper } from './base.js';

const BASE = 'https://opportunities.omf.org';

const CATEGORY_PAGES = [
  { url: `${BASE}/roles`, type: 'role' },
  { url: `${BASE}/Locations`, type: 'location' },
];

export default class OMFScraper extends BaseScraper {
  constructor() {
    super('OMF International', BASE);
  }

  async scrape() {
    const opportunities = [];
    let totalPages = 0;

    for (const { url, type } of CATEGORY_PAGES) {
      console.log(`OMF: loading ${type} page…`);
      let html;
      try {
        html = await this.fetchPage(url);
        totalPages++;
      } catch (err) {
        console.warn(`OMF: could not load ${url} — ${err.message}`);
        continue;
      }

      const $ = cheerio.load(html);
      if (type === 'role') this.extractRoles($, opportunities);
      if (type === 'location') this.extractLocations($, opportunities);
    }

    const deduped = this.dedup(opportunities);
    console.log(`OMF: ${deduped.length} total (${opportunities.length - deduped.length} dupes removed)`);
    return { opportunities: deduped, pages: totalPages };
  }

  extractRoles($, opportunities) {
    const seen = new Set();

    $('h4, h3, h2').each((_, el) => {
      const $el = $(el);
      const role = this.normalizeWhitespace($el.text());
      if (!role || role.length < 4 || role.length > 100) return;
      if (/location|opportunit|filter|search|home|menu|nav|duration|ministry|role/i.test(role) && role.length < 15) return;
      if (seen.has(role.toLowerCase())) return;
      seen.add(role.toLowerCase());

      let desc = '';
      const $parent = $el.closest('.card, article, div[class]');
      if ($parent.length) {
        desc = this.normalizeWhitespace($parent.find('p, [class*="desc"]').first().text());
      }
      if (!desc) {
        let $next = $el.next();
        while ($next.length && !$next.is('h2, h3, h4')) {
          const text = this.normalizeWhitespace($next.text());
          if (text) { desc = text; break; }
          $next = $next.next();
        }
      }

      const roleType = this.classifyRole(role);
      const slug = role.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      opportunities.push({
        agency: this.agency,
        title: `${role} — OMF East Asia`,
        url: `${BASE}/roles#${slug}`,
        location: 'East Asia',
        region: 'East Asia',
        role_type: roleType,
        term_length: null,
        description: desc || `Serve with OMF in ${role} across East Asia. Visit the OMF website for current openings.`,
        date_posted: null,
        raw_html: $.html($el)
      });
    });
  }

  extractLocations($, opportunities) {
    const seen = new Set();
    const skipWords = /^(location|opportunit|filter|search|home|menu|nav|about|contact|duration|ministry|role|learn more)/i;

    $('h4, h3, h2').each((_, el) => {
      const $el = $(el);
      const country = this.normalizeWhitespace($el.text());
      if (!country || country.length < 3 || country.length > 60) return;
      if (skipWords.test(country)) return;
      if (seen.has(country.toLowerCase())) return;
      seen.add(country.toLowerCase());

      let desc = '';
      const $parent = $el.closest('.card, article, div[class]');
      if ($parent.length) {
        desc = this.normalizeWhitespace($parent.find('p, [class*="desc"]').first().text());
      }
      if (!desc) {
        let $next = $el.next();
        while ($next.length && !$next.is('h2, h3, h4')) {
          const text = this.normalizeWhitespace($next.text());
          if (text) { desc = text; break; }
          $next = $next.next();
        }
      }

      const slug = country.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const region = this.inferRegion(country);
      if (!region) return;

      opportunities.push({
        agency: this.agency,
        title: `Serve in ${country} — OMF`,
        url: `${BASE}/Locations#${slug}`,
        location: country,
        region,
        role_type: null,
        term_length: null,
        description: desc || `OMF has opportunities to serve in ${country}. Visit the OMF website for current openings.`,
        date_posted: null,
        raw_html: $.html($el)
      });
    });
  }

  dedup(opps) {
    const seen = new Set();
    return opps.filter(o => {
      const key = `${o.title.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  classifyRole(role) {
    const r = role.toLowerCase();
    if (/admin/.test(r)) return 'administration';
    if (/bible trans|translat/.test(r)) return 'Bible translation/linguistics';
    if (/business/.test(r)) return 'business as mission';
    if (/church plant/.test(r)) return 'church planting';
    if (/community dev|creation care/.test(r)) return 'relief and development';
    if (/finance/.test(r)) return 'administration';
    if (/human resource/.test(r)) return 'administration';
    if (/media|technolog/.test(r)) return 'media/creative';
    if (/medical|health/.test(r)) return 'medical';
    if (/mobiliz/.test(r)) return 'mobilization';
    if (/disciple/.test(r)) return 'evangelism/discipleship';
    if (/evangel/.test(r)) return 'evangelism/discipleship';
    if (/prayer/.test(r)) return 'prayer';
    if (/research|ethnograph/.test(r)) return 'research';
    if (/third culture|tck/.test(r)) return 'member care';
    if (/social/.test(r)) return 'relief and development';
    if (/teach|lectur|education/.test(r)) return 'education/TESOL';
    if (/theolog/.test(r)) return 'theological education';
    if (/train/.test(r)) return 'training/leadership';
    if (/volunteer/.test(r)) return 'volunteer';
    return null;
  }

  inferRegion(location) {
    if (!location) return null;
    const l = location.toLowerCase();
    if (/japan|south korea|north korea|china|taiwan|mongolia|hong kong/.test(l)) return 'East Asia';
    if (/thailand|cambodia|philippines|indonesia|malaysia|vietnam|myanmar|singapore|laos|east timor|brunei/.test(l)) return 'Southeast Asia';
    if (/india|nepal|bangladesh|sri lanka|pakistan|bhutan/.test(l)) return 'South Asia';
    if (/australia|new zealand/.test(l)) return 'Oceania';
    if (/germany|netherlands|belgium|switzerland|united kingdom|uk/.test(l)) return 'Europe';
    if (/usa|canada|south africa/.test(l)) return 'North America';
    return null;
  }
}
