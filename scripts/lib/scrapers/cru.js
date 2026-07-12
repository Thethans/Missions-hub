import * as cheerio from 'cheerio';
import { BaseScraper } from './base.js';

const BASE = 'https://www.cru.org';

const OPPORTUNITY_PAGES = [
  { url: `${BASE}/us/en/opportunities/mission-trips.html`, category: 'Mission Trips', term: 'short-term (under 2 years)', role: 'short-term missions' },
  { url: `${BASE}/us/en/opportunities/internships.html`, category: 'Internships', term: 'short-term (under 2 years)', role: 'internship' },
  { url: `${BASE}/us/en/opportunities/careers.html`, category: 'Careers', term: 'career/long-term', role: null },
  { url: `${BASE}/us/en/opportunities/volunteer.html`, category: 'Volunteer', term: 'short-term (under 2 years)', role: 'volunteer' },
  { url: `${BASE}/us/en/opportunities/international.html`, category: 'International', term: null, role: null },
  { url: `${BASE}/us/en/opportunities/events.html`, category: 'Events', term: 'short-term (under 2 years)', role: 'evangelism/discipleship' },
];

const EXPLORE_SUBPAGES = [
  { url: `${BASE}/us/en/opportunities/explore-your-interests/give-dev/africa-bibles.html`, title: 'Africa Bibles', role: 'evangelism/discipleship', region: 'Sub-Saharan Africa' },
  { url: `${BASE}/us/en/opportunities/explore-your-interests/give-dev/church-planting.html`, title: 'Church Planting', role: 'church planting', region: null },
  { url: `${BASE}/us/en/opportunities/explore-your-interests/give-dev/closed-country-evangelism.html`, title: 'Closed Country Evangelism', role: 'evangelism/discipleship', region: null },
  { url: `${BASE}/us/en/opportunities/explore-your-interests/give-dev/frontline-staff.html`, title: 'Frontline Staff Support', role: 'member care', region: null },
  { url: `${BASE}/us/en/opportunities/explore-your-interests/give-dev/port-cities.html`, title: 'Port Cities Ministry', role: 'evangelism/discipleship', region: null },
  { url: `${BASE}/us/en/opportunities/explore-your-interests/give-dev/vulnerable-women.html`, title: 'Vulnerable Women Ministry', role: 'relief and development', region: null },
  { url: `${BASE}/us/en/opportunities/explore-your-interests/give-dev/water.html`, title: 'Clean Water Projects', role: 'relief and development', region: null },
];

const MINISTRY_AREAS = [
  { title: 'Campus Ministry', role: 'evangelism/discipleship', desc: 'Reach college students with the gospel through campus outreach, Bible studies, and discipleship.' },
  { title: 'Athletes in Action', role: 'sports ministry', desc: 'Sports ministry reaching athletes and coaches through the platform of sport.' },
  { title: 'Keynote (High School)', role: 'children/youth ministry', desc: 'High school ministry equipping students to share their faith.' },
  { title: 'JESUS Film Project', role: 'media/creative', desc: 'Using film and media to share the story of Jesus in every language.' },
  { title: 'FamilyLife', role: 'member care', desc: 'Strengthening marriages and families through conferences, resources, and radio.' },
  { title: 'LeaderImpact', role: 'business as mission', desc: 'Helping marketplace leaders integrate faith and work.' },
  { title: 'Global Missions', role: 'evangelism/discipleship', desc: 'Cru missionaries serving in over 190 countries worldwide.' },
  { title: 'Digital Ministry', role: 'technology', desc: 'Using digital tools and platforms to reach people with the gospel online.' },
  { title: 'Church Movements', role: 'church planting', desc: 'Partnering with churches to accelerate the Great Commission.' },
  { title: 'GAiN (Global Aid Network)', role: 'relief and development', desc: 'Meeting physical needs and sharing hope in vulnerable communities worldwide.' },
  { title: 'Military Ministry', role: 'evangelism/discipleship', desc: 'Reaching military personnel and their families with the gospel.' },
  { title: 'Inner City Ministry', role: 'relief and development', desc: 'Serving communities in urban areas through outreach and development.' },
];

export default class CruScraper extends BaseScraper {
  constructor() {
    super('Cru (Campus Crusade for Christ)', BASE);
  }

