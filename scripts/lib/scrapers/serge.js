import * as cheerio from 'cheerio';
import { BaseScraper } from './base.js';

const BASE = 'https://serge.org';

const SERVICE_TRACKS = [
  { url: `${BASE}/career-missions`, title: 'Career Missions', term: 'career/long-term', role: null },
  { url: `${BASE}/apprenticeship/`, title: 'Apprenticeship (18-24 months)', term: 'short-term (under 2 years)', role: 'internship' },
  { url: `${BASE}/internship/`, title: 'Internship (2-11 months)', term: 'short-term (under 2 years)', role: 'internship' },
  { url: `${BASE}/short-term-teams/`, title: 'Short-Term Mission Trips', term: 'short-term (under 2 years)', role: 'short-term missions' },
  { url: `${BASE}/missions/missionary-kid-teachers/`, title: 'Missionary Kid Teachers', term: 'career/long-term', role: 'education/TESOL' },
];

const MINISTRY_AREAS = [
  { title: 'Church Planting', role: 'church planting' },
  { title: 'Theological Education', role: 'theological education' },
  { title: 'Community Development', role: 'relief and development' },
  { title: 'Education & MK Schools', role: 'education/TESOL' },
  { title: 'Arts Ministry', role: 'media/creative' },
  { title: 'Business Transformation', role: 'business as mission' },
  { title: 'Counseling & Member Care', role: 'member care' },
  { title: 'Medical Missions', role: 'medical' },
  { title: 'Youth & Children Ministry', role: 'children/youth ministry' },
  { title: 'Discipleship', role: 'evangelism/discipleship' },
];

const REGIONS = [
  { name: 'East Africa', region: 'Sub-Saharan Africa' },
  { name: 'West Africa', region: 'Sub-Saharan Africa' },
  { name: 'Western Europe', region: 'Europe' },
  { name: 'Eastern Europe', region: 'Europe' },
  { name: 'East Asia', region: 'East Asia' },
  { name: 'South Asia', region: 'South Asia' },
  { name: 'Southeast Asia', region: 'Southeast Asia' },
  { name: 'Latin America', region: 'Latin America' },
  { name: 'Middle East', region: 'Middle East / North Africa' },
  { name: 'North America', region: 'North America' },
];

export default class SergeScraper extends BaseScraper {
  constructor() {
    super('Serge', BASE);
  }

  async scrape() {
    const opportunities = [];
    let totalPages = 0;

    for (const track of SERVICE_TRACKS) {
      console.log(`Serge: fetching ${track.title}…`);
      try {
        const html = await this.fetchPage(track.url);
        totalPages++;
        const $ = cheerio.load(html);

        const desc = this.normalizeWhitespace(
          $('main p, .content p, article p, section p').first().text()
        );

        opportunities.push({
          agency: this.agency,
          title: `${track.title} — Serge`,
          url: track.url,
          location: null,
          region: null,
          role_type: track.role,
          term_length: track.term,
          description: desc || `Explore ${track.title.toLowerCase()} with Serge. Visit serge.org for details.`,
          date_posted: null,
          raw_html: null,
        });

        $('a[href*="/missions/"], a[href*="/staffing"]').each((_, el) => {
          const $el = $(el);
          const title = this.normalizeWhitespace(
            $el.find('h2, h3, h4').first().text() || $el.text()
          );
          if (!title || title.length < 6 || title.length > 200) return;
          if (/^(home|about|contact|donate|give|start|go|back|learn more)$/i.test(title)) return;

          const href = $el.attr('href') || '';
          const url = this.resolveUrl(href);

          opportunities.push({
            agency: this.agency,
            title: `${title} — Serge`,
            url,
            location: null,
            region: null,
            role_type: track.role || this.inferRole(title, ''),
            term_length: track.term,
            description: null,
            date_posted: null,
            raw_html: null,
          });
        });
      } catch (err) {
        console.warn(`Serge: ${track.title} failed — ${err.message}`);
        opportunities.push({
          agency: this.agency,
          title: `${track.title} — Serge`,
          url: track.url,
          location: null,
          region: null,
          role_type: track.role,
          term_length: track.term,
          description: `Explore ${track.title.toLowerCase()} with Serge.`,
          date_posted: null,
          raw_html: null,
        });
      }
    }

    for (const area of MINISTRY_AREAS) {
      const slug = area.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      opportunities.push({
        agency: this.agency,
        title: `${area.title} — Serge`,
        url: `${BASE}/go#${slug}`,
        location: null,
        region: null,
        role_type: area.role,
        term_length: null,
        description: `${area.title} opportunities with Serge across Africa, Asia, Europe, and Latin America.`,
        date_posted: null,
        raw_html: null,
      });
    }

    for (const r of REGIONS) {
      opportunities.push({
        agency: this.agency,
        title: `Opportunities in ${r.name} — Serge`,
        url: `${BASE}/go#${r.name.toLowerCase().replace(/\s+/g, '-')}`,
        location: null,
        region: r.region,
        role_type: null,
        term_length: null,
        description: `Browse Serge mission opportunities in ${r.name}.`,
        date_posted: null,
        raw_html: null,
      });
    }

    const deduped = this.dedup(opportunities);
    console.log(`Serge: ${deduped.length} total`);
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

  inferRole(title, desc) {
    const text = `${title} ${desc}`.toLowerCase();
    if (/church plant/.test(text)) return 'church planting';
    if (/teach|education|mk|school/.test(text)) return 'education/TESOL';
    if (/medical|health/.test(text)) return 'medical';
    if (/art|creative|media/.test(text)) return 'media/creative';
    if (/business/.test(text)) return 'business as mission';
    if (/counsel|member care/.test(text)) return 'member care';
    if (/community|development/.test(text)) return 'relief and development';
    if (/theolog|seminary/.test(text)) return 'theological education';
    if (/youth|children/.test(text)) return 'children/youth ministry';
    if (/disciple|evangel/.test(text)) return 'evangelism/discipleship';
    return null;
  }
}
