import { BaseScraper } from './base.js';

// FrontiersGo (frontiersgo.org, Frontiers USA's actual opportunity site —
// frontiersusa.org itself has no listings, just a "Find Your Place" contact
// form) sits behind a Cloudflare bot challenge that blocks a plain fetch();
// getting through needs the same headless-render approach browser.js
// already provides for other agencies (see BROWSER_SCRAPERS below).
//
// The short-term trips page itself is a hand-built Elementor layout with no
// per-card container — titles/regions/descriptions are just a loose
// sequence of headings and paragraphs, interrupted by testimonial quotes.
// Worse, several of the page's own "Learn More" links point at the WRONG
// trip (verified directly against the live HTML on 2026-07-24: the
// "Arabic", "3-Month Missions Mentorship", and "Additional Opportunities"
// blocks all link to the North-East Africa trip instead of themselves —
// a bug on Frontiers' side, not a parsing error here). Automating extraction
// against markup that's internally inconsistent would just automate wrong
// answers, so this is a hand-curated list of the entries whose own link
// self-verifies correctly — same precedent as ethnos360.js's
// SHORT_TERM_TRIPS. Real content, read directly off the live page, not
// invented; re-verify against https://frontiersgo.org/short-term/ before
// trusting this list to still be current.
const SHORT_TERM_TRIPS = [
  {
    title: '10-Day Cross-Cultural Learning Trip',
    url: 'https://frontiersgo.org/shortterm/north-east-africa-10-day/',
    location: 'Northeast Africa',
    description: 'Spend 10 days experiencing the Muslim world in a personal and powerful way. You’ll see God at work and discern how He is calling you to be part of sharing the Good News with Muslims in the least-reached places.'
  },
  {
    title: '2-Week Pioneering Prayer Trips',
    url: 'https://frontiersgo.org/shortterm/southasia-2week/',
    location: 'South Asia',
    description: 'Teams of 4–8 individuals will partner with long-term workers, covering unreached cities in prayer, modeling Christian community, and discerning spiritual dynamics.'
  },
  {
    title: '6-Week Language Learning Trip — Mandarin',
    url: 'https://frontiersgo.org/shortterm/mandarin-central-asia/',
    location: 'Central Asia',
    description: 'Join us on a short-term language learning missions trip designed to combine cultural immersion with meaningful service.'
  },
  {
    title: '6-Week Language Learning Trip — Urdu',
    url: 'https://frontiersgo.org/shortterm/urdu/',
    location: 'South Asia',
    description: 'South Asia’s vibrant cultures and languages create the perfect setting for a language-learning journey. Immerse yourself in Urdu, build relationships, and witness God’s work firsthand.'
  }
];

export default class FrontiersScraper extends BaseScraper {
  constructor() {
    super('Frontiers', 'https://frontiersgo.org');
  }

  async scrape() {
    const opportunities = SHORT_TERM_TRIPS.map((trip) => ({
      agency: this.agency,
      title: trip.title,
      url: trip.url,
      location: trip.location,
      region: this.inferRegion(trip.location),
      role_type: 'short-term missions',
      term_length: 'short-term (under 2 years)',
      description: trip.description,
      date_posted: null,
      raw_html: null
    }));
    console.log(`Frontiers: ${opportunities.length} total (hand-curated, see file comment)`);
    return { opportunities, pages: 1 };
  }

  inferRegion(location) {
    const t = (location || '').toLowerCase();
    if (/northeast africa|north.?east africa/.test(t)) return 'Sub-Saharan Africa';
    if (/south asia/.test(t)) return 'South Asia';
    if (/central asia/.test(t)) return 'Central Asia';
    return null;
  }
}
