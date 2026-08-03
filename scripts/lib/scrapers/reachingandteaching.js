import { BaseScraper } from './base.js';

// Reaching & Teaching International Ministries (reachingandteaching.org
// redirects to rtim.org). Their long-term-opportunities page
// (rtim.org/go/long-term-opportunities-2/) lists 12 roles as pure
// narrative text — no individual URLs, everything funnels to one generic
// inquiry form — so, same as ethnos360.js's SHORT_TERM_TRIPS and
// frontiers.js's own hand-curated list, that page isn't a reliable source
// to automate against.
//
// rtim.org/jobs/ is different: 4 real staff postings, each with its own
// dedicated page and URL. Hand-curated here from those live pages
// (verified 2026-08-03) rather than scraped from a repeating card
// template, since the listing page itself has no such template — only
// titles + links.
const JOB_POSTINGS = [
  {
    title: 'Practicum and Global Internship Manager',
    url: 'https://rtim.org/practicum-and-global-internship-manager/',
    location: 'Louisville, KY',
    description: 'Oversees the Practicum and Global Internship programs within the Mobilization team — coordinates with host churches and regional partners, manages applications and placements, and mentors participants throughout their experience.'
  },
  {
    title: 'Regional Leader | MENA',
    url: 'https://rtim.org/regional-leader-mena/',
    location: 'Middle East / North Africa',
    description: 'Provides vision, direction, and oversight for RTIM’s long-term work in the MENA region — supervises missionaries and teams, conducts staff interviews, and maintains partnerships with sending churches. Full-time, support-raised.'
  },
  {
    title: 'Regional Leader | South Asia',
    url: 'https://rtim.org/regional-leader-sa/',
    location: 'South Asia',
    description: 'Provides vision, direction, and oversight for RTIM’s long-term work in South Asia — supervises missionaries and teams, facilitates ministry development, and serves on the global leadership team. Full-time.'
  },
  {
    title: 'Regional Mobilizer',
    url: 'https://rtim.org/regional-mobilizer/',
    location: 'United States',
    description: 'Develops and maintains partnerships with churches to cast vision for church-centered missions, vets potential applicants, and represents RTIM at conferences and events. Full-time, support-raised.'
  }
];

export default class ReachingAndTeachingScraper extends BaseScraper {
  constructor() {
    super('Reaching & Teaching', 'https://rtim.org');
  }

  async scrape() {
    const opportunities = JOB_POSTINGS.map((job) => ({
      agency: this.agency,
      title: job.title,
      url: job.url,
      location: job.location,
      region: this.inferRegion(job.location),
      role_type: 'staff/leadership',
      term_length: 'career/long-term',
      description: job.description,
      date_posted: null,
      raw_html: null
    }));
    console.log(`Reaching & Teaching: ${opportunities.length} total (hand-curated, see file comment)`);
    return { opportunities, pages: 1 };
  }

  inferRegion(location) {
    const t = (location || '').toLowerCase();
    if (/middle east|mena|north africa/.test(t)) return 'Middle East / North Africa';
    if (/south asia/.test(t)) return 'South Asia';
    if (/united states|louisville|usa/.test(t)) return 'North America';
    return null;
  }
}
