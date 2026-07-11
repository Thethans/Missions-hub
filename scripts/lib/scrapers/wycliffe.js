import * as cheerio from 'cheerio';
import { BaseScraper } from './base.js';

const BASE = 'https://www.wycliffe.org';

const SERVE_CATEGORIES = [
  { path: '/serve/linguistics-and-translation', title: 'Linguistics & Translation', roleType: 'Bible translation/linguistics',
    roles: ['Translation Adviser', 'Linguistic Consultant', 'Translation Consultant'] },
  { path: '/serve/business-professionals-and-management', title: 'Business & Management', roleType: 'administration',
    roles: ['Finance Professional', 'Public Relations Specialist', 'Management & Administration'] },
  { path: '/serve/information-technology', title: 'Information Technology', roleType: 'technology',
    roles: ['Software & App Developer', 'Hardware & Network Engineer', 'Language Technology Consultant'] },
  { path: '/serve/aviation-and-maritime', title: 'Aviation & Maritime', roleType: 'aviation/logistics',
    roles: ['Pilot', 'Aviation Mechanic', 'Maritime Crew'] },
  { path: '/serve/teach', title: "Children's Education", roleType: 'education/TESOL',
    roles: ['MK School Teacher', 'Education Administrator'] },
  { path: '/serve/creative-professionals', title: 'Creative Expression', roleType: 'media/creative',
    roles: ['Writer & Editor', 'Video Producer', 'EthnoArts Specialist', 'Marketing & Communications'] },
  { path: '/serve/scripture-engagement-and-language-development', title: 'Language Development & Scripture Engagement', roleType: 'Bible translation/linguistics',
    roles: ['Literacy Specialist', 'Vernacular Media Producer', 'Community Development Worker'] },
  { path: '/serve/military', title: 'Military & Veterans', roleType: null,
    roles: ['Military & Veterans Transition'] },
  { path: '/serve/human-resources-and-people-care', title: 'People Care & HR', roleType: 'member care',
    roles: ['Counselor', 'Medical Professional', 'HR Specialist', 'Coach & Trainer'] },
  { path: '/serve/pastors-and-bible-scholars', title: 'Seminary & Bible Scholars', roleType: 'theological education',
    roles: ['Translation Consultant (Seminary Track)'] },
];

export default class WycliffeScraper extends BaseScraper {
  constructor() {
    super('Wycliffe Bible Translators', BASE);
  }

  async scrape() {
    const opportunities = [];
    let totalPages = 0;

    for (const cat of SERVE_CATEGORIES) {
      let desc = null;
      try {
        const html = await this.fetchPage(`${BASE}${cat.path}`);
        totalPages++;
        const $ = cheerio.load(html);
        desc = this.normalizeWhitespace($('main p, .content p, article p, section p').first().text());
      } catch {
        // Use fallback description
      }

      opportunities.push({
        agency: this.agency,
        title: `${cat.title} — Wycliffe`,
        url: `${BASE}${cat.path}`,
        location: null,
        region: null,
        role_type: cat.roleType,
        term_length: null,
        description: desc || `Serve with Wycliffe Bible Translators in ${cat.title}. Visit wycliffe.org for current openings.`,
        date_posted: null,
        raw_html: null
      });

      for (const role of cat.roles) {
        const slug = role.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        opportunities.push({
          agency: this.agency,
          title: `${role} — Wycliffe`,
          url: `${BASE}${cat.path}#${slug}`,
          location: null,
          region: null,
          role_type: cat.roleType,
          term_length: null,
          description: `${role} position with Wycliffe Bible Translators in the ${cat.title} track.`,
          date_posted: null,
          raw_html: null
        });
      }
    }

    const employmentTypes = [
      { title: 'Volunteer Opportunities', url: `${BASE}/serve/volunteer`, term: 'short-term (under 2 years)', desc: 'Long- and short-term volunteer opportunities in IT, marketing, communications, recruiting, HR, health care, finance, and more.' },
      { title: 'Internships', url: `${BASE}/serve/intern`, term: 'short-term (under 2 years)', desc: 'Internship opportunities with Wycliffe Bible Translators to explore missions and gain hands-on experience.' },
      { title: 'Paid Positions', url: `${BASE}/serve/paid-jobs`, term: 'career/long-term', desc: 'Traditionally paid positions at Wycliffe. View openings at wycliffe.wd1.myworkdayjobs.com.' },
      { title: 'Career Missions', url: `${BASE}/serve/faq`, term: 'career/long-term', desc: 'Career missionaries serve worldwide with training and partnership support from Wycliffe Bible Translators.' },
    ];

    for (const t of employmentTypes) {
      opportunities.push({
        agency: this.agency,
        title: `${t.title} — Wycliffe`,
        url: t.url,
        location: null,
        region: null,
        role_type: 'Bible translation/linguistics',
        term_length: t.term,
        description: t.desc,
        date_posted: null,
        raw_html: null
      });
    }

    console.log(`Wycliffe: ${opportunities.length} total`);
    return { opportunities, pages: totalPages };
  }
}
