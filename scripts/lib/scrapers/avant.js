import { BaseScraper } from './base.js';

const BASE = 'https://www.avantministries.org';

const REGIONS = [
  { name: 'North Africa & Middle East', region: 'Middle East / North Africa', countries: ['Morocco', 'Tunisia', 'Egypt', 'Jordan', 'Lebanon', 'Iraq'] },
  { name: 'West Africa', region: 'Sub-Saharan Africa', countries: ['Senegal', 'Mali', 'Guinea', 'Ivory Coast', 'Burkina Faso'] },
  { name: 'East Africa', region: 'Sub-Saharan Africa', countries: ['Kenya', 'Ethiopia', 'Tanzania'] },
  { name: 'Southern Africa', region: 'Sub-Saharan Africa', countries: ['Mozambique', 'South Africa'] },
  { name: 'South Asia', region: 'South Asia', countries: ['India', 'Nepal', 'Bangladesh'] },
  { name: 'Southeast Asia', region: 'Southeast Asia', countries: ['Thailand', 'Cambodia', 'Philippines', 'Indonesia'] },
  { name: 'East Asia', region: 'East Asia', countries: ['Japan', 'China', 'Taiwan'] },
  { name: 'Central Asia', region: 'Central Asia', countries: ['Kazakhstan', 'Uzbekistan', 'Tajikistan'] },
  { name: 'Europe', region: 'Europe', countries: ['Spain', 'France', 'Italy', 'Germany', 'Albania', 'Bosnia'] },
  { name: 'Latin America', region: 'Latin America', countries: ['Mexico', 'Colombia', 'Brazil', 'Ecuador', 'Peru', 'Bolivia'] },
];

const MINISTRY_TYPES = [
  { title: 'Church Planting', role: 'church planting' },
  { title: 'Bible Translation & Linguistics', role: 'Bible translation/linguistics' },
  { title: 'Education & TESOL', role: 'education/TESOL' },
  { title: 'Medical Missions', role: 'medical' },
  { title: 'Community Development', role: 'relief and development' },
  { title: 'Business as Mission', role: 'business as mission' },
  { title: 'Media & Communications', role: 'media/creative' },
  { title: 'Leadership Training', role: 'training/leadership' },
  { title: 'Youth & Children Ministry', role: 'children/youth ministry' },
  { title: 'Evangelism & Discipleship', role: 'evangelism/discipleship' },
  { title: 'Administration & Support', role: 'administration' },
  { title: 'Member Care & Counseling', role: 'member care' },
];

const TERMS = [
  { title: 'Short-Term Mission Trips', term: 'short-term (under 2 years)', slug: 'short-term' },
  { title: 'Mid-Term Service (1-3 years)', term: 'mid-term (2-4 years)', slug: 'mid-term' },
  { title: 'Career Missionaries', term: 'career/long-term', slug: 'career' },
  { title: 'Internships', term: 'short-term (under 2 years)', slug: 'internships' },
];

export default class AvantScraper extends BaseScraper {
  constructor() {
    super('Avant Ministries', BASE);
  }

  async scrape() {
    const opportunities = [];

    for (const region of REGIONS) {
      for (const country of region.countries) {
        const slug = country.toLowerCase().replace(/\s+/g, '-');
        opportunities.push({
          agency: this.agency,
          title: `Serve in ${country} — Avant Ministries`,
          url: `${BASE}/where-we-serve#${slug}`,
          location: country,
          region: region.region,
          role_type: null,
          term_length: null,
          description: `Explore mission opportunities in ${country} (${region.name}) with Avant Ministries. Avant has been reaching the unreached since the 19th century.`,
          date_posted: null,
          raw_html: null,
        });
      }
    }

    for (const ministry of MINISTRY_TYPES) {
      const slug = ministry.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      opportunities.push({
        agency: this.agency,
        title: `${ministry.title} — Avant Ministries`,
        url: `${BASE}/how-we-serve#${slug}`,
        location: null,
        region: null,
        role_type: ministry.role,
        term_length: null,
        description: `${ministry.title} opportunities with Avant Ministries across Africa, Asia, Europe, and Latin America.`,
        date_posted: null,
        raw_html: null,
      });
    }

    for (const t of TERMS) {
      opportunities.push({
        agency: this.agency,
        title: `${t.title} — Avant Ministries`,
        url: `${BASE}/opportunities#${t.slug}`,
        location: null,
        region: null,
        role_type: null,
        term_length: t.term,
        description: `Browse ${t.title.toLowerCase()} with Avant Ministries.`,
        date_posted: null,
        raw_html: null,
      });
    }

    console.log(`Avant: ${opportunities.length} total (curated entries)`);
    return { opportunities, pages: 1 };
  }
}
