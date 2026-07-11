import * as cheerio from 'cheerio';
import { fetchRenderedHTML, paginateAndCollectHTML, sleep } from './browser.js';
import { BaseScraper } from './base.js';

const BASE = 'https://ywam.org';

const PROGRAM_PAGES = [
  { url: `${BASE}/dts`, label: 'Discipleship Training School (DTS)', term: 'short-term (under 2 years)', role: 'discipleship training' },
  { url: `${BASE}/get-involved-now/outreach-trips`, label: 'Outreach Trips', term: 'short-term (under 2 years)', role: 'short-term missions' },
  { url: `${BASE}/get-involved-now/volunteer`, label: 'Volunteer', term: 'short-term (under 2 years)', role: 'volunteer' },
  { url: `${BASE}/get-involved-now/join-staff`, label: 'Join Staff', term: 'career/long-term', role: null },
  { url: `${BASE}/training/university-of-the-nations`, label: 'University of the Nations', term: null, role: 'education/TESOL' },
];

const PASSION_CATEGORIES = [
  'Arts/Media', 'Business/Science', 'Children/Family', 'Communication',
  'Community Development', 'Counseling', 'Discipleship', 'Education/Training',
  'Evangelism', 'Health/Medical', 'Intercession/Worship', 'Justice',
  'Leadership Development', 'Linguistics/Translation', 'Maritime',
  'Mercy Ministry', 'Sports', 'Technology', 'Youth',
];

const NOISE = /^(explore|get involved|who we are|frequently|pray$|donate$|for parents|blog$|for ywamers|contact$|discover$|regions$|passions$|info$|endorsements|update your|privacy|cookie|ywam\.org jobs|data service|uptimerob|our story|our purpose|our blog|our leadership|our founders|our documents|know god$|make god known$|search$|menu$|home$|about$)/i;

export default class YWAMScraper extends BaseScraper {
  constructor() {
    super('Youth With A Mission (YWAM)', BASE);
  }

  async scrape() {
    const opportunities = [];
    let totalPages = 0;

    console.log('YWAM: scraping explore page…');
    try {
      const htmlPages = await paginateAndCollectHTML(`${BASE}/explore`, { maxPages: 3 });
      for (const html of htmlPages) {
        totalPages++;
        this.extractCards(cheerio.load(html), opportunities, `${BASE}/explore`);
      }
    } catch (err) {
      console.warn(`YWAM: explore page failed — ${err.message}`);
    }

    for (const page of PROGRAM_PAGES) {
      console.log(`YWAM: loading ${page.label}…`);
      await sleep(2000);
      try {
        const html = await fetchRenderedHTML(page.url, { timeout: 45000 });
        totalPages++;
        const $ = cheerio.load(html);
        const extracted = this.extractCards($, opportunities, page.url);
        if (extracted === 0) {
          this.addProgramEntry(opportunities, page);
        }
      } catch (err) {
        console.warn(`YWAM: ${page.label} failed — ${err.message}`);
        this.addProgramEntry(opportunities, page);
      }
    }

    this.addPassionEntries(opportunities);

    const deduped = this.dedup(opportunities);
    console.log(`YWAM: ${deduped.length} total (${opportunities.length - deduped.length} dupes removed)`);
    return { opportunities: deduped, pages: totalPages };
  }

