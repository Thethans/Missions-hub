import * as cheerio from 'cheerio';
import { BaseScraper } from './base.js';

const BASE = 'https://gemission.org';

const PATHWAYS = [
  { path: '/go/long-term/', term: 'career/long-term', label: 'Long-Term Missionary' },
  { path: '/go/launch/', term: 'mid-term (2-4 years)', label: 'Launch (1-2 Year Program)' },
  { path: '/go/short-term-missions/', term: 'short-term (under 2 years)', label: 'Short-Term Missions' },
  { path: '/go/ten2project/', term: 'short-term (under 2 years)', label: 'Ten2 Project (10-Day Trip)' },
];

export default class GEMScraper extends BaseScraper {
  constructor() {
    super('Greater Europe Mission', BASE);
  }

  async scrape() {
    const opportunities = [];
    let totalPages = 0;

    for (const pathway of PATHWAYS) {
      const url = `${BASE}${pathway.path}`;
      console.log(`GEM: fetching ${pathway.label}…`);

      let html;
      try {
        html = await this.fetchPage(url);
        totalPages++;
      } catch (err) {
        console.warn(`GEM: ${pathway.label} failed — ${err.message}`);
        continue;
      }

      const $ = cheerio.load(html);

      opportunities.push({
        agency: this.agency,
        title: `${pathway.label} — GEM`,
        url,
        location: 'Europe',
        region: 'Europe',
        role_type: this.inferRole(pathway.label),
        term_length: pathway.term,
        description: this.normalizeWhitespace($('main p, .fl-rich-text p, .entry-content p').first().text()) || `Serve in Europe through GEM's ${pathway.label} program.`,
        date_posted: null,
        raw_html: null,
      });

      $('h2, h3').each((_, el) => {
        const $h = $(el);
        const title = this.normalizeWhitespace($h.text());
        if (!title || title.length < 4 || title.length > 150) return;
        if (/^(more stories|related|share|menu|footer|header|navigation|are you)/i.test(title)) return;
        if (/passionate|discipling|interested|humble|why serve|what is|life.?changing|use your gifts|impact of/i.test(title)) return;
        if (/^(get started|apply|learn more|contact|sign up|next step|ready to|connect with)/i.test(title)) return;
        if (!this.inferRole(title)) return;

        const $section = $h.parent();
        const desc = this.normalizeWhitespace($section.find('p').first().text()) || null;
        const $link = $h.find('a[href]').first();
        const href = $link.length ? $link.attr('href') : null;
        const detailUrl = href ? this.resolveUrl(href) : url;

        opportunities.push({
          agency: this.agency,
          title: `${title} — GEM`,
          url: detailUrl,
          location: 'Europe',
          region: 'Europe',
          role_type: this.inferRole(title),
          term_length: pathway.term,
          description: desc,
          date_posted: null,
          raw_html: $.html($section).slice(0, 2000),
        });
      });
    }

    const countryPage = `${BASE}/opportunities-to-serve-in-romania/`;
    try {
      const html = await this.fetchPage(countryPage);
      totalPages++;
      const $ = cheerio.load(html);

      $('h2, h3').each((_, el) => {
        const title = this.normalizeWhitespace($(el).text());
        if (!title || title.length < 4 || title.length > 150) return;
        if (/^(more stories|related|share)/i.test(title)) return;

        const $section = $(el).parent();
        const desc = this.normalizeWhitespace($section.find('p').first().text()) || null;

        opportunities.push({
          agency: this.agency,
          title: `${title} (Romania) — GEM`,
          url: countryPage,
          location: 'Romania',
          region: 'Europe',
          role_type: this.inferRole(title),
          term_length: null,
          description: desc,
          date_posted: null,
          raw_html: null,
        });
      });
    } catch (err) {
      console.warn(`GEM: Romania page failed — ${err.message}`);
    }

    const deduped = this.dedup(opportunities);
    console.log(`GEM: ${deduped.length} total (${opportunities.length - deduped.length} dupes removed)`);
    return { opportunities: deduped, pages: totalPages };
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

  inferRole(text) {
    const t = (text || '').toLowerCase();
    if (/church plant/.test(t)) return 'church planting';
    if (/disciple|relational/.test(t)) return 'evangelism/discipleship';
    if (/refugee|justice/.test(t)) return 'relief and development';
    if (/campus|university|college/.test(t)) return 'evangelism/discipleship';
    if (/youth|children/.test(t)) return 'children/youth ministry';
    if (/sport|volleyball/.test(t)) return 'sports ministry';
    if (/camp/.test(t)) return 'children/youth ministry';
    if (/business/.test(t)) return 'business as mission';
    if (/biblical edu|seminary|theolog/.test(t)) return 'theological education';
    if (/creative|art|media/.test(t)) return 'media/creative';
    if (/workplace/.test(t)) return 'business as mission';
    if (/it\b|tech|software/.test(t)) return 'technology';
    return null;
  }
}
