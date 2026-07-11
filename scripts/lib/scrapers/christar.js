import * as cheerio from 'cheerio';
import { BaseScraper } from './base.js';

const BASE = 'https://www.christar.org';

export default class ChristarScraper extends BaseScraper {
  constructor() {
    super('Christar', BASE);
  }

  async scrape() {
    const opportunities = [];
    let totalPages = 0;

    const sections = [
      { url: `${BASE}/st-opportunities`, pathPrefix: '/st-opportunity/', label: 'short-term', defaultTerm: 'short-term (under 2 years)' },
      { url: `${BASE}/mt-lt-opportunities`, pathPrefix: '/mt-lt-opportunity/', label: 'mid/long-term', defaultTerm: 'career/long-term' },
    ];

    for (const section of sections) {
      let page = 1;
      const maxPages = 5;

      while (page <= maxPages) {
        const url = page === 1 ? section.url : `${section.url}?page=${page}`;
        console.log(`Christar: fetching ${section.label} page ${page}…`);

        let html;
        try {
          html = await this.fetchPage(url);
          totalPages++;
        } catch (err) {
          if (page === 1) console.warn(`Christar: ${section.label} failed — ${err.message}`);
          break;
        }

        const $ = cheerio.load(html);
        const before = opportunities.length;

        $(`a[href*="${section.pathPrefix}"]`).each((_, el) => {
          const $el = $(el);
          const href = $el.attr('href') || '';
          const url = this.resolveUrl(href);

          const title = this.normalizeWhitespace(
            $el.find('h2, h3, h4, h5').first().text() || $el.text()
          );
          if (!title || title.length < 6 || title.length > 200) return;
          if (/^(next|prev|back|page)$/i.test(title)) return;

          const location = this.extractLocation(title);
          const description = this.normalizeWhitespace(
            $el.find('p').first().text()
          ) || null;

          opportunities.push({
            agency: this.agency,
            title,
            url,
            location,
            region: this.inferRegion(location || title),
            role_type: this.inferRole(title, description || ''),
            term_length: this.inferTermFromTitle(title) || section.defaultTerm,
            description,
            date_posted: null,
            raw_html: $.html(el).slice(0, 2000),
          });
        });

        if (opportunities.length === before) break;
        const hasNext = $('a:contains("Next"), [class*="next"], a[rel="next"]').length > 0;
        if (!hasNext) break;
        page++;
      }
    }

    const deduped = this.dedup(opportunities);
    console.log(`Christar: ${deduped.length} total`);
    return { opportunities: deduped, pages: totalPages };
  }

  extractLocation(title) {
    if (!title) return null;
    const match = title.match(/:\s*(.+)$/);
    if (match) return match[1].trim();
    const match2 = title.match(/~\s*(.+)$/);
    if (match2) return match2[1].trim();
    return null;
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
    if (/middle east|jordan|lebanon|iraq|egypt/.test(t)) return 'Middle East / North Africa';
    if (/balkans|spain|europe/.test(t)) return 'Europe';
    if (/philippines|southeast asia/.test(t)) return 'Southeast Asia';
    if (/hong kong|china|east asia/.test(t)) return 'East Asia';
    if (/india|south asia/.test(t)) return 'South Asia';
    if (/north africa|morocco|tunisia|algeria/.test(t)) return 'Middle East / North Africa';
    if (/canada|usa|united states/.test(t)) return 'North America';
    if (/africa/.test(t)) return 'Sub-Saharan Africa';
    return null;
  }

  inferRole(title, desc) {
    const text = `${title} ${desc}`.toLowerCase();
    if (/church plant|pioneer/.test(text)) return 'church planting';
    if (/teach|education|tesol/.test(text)) return 'education/TESOL';
    if (/disciple|discipl/.test(text)) return 'evangelism/discipleship';
    if (/recruit|mobilis|mobiliz/.test(text)) return 'mobilization';
    if (/admin|support/.test(text)) return 'administration';
    if (/business|incubat|marketplace/.test(text)) return 'business as mission';
    if (/security|protect/.test(text)) return 'technology';
    if (/shepherd|pastor|counsel/.test(text)) return 'member care';
    if (/medical|health/.test(text)) return 'medical';
    if (/refugee|mercy|justice/.test(text)) return 'relief and development';
    if (/women|children|youth/.test(text)) return 'children/youth ministry';
    if (/relate|communicat/.test(text)) return 'media/creative';
    return 'evangelism/discipleship';
  }

  inferTermFromTitle(title) {
    const t = title.toLowerCase();
    if (/discover|explore|short.?term|trip/.test(t)) return 'short-term (under 2 years)';
    return null;
  }
}
