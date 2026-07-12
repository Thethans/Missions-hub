import * as cheerio from 'cheerio';
import { BaseScraper } from './base.js';

const BASE = 'https://www.wycliffe.org';

const SERVE_CATEGORIES = [
  { path: '/serve/linguistics-and-translation', title: 'Linguistics & Translation', roleType: 'Bible translation/linguistics' },
  { path: '/serve/business-professionals-and-management', title: 'Business & Management', roleType: 'administration' },
  { path: '/serve/information-technology', title: 'Information Technology', roleType: 'technology' },
  { path: '/serve/aviation-and-maritime', title: 'Aviation & Maritime', roleType: 'aviation/logistics' },
  { path: '/serve/teach', title: "Children's Education", roleType: 'education/TESOL' },
  { path: '/serve/creative-professionals', title: 'Creative Expression', roleType: 'media/creative' },
  { path: '/serve/scripture-engagement-and-language-development', title: 'Language Development & Scripture Engagement', roleType: 'Bible translation/linguistics' },
  { path: '/serve/military', title: 'Military & Veterans', roleType: null },
  { path: '/serve/human-resources-and-people-care', title: 'People Care & HR', roleType: 'member care' },
  { path: '/serve/pastors-and-bible-scholars', title: 'Seminary & Bible Scholars', roleType: 'theological education' },
];

const EMPLOYMENT_PAGES = [
  { path: '/serve/volunteer', title: 'Volunteer Opportunities', term: 'short-term (under 2 years)' },
  { path: '/serve/intern', title: 'Internships', term: 'short-term (under 2 years)' },
  { path: '/serve/paid-jobs', title: 'Paid Positions', term: 'career/long-term' },
  { path: '/serve/faq', title: 'Career Missions', term: 'career/long-term' },
];

export default class WycliffeScraper extends BaseScraper {
  constructor() {
    super('Wycliffe Bible Translators', BASE);
  }

