import { BaseScraper } from './base.js';

const BASE = 'https://cmalliance.org';
const MAX_PAGES_PER_REGION = 15;

// The Christian and Missionary Alliance's job board has no single unfiltered
// archive (rest.org/jobs/ 404s — the WordPress "job" custom post type's
// archive is disabled), only per-taxonomy-term pages. These five are the
// top-level "job_location" region terms (confirmed via
// cmalliance.org/wp-sitemap-taxonomies-job_location-1.xml) — each one
// aggregates every job tagged with that region or a child location under
// it (verified: /jobs/location/africa/ alone returned postings tagged with
// individual countries like Senegal and Guinea), so five fetches cover the
// whole board rather than needing all ~30 individual country terms.
// Domestic US state postings (national-office/HQ jobs, a different job
// board vertical entirely) are deliberately excluded.
const REGIONS = [
  { slug: 'africa', region: 'Sub-Saharan Africa' },
  { slug: 'asia-and-pacific', region: 'Southeast Asia' },
  { slug: 'latin-america', region: 'Latin America' },
  { slug: 'europe', region: 'Europe' },
  { slug: 'middle-east-and-central-asia', region: 'Middle East / North Africa' },
  { slug: 'general-location-tbd', region: null }
];

export default class CMAScraper extends BaseScraper {
  constructor() {
    super('Christian and Missionary Alliance (C&MA)', BASE);
  }

  async scrape() {
    const opportunities = [];
    let pages = 0;

    for (const { slug, region } of REGIONS) {
      for (let page = 1; page <= MAX_PAGES_PER_REGION; page++) {
        const url =
          page === 1
            ? `${BASE}/jobs/location/${slug}/`
            : `${BASE}/jobs/location/${slug}/page/${page}/`;
        let html;
        try {
          html = await this.fetchPage(url);
        } catch (err) {
          if (page === 1) console.warn(`C&MA: ${slug} page 1 failed — ${err.message}`);
          break;
        }
        pages++;

        const $ = this.parse$(html);
        const cards = $('.job-type.story-card').toArray();
        if (cards.length === 0) break;

        for (const card of cards) {
          const $card = $(card);
          const rawTitle = this.normalizeWhitespace($card.find('h3.card-title').text());
          const url = this.resolveUrl($card.find('.card-body a').first().attr('href'));
          const description = this.normalizeWhitespace($card.find('p.card-text').text()) || null;
          if (!rawTitle || !url) continue;

          opportunities.push({
            agency: this.agency,
            title: rawTitle,
            url,
            location: this.inferCmaLocation(rawTitle),
            region: this.inferCmaRegion(rawTitle) || region,
            role_type: this.inferRole(rawTitle, description || ''),
            term_length: /envision/i.test(rawTitle) ? 'short-term (under 2 years)' : 'career/long-term',
            description,
            date_posted: null,
            raw_html: $.html(card)
          });
        }

        if (cards.length < 6) break; // last page for this region (< a full grid row of results)
      }
    }

    const deduped = this.dedup(opportunities);
    console.log(`C&MA: ${deduped.length} total across ${REGIONS.length} regions`);
    return { opportunities: deduped, pages };
  }

  dedup(opps) {
    const seen = new Set();
    return opps.filter((o) => {
      if (seen.has(o.url)) return false;
      seen.add(o.url);
      return true;
    });
  }

  // Titles read like "...in Senegal" / "...Among the Unreached in Africa" —
  // the same pattern OCMC's card titles don't need but this site's do,
  // since (unlike OCMC) location isn't its own card field here.
  inferCmaLocation(title) {
    const m = title.match(/\bin ([A-Z][A-Za-z\s]+?)(?:$|[.,]| for\b| among\b)/);
    return m ? m[1].trim() : null;
  }

  inferCmaRegion(title) {
    const t = title.toLowerCase();
    if (/senegal|guinea|congo|gabon|africa/.test(t)) return 'Sub-Saharan Africa';
    if (/taiwan|thailand|cambodia|indonesia|japan|asia/.test(t)) return 'Southeast Asia';
    if (/mexico|paraguay|uruguay|el salvador|latin america/.test(t)) return 'Latin America';
    if (/germany|bosnia|kosovo|spain|france|italy|portugal|england|ukraine|europe/.test(t)) return 'Europe';
    if (/mongolia|central asia|middle east/.test(t)) return 'Middle East / North Africa';
    return null;
  }

  inferRole(title, desc) {
    const t = `${title} ${desc}`.toLowerCase();
    if (/church plant|axcess.*church/.test(t)) return 'church planting';
    if (/medical|health|nurs|doctor|dietitian|clinic/.test(t)) return 'medical';
    if (/teach|english|tesol|esl|school/.test(t)) return 'education/TESOL';
    if (/relief|development|community dev|social/.test(t)) return 'relief and development';
    if (/media|content|video|writer|design/.test(t)) return 'media/creative';
    if (/business as mission|marketplace|bam\b/.test(t)) return 'business as mission';
    if (/admin|director|coordinator|manager|bookkeep/.test(t)) return 'administration';
    if (/discipl|evangel|outreach/.test(t)) return 'evangelism/discipleship';
    return null;
  }
}