  async scrape() {
    const opportunities = [];
    let totalPages = 0;

    for (const page of OPPORTUNITY_PAGES) {
      console.log(`Cru: fetching ${page.category}…`);
      try {
        const html = await this.fetchPage(page.url);
        totalPages++;
        const $ = cheerio.load(html);
        this.extractLinks($, opportunities, page);
      } catch (err) {
        console.warn(`Cru: ${page.category} failed — ${err.message}`);
        opportunities.push({
          agency: this.agency,
          title: `${page.category} — Cru`,
          url: page.url,
          location: null,
          region: null,
          role_type: page.role,
          term_length: page.term,
          description: `Explore ${page.category.toLowerCase()} with Cru. Visit cru.org for current opportunities.`,
          date_posted: null,
          raw_html: null,
        });
      }
    }

    for (const ministry of MINISTRY_AREAS) {
      const slug = ministry.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      opportunities.push({
        agency: this.agency,
        title: `${ministry.title} — Cru`,
        url: `${BASE}/us/en/opportunities.html#${slug}`,
        location: null,
        region: null,
        role_type: ministry.role,
        term_length: null,
        description: ministry.desc,
        date_posted: null,
        raw_html: null,
      });
    }

    for (const sub of EXPLORE_SUBPAGES) {
      console.log(`Cru: fetching explore subpage ${sub.title}…`);
      try {
        const html = await this.fetchPage(sub.url);
        totalPages++;
        const $ = cheerio.load(html);
        const desc = this.normalizeWhitespace($('main p, .content p, article p').first().text());

        opportunities.push({
          agency: this.agency,
          title: `${sub.title} — Cru`,
          url: sub.url,
          location: null,
          region: sub.region,
          role_type: sub.role,
          term_length: null,
          description: desc || `Support ${sub.title.toLowerCase()} through Cru.`,
          date_posted: null,
          raw_html: null,
        });

        this.extractLinks($, opportunities, { role: sub.role, term: null });
      } catch (err) {
        console.warn(`Cru: ${sub.title} subpage failed — ${err.message}`);
        opportunities.push({
          agency: this.agency,
          title: `${sub.title} — Cru`,
          url: sub.url,
          location: null,
          region: sub.region,
          role_type: sub.role,
          term_length: null,
          description: `Support ${sub.title.toLowerCase()} through Cru.`,
          date_posted: null,
          raw_html: null,
        });
      }
    }

    const deduped = this.dedup(opportunities);
    console.log(`Cru: ${deduped.length} total`);
    return { opportunities: deduped, pages: totalPages };
  }

  extractLinks($, opportunities, pageInfo) {
    const seen = new Set(opportunities.map(o => o.title.toLowerCase()));

    $('a[href*="/opportunities/"]').each((_, el) => {
      const $el = $(el);
      const title = this.normalizeWhitespace(
        $el.find('h2, h3, h4').first().text() || $el.text()
      );
      if (!title || title.length < 4 || title.length > 200) return;
      if (seen.has(title.toLowerCase())) return;
      if (/^(back|home|view all|see all|opportunities|more|related)$/i.test(title)) return;
      seen.add(title.toLowerCase());

      const href = $el.attr('href') || '';
      const url = this.resolveUrl(href);

      const description = this.normalizeWhitespace(
        $el.find('p').first().text()
      ) || null;

      opportunities.push({
        agency: this.agency,
        title: `${title} — Cru`,
        url,
        location: null,
        region: null,
        role_type: pageInfo.role || this.inferRole(title, description || ''),
        term_length: pageInfo.term,
        description,
        date_posted: null,
        raw_html: $.html(el).slice(0, 2000),
      });
    });
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

  inferRole(title, desc) {
    const text = `${title} ${desc}`.toLowerCase();
    if (/campus|college|university/.test(text)) return 'evangelism/discipleship';
    if (/athlete|sport/.test(text)) return 'sports ministry';
    if (/film|media|digital|video/.test(text)) return 'media/creative';
    if (/church|plant/.test(text)) return 'church planting';
    if (/youth|high school|student/.test(text)) return 'children/youth ministry';
    if (/military/.test(text)) return 'evangelism/discipleship';
    if (/family|marriage/.test(text)) return 'member care';
    if (/relief|aid|development|inner city/.test(text)) return 'relief and development';
    if (/business|marketplace|leader/.test(text)) return 'business as mission';
    if (/tech|software/.test(text)) return 'technology';
    return null;
  }
}