  async scrape() {
    const opportunities = [];
    let totalPages = 0;

    for (const cat of SERVE_CATEGORIES) {
      const url = `${BASE}${cat.path}`;
      console.log(`Wycliffe: fetching ${cat.title}…`);

      let html;
      try {
        html = await this.fetchPage(url);
        totalPages++;
      } catch (err) {
        console.warn(`Wycliffe: ${cat.title} failed — ${err.message}`);
        opportunities.push({
          agency: this.agency,
          title: `${cat.title} — Wycliffe`,
          url,
          location: null, region: null,
          role_type: cat.roleType,
          term_length: null,
          description: `Serve with Wycliffe Bible Translators in ${cat.title}. Visit wycliffe.org for current openings.`,
          date_posted: null, raw_html: null,
        });
        continue;
      }

      const $ = cheerio.load(html);

      const pageDesc = this.normalizeWhitespace(
        $('main p, .content p, article p, section p').first().text()
      );

      opportunities.push({
        agency: this.agency,
        title: `${cat.title} — Wycliffe`,
        url,
        location: null, region: null,
        role_type: cat.roleType,
        term_length: null,
        description: pageDesc || `Serve with Wycliffe Bible Translators in ${cat.title}.`,
        date_posted: null,
        raw_html: null,
      });

      $('h2, h3, h4').each((_, el) => {
        const $h = $(el);
        const title = this.normalizeWhitespace($h.text());
        if (!title || title.length < 5 || title.length > 200) return;
        if (/^(your account|step into|join|find your|explore|ready to|serve in|god is|use your|a growing)/i.test(title)) return;
        if (/^(home|about|contact|give|pray|search|filter|menu|footer|header)/i.test(title)) return;
        if (/^—\s/.test(title) || /\(n[li]t\)|\(esv\)|\(niv\)|\(kjv\)/i.test(title)) return;
        if (/^(thinking of|wondering|watch to|collaboration in)/i.test(title)) return;

        const $container = $h.next('p').length ? $h.parent() : $h.closest('div, section');
        const desc = this.normalizeWhitespace($h.next('p').text() || $container.find('p').first().text());
        if (!desc || desc.length < 10) return;

        const $link = $h.find('a[href]').first();
        const href = $link.length ? $link.attr('href') : null;
        const detailUrl = href ? this.resolveUrl(href) : url;

        opportunities.push({
          agency: this.agency,
          title: `${title} — Wycliffe`,
          url: detailUrl,
          location: null, region: null,
          role_type: cat.roleType || this.inferRole(title),
          term_length: this.inferTerm(title, desc),
          description: desc.slice(0, 500),
          date_posted: null,
          raw_html: $.html($container).slice(0, 2000),
        });
      });
    }

    for (const emp of EMPLOYMENT_PAGES) {
      const url = `${BASE}${emp.path}`;
      console.log(`Wycliffe: fetching ${emp.title}…`);

      let desc = null;
      try {
        const html = await this.fetchPage(url);
        totalPages++;
        const $ = cheerio.load(html);
        desc = this.normalizeWhitespace($('main p, .content p, article p').first().text());

        $('h2, h3, h4').each((_, el) => {
          const title = this.normalizeWhitespace($(el).text());
          if (!title || title.length < 5 || title.length > 200) return;
          if (/^(your account|step into|join|find your|explore|ready to)/i.test(title)) return;
          if (/^—\s/.test(title) || /\(n[li]t\)|\(esv\)|\(niv\)|\(kjv\)/i.test(title)) return;
          if (/^(thinking of|wondering|watch to|collaboration in)/i.test(title)) return;

          const subDesc = this.normalizeWhitespace($(el).next('p').text());
          if (!subDesc || subDesc.length < 10) return;

          const $link = $(el).find('a[href]').first();
          const href = $link.length ? $link.attr('href') : null;

          opportunities.push({
            agency: this.agency,
            title: `${title} — Wycliffe`,
            url: href ? this.resolveUrl(href) : url,
            location: null, region: null,
            role_type: this.inferRole(title),
            term_length: emp.term,
            description: subDesc.slice(0, 500),
            date_posted: null, raw_html: null,
          });
        });
      } catch {
        // fallback
      }

      opportunities.push({
        agency: this.agency,
        title: `${emp.title} — Wycliffe`,
        url,
        location: null, region: null,
        role_type: 'Bible translation/linguistics',
        term_length: emp.term,
        description: desc || `Explore ${emp.title.toLowerCase()} with Wycliffe Bible Translators.`,
        date_posted: null, raw_html: null,
      });
    }

    const deduped = this.dedup(opportunities);
    console.log(`Wycliffe: ${deduped.length} total (${opportunities.length - deduped.length} dupes removed)`);
    return { opportunities: deduped, pages: totalPages };
  }

  dedup(opps) {
    const seen = new Set();
    return opps.filter(o => {
      const key = o.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  inferRole(text) {
    const t = (text || '').toLowerCase();
    if (/translat|linguist/.test(t)) return 'Bible translation/linguistics';
    if (/tech|software|it\b|developer|network/.test(t)) return 'technology';
    if (/aviat|pilot|maritime/.test(t)) return 'aviation/logistics';
    if (/teach|education|school/.test(t)) return 'education/TESOL';
    if (/media|creative|video|art|writer|editor/.test(t)) return 'media/creative';
    if (/counsel|care|hr|human resource/.test(t)) return 'member care';
    if (/business|admin|finance|management/.test(t)) return 'administration';
    if (/literacy|scripture|vernacular/.test(t)) return 'Bible translation/linguistics';
    if (/seminary|pastor|bible scholar/.test(t)) return 'theological education';
    return null;
  }

  inferTerm(title, desc) {
    const t = `${title} ${desc}`.toLowerCase();
    if (/intern|short.?term|volunteer|summer/.test(t)) return 'short-term (under 2 years)';
    if (/career|long.?term|paid/.test(t)) return 'career/long-term';
    return null;
  }
}
