import * as cheerio from 'cheerio';
import { fetchRenderedHTML } from './browser.js';
import { BaseScraper } from './base.js';

// omusa.org sits behind a Cloudflare bot challenge (verified: a plain
// fetch() gets a 403 with cf-mitigated: challenge) — needs the same
// headless-render approach as the other BROWSER_SCRAPERS.
const BASE = 'https://www.omusa.org';

const VIEWS = [
  { url: `${BASE}/long-term-opportunities/`, cardClass: 'long-term-job', term: 'career/long-term' },
  { url: `${BASE}/short-term-opportunities/`, cardClass: 'short-term-job', term: 'short-term (under 2 years)' }
];

export default class OMScraper extends BaseScraper {
  constructor() {
    super('OM (Operation Mobilisation)', BASE);
  }

  async scrape() {
    const opportunities = [];
    let pages = 0;

    for (const view of VIEWS) {
      console.log(`OM: loading ${view.cardClass}…`);
      let html;
      try {
        html = await fetchRenderedHTML(view.url, { timeout: 30000 });
        pages++;
      } catch (err) {
        console.warn(`OM: ${view.url} failed — ${err.message}`);
        continue;
      }
      this.extractCards(cheerio.load(html), view, opportunities);
    }

    const deduped = this.dedup(opportunities);
    console.log(`OM: ${deduped.length} total`);
    return { opportunities: deduped, pages };
  }

  extractCards($, view, opportunities) {
    $(`li.${view.cardClass}`).each((_, el) => {
      const $el = $(el);
      const title = this.normalizeWhitespace($el.find('.text-3xl').first().text());
      if (!title || title.length < 5) return;

      const description = this.normalizeWhitespace($el.find('.text-medium').first().text()) || null;
      const $link = $el.find('a[href]').first();
      const url = $link.attr('href') || view.url;

      // The li's own class list is the fixed shared utility classes plus
      // exactly one trailing country slug (e.g. "... shadow-2xl mb-10
      // united-states ") — reliable because every card on this page shares
      // the identical utility-class prefix, confirmed against the live
      // markup for both the long-term and short-term views.
      const classes = ($el.attr('class') || '').trim().split(/\s+/);
      const countrySlug = classes[classes.length - 1];
      const location = countrySlug && countrySlug !== 'undisclosed'
        ? countrySlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : null;

      const postedMatch = ($link.attr('title') || '').match(/Posted\s+([\d]{1,2}\s+\w+\s+\d{4})/i);

      opportunities.push({
        agency: this.agency,
        title,
        url,
        location,
        region: this.inferRegion(location || title),
        role_type: this.classifyRole(`${title} ${description || ''}`),
        term_length: view.term,
        description,
        date_posted: postedMatch ? postedMatch[1] : null,
        raw_html: null
      });
    });
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
    if (/refugee|esl|english as a second/.test(t)) return 'evangelism/discipleship';
    if (/medical|nurs|doctor|health/.test(t)) return 'medical';
    if (/teach|educat|school/.test(t)) return 'education/TESOL';
    if (/it technician|it\b|technology|software|network/.test(t)) return 'technology';
    if (/electrical|engineer|maintenance|deck|onboard/.test(t)) return 'construction/maintenance';
    if (/communications|media|content|graphic/.test(t)) return 'media/creative';
    if (/crew member|ship/.test(t)) return 'short-term missions';
    if (/children/.test(t)) return 'children/youth ministry';
    return null;
  }

  inferRegion(text) {
    if (!text) return null;
    const t = text.toLowerCase();
    if (/albania|austria|bosnia|poland|united kingdom|europe/.test(t)) return 'Europe';
    if (/caucasus|central asia/.test(t)) return 'Central Asia';
    if (/north africa/.test(t)) return 'Middle East / North Africa';
    if (/south africa|africa/.test(t)) return 'Sub-Saharan Africa';
    if (/taiwan|east asia/.test(t)) return 'East Asia';
    if (/new zealand|pacific/.test(t)) return 'Islands / Oceania';
    if (/united states|u\.s\.|usa/.test(t)) return 'North America';
    return null;
  }
}