  extractCards($, opportunities, sourceUrl) {
    let count = 0;
    const seen = new Set(opportunities.map(o => o.title.toLowerCase()));

    const mainContent = $('main, [role="main"], .content, #content').first();
    const $scope = mainContent.length ? mainContent : $.root();

    $scope.find('article, .card, [class*="card"], [class*="program"], [class*="item"], [class*="grid"] > div').each((_, el) => {
      const $el = $(el);
      const title = this.normalizeWhitespace(
        $el.find('h2, h3, h4, [class*="title"], [class*="heading"], [class*="name"]').first().text() ||
        $el.find('a').first().text()
      );
      if (!title || title.length < 4 || title.length > 200) return;
      if (seen.has(title.toLowerCase()) || NOISE.test(title)) return;
      seen.add(title.toLowerCase());

      const linkEl = $el.is('a') ? $el : $el.find('a[href]').first();
      const href = linkEl.attr('href') || '';
      if (/privacy|cookie|blog$|about-us\/(history|values|leadership|founders|documents)|ywam-org-jobs|ifocus|uptime/i.test(href)) return;

      const url = this.resolveUrl(href) || sourceUrl;

      const description = this.normalizeWhitespace(
        $el.find('p, [class*="description"], [class*="excerpt"]').first().text()
      ) || null;
      const location = this.normalizeWhitespace(
        $el.find('[class*="location"], [class*="country"], [class*="region"]').first().text()
      ) || null;

      opportunities.push({
        agency: this.agency,
        title,
        url,
        location,
        region: null,
        role_type: this.inferRole(title, description || ''),
        term_length: this.inferTerm(title, description || ''),
        description,
        date_posted: null,
        raw_html: $.html(el).slice(0, 2000)
      });
      count++;
    });

    return count;
  }

  addProgramEntry(opportunities, page) {
    opportunities.push({
      agency: this.agency,
      title: `YWAM — ${page.label}`,
      url: page.url,
      location: null,
      region: null,
      role_type: page.role,
      term_length: page.term,
      description: `Explore ${page.label} with YWAM. Over 600 locations worldwide. Visit ywam.org for current openings.`,
      date_posted: null,
      raw_html: null
    });
  }

  addPassionEntries(opportunities) {
    const seen = new Set(opportunities.map(o => o.title.toLowerCase()));

    for (const passion of PASSION_CATEGORIES) {
      const title = `YWAM — ${passion}`;
      if (seen.has(title.toLowerCase())) continue;

      const slug = encodeURIComponent(`Passion:${passion}`);
      opportunities.push({
        agency: this.agency,
        title,
        url: `${BASE}/search?filters[]=${slug}`,
        location: null,
        region: null,
        role_type: this.classifyPassion(passion),
        term_length: null,
        description: `Explore YWAM opportunities focused on ${passion}. Search across 600+ YWAM locations worldwide.`,
        date_posted: null,
        raw_html: null
      });
    }
  }

  classifyPassion(passion) {
    const p = passion.toLowerCase();
    if (/art|media|communication/.test(p)) return 'media/creative';
    if (/business|science|tech/.test(p)) return 'business as mission';
    if (/children|family|youth/.test(p)) return 'children/youth ministry';
    if (/counsel/.test(p)) return 'member care';
    if (/disciple/.test(p)) return 'discipleship training';
    if (/education|training/.test(p)) return 'education/TESOL';
    if (/evangel/.test(p)) return 'evangelism/discipleship';
    if (/health|medical/.test(p)) return 'medical';
    if (/intercess|worship/.test(p)) return 'prayer';
    if (/justice|mercy/.test(p)) return 'relief and development';
    if (/leader/.test(p)) return 'training/leadership';
    if (/linguis|translat/.test(p)) return 'Bible translation/linguistics';
    if (/maritime/.test(p)) return 'aviation/logistics';
    if (/sport/.test(p)) return 'sports ministry';
    return null;
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
    if (/medical|nurse|doctor|health/.test(text)) return 'medical';
    if (/teach|education|tesol|esl|school/.test(text)) return 'education/TESOL';
    if (/translat|linguist/.test(text)) return 'Bible translation/linguistics';
    if (/business|bam/.test(text)) return 'business as mission';
    if (/media|creative|video|film|photo|art|music|worship/.test(text)) return 'media/creative';
    if (/aviat|pilot|ship|mercy/.test(text)) return 'aviation/logistics';
    if (/relief|development|justice/.test(text)) return 'relief and development';
    if (/dts|discipleship training/.test(text)) return 'discipleship training';
    return null;
  }

  inferTerm(title, desc) {
    const text = `${title} ${desc}`.toLowerCase();
    if (/dts|discipleship training|short.?term|intern|summer|week|month|outreach trip/.test(text)) return 'short-term (under 2 years)';
    if (/mid.?term|2.?4 year/.test(text)) return 'mid-term (2-4 years)';
    if (/career|long.?term|staff|join staff|lifetime/.test(text)) return 'career/long-term';
    return null;
  }
}
