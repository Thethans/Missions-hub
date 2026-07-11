import * as cheerio from 'cheerio';
import { fetchRenderedHTML } from './browser.js';
import { BaseScraper } from './base.js';

const BASE = 'https://serves.efca.org';
const LISTING_URL = BASE;

export default class ReachGlobalScraper extends BaseScraper {
  constructor() {
    super('ReachGlobal (EFCA)', BASE);
  }

  async scrape() {
    const opportunities = [];
    let totalPages = 0;

    console.log('ReachGlobal: scraping opportunities (JS-rendered)…');
    try {
      const html = await fetchRenderedHTML(LISTING_URL, { timeout: 30000 });
      totalPages = 1;
      const $ = cheerio.load(html);
      this.extractCards($, opportunities);
    } catch (err) {
      console.warn(`ReachGlobal: main page failed — ${err.message}`);
    }

    const termViews = [
      { url: `${BASE}/?term=short`, label: 'short-term', defaultTerm: 'short-term (under 2 years)' },
      { url: `${BASE}/?term=long`, label: 'long-term', defaultTerm: 'career/long-term' },
    ];

    for (const view of termViews) {
      console.log(`ReachGlobal: fetching ${view.label}…`);
      try {
        const html = await fetchRenderedHTML(view.url, { timeout: 30000 });
        totalPages++;
        const $ = cheerio.load(html);
        this.extractCards($, opportunities, view.defaultTerm);
      } catch (err) {
        console.warn(`ReachGlobal: ${view.label} failed — ${err.message}`);
      }
    }

    if (opportunities.length === 0) {
      this.addFallbackEntries(opportunities);
    }

    const deduped = this.dedup(opportunities);
    console.log(`ReachGlobal: ${deduped.length} total`);
    return { opportunities: deduped, pages: totalPages };
  }

  extractCards($, opportunities, defaultTerm) {
    const seen = new Set(opportunities.map(o => o.title.toLowerCase()));

    $('[class*="card"], [class*="opportunity"], article, [class*="listing"] > div, [class*="grid"] > div').each((_, el) => {
      const $el = $(el);
      const title = this.normalizeWhitespace(
        $el.find('h2, h3, h4, h5, [class*="title"]').first().text()
      );
      if (!title || title.length < 6 || title.length > 200) return;
      if (seen.has(title.toLowerCase())) return;
      if (/^(filter|search|clear|back|next|view more|show)$/i.test(title)) return;
      seen.add(title.toLowerCase());

      const linkEl = $el.find('a[href]').first();
      const href = linkEl.attr('href') || '';
      const url = this.resolveUrl(href) || LISTING_URL;

      const fullText = this.normalizeWhitespace($el.text());
      const description = this.normalizeWhitespace(
        $el.find('p, [class*="desc"]').first().text()
      ) || null;

      const location = this.normalizeWhitespace(
        $el.find('[class*="location"], [class*="region"], [class*="country"]').first().text()
      ) || null;

      opportunities.push({
        agency: this.agency,
        title,
        url,
        location,
        region: this.inferRegion(location || title || fullText),
        role_type: this.inferRole(title, (description || '') + ' ' + fullText),
        term_length: defaultTerm || this.inferTerm(fullText),
        description,
        date_posted: null,
        raw_html: $.html(el).slice(0, 2000),
      });
    });
  }

  addFallbackEntries(opportunities) {
    const entries = [
      { title: 'Short-Term Mission Trips', term: 'short-term (under 2 years)', role: 'short-term missions' },
      { title: 'Long-Term Missionary Positions', term: 'career/long-term', role: null },
      { title: 'Church Planting', term: 'career/long-term', role: 'church planting' },
      { title: 'Theological Education', term: null, role: 'theological education' },
      { title: 'Mercy & Justice Ministry', term: null, role: 'relief and development' },
      { title: 'Student Ministry', term: null, role: 'children/youth ministry' },
      { title: 'Leadership Development', term: null, role: 'training/leadership' },
    ];

    for (const e of entries) {
      opportunities.push({
        agency: this.agency,
        title: `${e.title} — ReachGlobal`,
        url: LISTING_URL,
        location: null,
        region: null,
        role_type: e.role,
        term_length: e.term,
        description: `Explore ${e.title.toLowerCase()} with ReachGlobal (EFCA). Visit serves.efca.org for current openings.`,
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
    if (/asia|japan|china|korea|taiwan/.test(t)) return 'East Asia';
    if (/europe|germany|france|spain|italy/.test(t)) return 'Europe';
    if (/africa|kenya|uganda|south africa/.test(t)) return 'Sub-Saharan Africa';
    if (/middle east|arab|jordan|lebanon/.test(t)) return 'Middle East / North Africa';
    if (/latin|mexico|brazil|south america/.test(t)) return 'Latin America';
    if (/southeast asia|thailand|philippines/.test(t)) return 'Southeast Asia';
    if (/india|south asia/.test(t)) return 'South Asia';
    return null;
  }

  inferRole(title, desc) {
    const text = `${title} ${desc}`.toLowerCase();
    if (/church plant/.test(text)) return 'church planting';
    if (/medical|health/.test(text)) return 'medical';
    if (/teach|education|tesol/.test(text)) return 'education/TESOL';
    if (/evangel|disciple|outreach/.test(text)) return 'evangelism/discipleship';
    if (/youth|student|children/.test(text)) return 'children/youth ministry';
    if (/mercy|justice|relief|development/.test(text)) return 'relief and development';
    if (/leader/.test(text)) return 'training/leadership';
    if (/theolog/.test(text)) return 'theological education';
    if (/intern/.test(text)) return 'internship';
    return null;
  }

  inferTerm(text) {
    if (!text) return null;
    const t = text.toLowerCase();
    if (/short.?term|1-11 month|trip|summer/.test(t)) return 'short-term (under 2 years)';
    if (/long.?term|career|longer/.test(t)) return 'career/long-term';
    return null;
  }
}
