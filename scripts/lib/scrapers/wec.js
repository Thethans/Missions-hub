import * as cheerio from 'cheerio';
import { BaseScraper } from './base.js';

// WEC International's US site (wec-usa.org) has no listings of its own — it
// explicitly sends visitors to WEC UK's opportunity search ("This will take
// you to our WEC UK website where you can do a search," confirmed on
// wec-usa.org/serve/) — so wec-uk.org is the real, structured source, not a
// scraper-discovery workaround. agencyName stays "WEC International" to
// match src/data/agencies.json; only the scrape source differs, same as
// ReachGlobal (EFCA) scraping serves.efca.org rather than efca.org.
const BASE = 'https://wec-uk.org';
const LIST_URL = `${BASE}/mission-resources/opportunities`;

export default class WECScraper extends BaseScraper {
  constructor() {
    super('WEC International', BASE);
  }

  async scrape() {
    const opportunities = [];
    let html;
    try {
      html = await this.fetchPage(LIST_URL);
    } catch (err) {
      console.warn(`WEC: list page failed — ${err.message}`);
      return { opportunities: [], pages: 0 };
    }

    const $ = cheerio.load(html);
    const items = [];
    $('.opportunities--list-item').each((_, el) => {
      const $el = $(el);
      const $link = $el.find('a.opportunities--link').first();
      const title = this.normalizeWhitespace($link.text());
      const href = $link.attr('href') || '';
      if (!title || title.length < 5) return;

      const url = this.resolveUrl(href) || LIST_URL;
      const description = this.normalizeWhitespace($el.find('.opportunities--meta p').first().text()) || null;

      items.push({ title, url, description });
    });

    // Commitment length and location only live on each position's own detail
    // page (not in the list-page markup) — fetched concurrently, same
    // pattern as ethnos360.js/christar.js's fetchDetailDescription usage.
    const detailResults = await Promise.all(
      items.map(async (item) => {
        try {
          const detailHtml = await this.fetchPage(item.url);
          return { url: item.url, ...this.parseDetail(detailHtml) };
        } catch {
          return { url: item.url, commitment: null, location: null };
        }
      })
    );
    const detailMap = new Map(detailResults.map((r) => [r.url, r]));

    for (const item of items) {
      const detail = detailMap.get(item.url) || {};
      opportunities.push({
        agency: this.agency,
        title: item.title,
        url: item.url,
        location: detail.location || null,
        region: this.inferRegion(detail.location || item.title),
        role_type: this.classifyRole(`${item.title} ${item.description || ''}`),
        term_length: this.normalizeTerm(detail.commitment),
        description: item.description,
        date_posted: null,
        raw_html: null
      });
    }

    const deduped = this.dedup(opportunities);
    console.log(`WEC: ${deduped.length} total`);
    return { opportunities: deduped, pages: 1 };
  }

  parseDetail(html) {
    const $ = cheerio.load(html);
    const text = $('.opportunities--position-meta').text();
    const commitmentMatch = text.match(/Commitment Type\s*([^\n]+)/i);
    const locationMatch = text.match(/Location\s*([^\n]+?)\s*(?:Show on a map|$)/i);
    return {
      commitment: commitmentMatch ? this.normalizeWhitespace(commitmentMatch[1]) : null,
      location: locationMatch ? this.normalizeWhitespace(locationMatch[1]) : null
    };
  }

  dedup(opps) {
    const seen = new Set();
    return opps.filter((o) => {
      const key = o.url.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  classifyRole(text) {
    const t = (text || '').toLowerCase();
    if (/church plant/.test(t)) return 'church planting';
    if (/translat|linguist|literature/.test(t)) return 'Bible translation/linguistics';
    if (/medical|nurs|doctor|health|physiotherap|midwife|pharmacist|psychiat/.test(t)) return 'medical';
    if (/teach|tefl|efl|educat|school/.test(t)) return 'education/TESOL';
    if (/evangel|intercess|discipl/.test(t)) return 'evangelism/discipleship';
    if (/aviat|pilot/.test(t)) return 'aviation/logistics';
    if (/media|graphic|video|social media|communic|music|art/.test(t)) return 'media/creative';
    if (/admin|finance|manager|executive|director/.test(t)) return 'administration';
    if (/\bit\b|technology|software|network|systems admin/.test(t)) return 'technology';
    if (/construc|maintenance|water engineer|building/.test(t)) return 'construction/maintenance';
    if (/member care/.test(t)) return 'member care';
    if (/relief|development|agricultur|veterinary|hydroponics/.test(t)) return 'relief and development';
    if (/dive into|short.?term/.test(t)) return 'short-term missions';
    return null;
  }

  normalizeTerm(raw) {
    if (!raw) return null;
    const t = raw.toLowerCase();
    if (/long.?term/.test(t)) return 'career/long-term';
    const years = t.match(/(\d+)\s*-?\s*(\d+)?\s*year/);
    if (years) {
      const max = Math.max(Number(years[1]), Number(years[2] || years[1]));
      if (max <= 2) return 'short-term (under 2 years)';
      if (max <= 4) return 'mid-term (2-4 years)';
      return 'career/long-term';
    }
    if (/month|week/.test(t)) return 'short-term (under 2 years)';
    return null;
  }

  inferRegion(text) {
    if (!text) return null;
    const t = text.toLowerCase();
    if (/middle east/.test(t)) return 'Middle East / North Africa';
    if (/central asia/.test(t)) return 'Central Asia';
    if (/south asia/.test(t)) return 'South Asia';
    if (/southeast asia|timor/.test(t)) return 'Southeast Asia';
    if (/korea|east asia/.test(t)) return 'East Asia';
    if (/west africa|senegal|gambia|guinea-bissau|africa/.test(t)) return 'Sub-Saharan Africa';
    if (/europe|spain|germany|netherlands|italy|greece|bulgaria|finland|albania|santiago/.test(t)) return 'Europe';
    if (/australia|new zealand|pacific/.test(t)) return 'Islands / Oceania';
    if (/usa|united states|north america|canada/.test(t)) return 'North America';
    if (/brazil|latin america/.test(t)) return 'Latin America';
    return null;
  }
}
