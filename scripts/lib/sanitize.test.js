import { describe, it, expect } from 'vitest';
import {
  stripContactBlocks,
  dedupeTitleFromDescription,
  truncateDescription,
  isBoilerplate,
  generateFallbackDescription,
  isStale,
  isNearDuplicateTitle,
  collapseNearDuplicates,
  validateCategory,
  classifyListingType,
  isPaginationArtifact,
  isSiteChromeTitle,
  sanitizeOpportunity,
  sanitizeOpportunities
} from './sanitize.js';

describe('stripContactBlocks', () => {
  // Real observed failure quoted in the audit: Christar cards contain raw
  // addresses, phone numbers, and emails in the description body.
  it('removes a PO Box address, phone number, and plain email', () => {
    const input = 'Serve on our team! Write to us at P.O. Box 1234, or call (972) 555-1212. Email us at info@christar.org for more.';
    const out = stripContactBlocks(input);
    expect(out).not.toMatch(/P\.?O\.?\s*Box/i);
    expect(out).not.toMatch(/\(972\)\s?555-1212/);
    expect(out).not.toMatch(/info@christar\.org/);
    expect(out).toContain('Serve on our team!');
  });

  it('removes a street address with city/state/zip', () => {
    const input = 'Our office is at 123 Main Street, Dallas, TX 75201 and we would love to hear from you.';
    const out = stripContactBlocks(input);
    expect(out).not.toMatch(/75201/);
    expect(out).toContain('we would love to hear from you');
  });

  it('removes obfuscated emails like "info [at] christar [dot] org"', () => {
    const input = 'Reach out via info [at] christar [dot] org any time.';
    const out = stripContactBlocks(input);
    expect(out).not.toMatch(/\[at\]|\[dot\]/i);
  });

  it('leaves ordinary text with unrelated numbers untouched', () => {
    const input = 'We have 5 openings across 3 countries this year.';
    expect(stripContactBlocks(input)).toBe(input);
  });
});

describe('dedupeTitleFromDescription', () => {
  // Real observed failure: Avant entries are category pages, title
  // duplicated inside the description.
  it('strips the title + agency-suffix prefix from the description', () => {
    const title = 'Serve in Albania';
    const description = 'Serve in Albania — Avant Ministries Explore mission opportunities in Albania and the wider Balkans.';
    const out = dedupeTitleFromDescription(title, description, 'Avant Ministries');
    expect(out).toBe('Explore mission opportunities in Albania and the wider Balkans.');
  });

  it('leaves a description alone when it does not start with the title', () => {
    const title = 'Accountant and Bookkeeper';
    const description = 'Support our finance team in tracking donations and expenses.';
    expect(dedupeTitleFromDescription(title, description, 'ABWE')).toBe(description);
  });

  it('falls back to the original text if stripping would leave nothing', () => {
    const title = 'Serve in Albania';
    const description = 'Serve in Albania — Avant Ministries';
    expect(dedupeTitleFromDescription(title, description, 'Avant Ministries')).toBe(description.trim());
  });
});

describe('truncateDescription', () => {
  it('leaves short descriptions untouched', () => {
    expect(truncateDescription('A short role.', 200)).toBe('A short role.');
  });

  it('truncates at a word boundary with an ellipsis around ~200 chars', () => {
    const long = 'word '.repeat(60).trim(); // 299 chars
    const out = truncateDescription(long, 200);
    expect(out.length).toBeLessThanOrEqual(201);
    expect(out.endsWith('…')).toBe(true);
    expect(out.endsWith(' …')).toBe(false);
  });
});

describe('isBoilerplate / generateFallbackDescription', () => {
  // Real observed failure: Ethnos360 boilerplate.
  it('flags the exact Ethnos360 boilerplate line', () => {
    expect(isBoilerplate('Responsibilities: Will be explained in detail upon inquiry.')).toBe(true);
  });

  it('flags empty and very short descriptions', () => {
    expect(isBoilerplate('')).toBe(true);
    expect(isBoilerplate(null)).toBe(true);
    expect(isBoilerplate('Too short')).toBe(true);
  });

  it('does not flag a normal, substantive description', () => {
    expect(isBoilerplate('Support church planting teams across Southeast Asia with logistics and hospitality.')).toBe(false);
  });

  it('generates a one-liner from category + location', () => {
    expect(generateFallbackDescription('medical', 'Kenya')).toBe(
      'A medical opportunity based in Kenya. Reach out to the agency directly for full role details.'
    );
    expect(generateFallbackDescription(null, null)).toBe(
      'An opportunity. Reach out to the agency directly for full role details.'
    );
  });
});

describe('isStale', () => {
  // Real observed failure: "beginning August 2022" on a listing seen in 2026.
  it('flags a month+year mentioned more than 12 months ago', () => {
    expect(isStale('Team begins beginning August 2022.', new Date('2026-07-16'))).toBe(true);
  });

  it('does not flag a recent month+year', () => {
    expect(isStale('Team begins March 2026.', new Date('2026-07-16'))).toBe(false);
  });

  it('does not flag text with no date at all', () => {
    expect(isStale('Ongoing opportunity, apply any time.', new Date('2026-07-16'))).toBe(false);
  });
});

describe('near-dupe title collapse', () => {
  // Real observed failure: ABWE "Church Planter" / "Church Planters" /
  // "Church Planters and Church Planting Assistants".
  it('treats plural variants as near-duplicates', () => {
    expect(isNearDuplicateTitle('Church Planter', 'Church Planters')).toBe(true);
  });

  it('treats a superset title (extra words) as a near-duplicate via token-set ratio', () => {
    expect(isNearDuplicateTitle('Church Planter', 'Church Planters and Church Planting Assistants')).toBe(true);
  });

  it('does not treat unrelated titles as near-duplicates', () => {
    expect(isNearDuplicateTitle('Church Planter', 'Nurse Practitioner')).toBe(false);
  });

  it('collapses all three ABWE variants into one canonical record with merged_titles', () => {
    const input = [
      { agency: 'ABWE', title: 'Church Planter', description: 'a' },
      { agency: 'ABWE', title: 'Church Planters', description: 'b' },
      { agency: 'ABWE', title: 'Church Planters and Church Planting Assistants', description: 'c' },
      { agency: 'ABWE', title: 'Accountant', description: 'd' }
    ];
    const result = collapseNearDuplicates(input);
    expect(result).toHaveLength(2);
    const planter = result.find((o) => o.title === 'Church Planter');
    expect(planter.merged_titles).toEqual([
      'Church Planters',
      'Church Planters and Church Planting Assistants'
    ]);
  });

  it('does not collapse the same title across different agencies', () => {
    const input = [
      { agency: 'ABWE', title: 'Accountant', description: 'a' },
      { agency: 'SIM', title: 'Accountant', description: 'b' }
    ];
    expect(collapseNearDuplicates(input)).toHaveLength(2);
  });
});

describe('validateCategory', () => {
  // Real observed failures: Finance/HR mis-tagged as media/creative.
  it('reassigns a Finance Manager mis-tagged as media/creative to administration', () => {
    const { category, reassigned } = validateCategory('Finance Manager', null, 'media/creative');
    expect(reassigned).toBe(true);
    expect(category).toBe('administration');
  });

  it('reassigns an HR Manager mis-tagged as media/creative to administration', () => {
    const { category, reassigned } = validateCategory('HR Manager', null, 'media/creative');
    expect(reassigned).toBe(true);
    expect(category).toBe('administration');
  });

  it('reassigns ABWE "Church/Pastoral Leadership Developers" away from technology', () => {
    const { category, reassigned } = validateCategory('Church/Pastoral Leadership Developers', null, 'technology');
    expect(reassigned).toBe(true);
    expect(category).not.toBe('technology');
  });

  it('leaves a correctly-tagged category alone', () => {
    const { category, reassigned } = validateCategory('Registered Nurse', 'Clinical role in a rural hospital.', 'medical');
    expect(reassigned).toBe(false);
    expect(category).toBe('medical');
  });

  it('leaves the category alone when no keyword scores higher', () => {
    const { reassigned } = validateCategory('Mystery Role', 'Nothing distinctive here.', 'administration');
    expect(reassigned).toBe(false);
  });
});

describe('isPaginationArtifact', () => {
  // Real observed failure: Global Partners' "Last" pagination link was
  // scraped in as if it were a job listing, titled "» Last".
  it('flags pagination controls scraped as listings', () => {
    expect(isPaginationArtifact('» Last')).toBe(true);
    expect(isPaginationArtifact('« Prev')).toBe(true);
    expect(isPaginationArtifact('Next »')).toBe(true);
    expect(isPaginationArtifact('«')).toBe(true);
    expect(isPaginationArtifact('» Page 3')).toBe(true);
  });

  it('does not flag real listing titles that happen to contain nav words', () => {
    expect(isPaginationArtifact('Next Steps in Discipleship')).toBe(false);
    expect(isPaginationArtifact('Last Frontier Ministries')).toBe(false);
    expect(isPaginationArtifact('Church Planting Opportunity')).toBe(false);
  });

  it('does not flag titles with no arrow glyphs', () => {
    expect(isPaginationArtifact('Last')).toBe(false);
    expect(isPaginationArtifact('')).toBe(false);
    expect(isPaginationArtifact(null)).toBe(false);
  });
});

describe('isSiteChromeTitle', () => {
  // Real observed failures: Global Partners' "Clear Filters" and "Show all"
  // controls, and a bare "Opportunities" index link (also seen from
  // WorldVenture), scraped in as if they were job listings.
  it('flags known site-chrome link text', () => {
    expect(isSiteChromeTitle('Clear Filters')).toBe(true);
    expect(isSiteChromeTitle('Show all')).toBe(true);
    expect(isSiteChromeTitle('Opportunities')).toBe(true);
    expect(isSiteChromeTitle('Filters')).toBe(true);
  });

  it('does not flag real listing titles that merely contain those words', () => {
    expect(isSiteChromeTitle('Opportunities in Kenya')).toBe(false);
    expect(isSiteChromeTitle('Show all your Support to the Team')).toBe(false);
  });

  it('handles empty input', () => {
    expect(isSiteChromeTitle('')).toBe(false);
    expect(isSiteChromeTitle(null)).toBe(false);
  });
});

describe('classifyListingType', () => {
  // Real observed failure: the pagination/site-chrome bug above should be
  // excluded from the results grid the same way category pages are — the
  // component filters on listing_type !== 'category_page'.
  it('flags pagination artifacts and site-chrome titles as category pages', () => {
    expect(classifyListingType({ title: '» Last', description: null })).toBe('category_page');
    expect(classifyListingType({ title: 'Clear Filters', description: null })).toBe('category_page');
    expect(classifyListingType({ title: 'Show all', description: null })).toBe('category_page');
    expect(classifyListingType({ title: 'Opportunities', description: null })).toBe('category_page');
  });

  // Real observed failure: Avant "Serve in {Country}" pages are category
  // pages, not individual openings.
  it('flags "Serve in {Country}" titles as category pages', () => {
    expect(classifyListingType({ title: 'Serve in Albania', description: '' })).toBe('category_page');
  });

  it('flags descriptions containing the Avant category-page tell', () => {
    expect(classifyListingType({
      title: 'Administration & Support — Avant Ministries',
      description: 'Explore mission opportunities in Albania and the wider Balkans.'
    })).toBe('category_page');
  });

  it('classifies an ordinary opening as opening', () => {
    expect(classifyListingType({ title: 'Accountant and Bookkeeper', description: 'Support our finance team.' })).toBe('opening');
  });

  // Real observed failure quoted in the audit: "'{Category} — Avant' pages
  // get category_page" — a distinct pattern from "Serve in {Country}",
  // caught by a title literally ending in "— {the listing's own agency}"
  // (a real individual opening is essentially never titled that way).
  it('flags a "{Category} — {Agency}" title with no category-page description tell', () => {
    expect(classifyListingType({
      agency: 'Avant Ministries',
      title: 'Administration & Support — Avant Ministries',
      description: null
    })).toBe('category_page');
  });

  it('flags the same pattern for a different agency (not hardcoded to Avant)', () => {
    expect(classifyListingType({
      agency: 'Serge',
      title: 'Types of Work — Serge',
      description: null
    })).toBe('category_page');
  });

  it('does not flag a title that merely contains the agency name mid-string', () => {
    expect(classifyListingType({
      agency: 'Serge',
      title: 'Serge Medical Missions Coordinator',
      description: 'A real individual role.'
    })).toBe('opening');
  });
});

describe('sanitizeOpportunity (full pipeline, one record)', () => {
  it('cleans contact info, dedupes the title, and truncates in one pass', () => {
    const opp = {
      agency: 'Christar',
      title: 'Supporting the Team: Philippines',
      description: 'Supporting the Team: Philippines — Christar Help staff our regional office. Write us at P.O. Box 500, call (214) 555-9876, or email info@christar.org for details.',
      role_type: 'administration',
      location: 'Philippines'
    };
    const { opportunity } = sanitizeOpportunity(opp, new Date('2026-07-16'));
    expect(opportunity.description).not.toMatch(/P\.?O\.?\s*Box|christar\.org|\(214\)/i);
    expect(opportunity.description_full).not.toMatch(/P\.?O\.?\s*Box|christar\.org|\(214\)/i);
    expect(opportunity.listing_type).toBe('opening');
    expect(opportunity.stale_flag).toBe(false);
  });

  it('replaces boilerplate with a generated one-liner', () => {
    const opp = {
      agency: 'Ethnos360',
      title: 'Finance Manager',
      description: 'Responsibilities: Will be explained in detail upon inquiry.',
      role_type: 'media/creative',
      location: 'North Carolina'
    };
    const { opportunity, categoryReassigned } = sanitizeOpportunity(opp, new Date('2026-07-16'));
    expect(opportunity.description).toBe(
      'A administration opportunity based in North Carolina. Reach out to the agency directly for full role details.'
    );
    expect(opportunity.role_type).toBe('administration');
    expect(categoryReassigned).toEqual({ agency: 'Ethnos360', title: 'Finance Manager', from: 'media/creative', to: 'administration' });
  });

  it('flags a listing mentioning a date over 12 months old', () => {
    const opp = {
      agency: 'Christar',
      title: 'Team Opening',
      description: 'Team beginning August 2022, come join us on the field for the long haul ahead.',
      role_type: 'church planting',
      location: null
    };
    const { opportunity } = sanitizeOpportunity(opp, new Date('2026-07-16'));
    expect(opportunity.stale_flag).toBe(true);
  });
});

describe('sanitizeOpportunities (batch pipeline)', () => {
  it('sanitizes every record and collapses near-dupes within an agency', () => {
    const input = [
      { agency: 'ABWE', title: 'Church Planter', description: 'Plant churches among unreached peoples in West Africa.', role_type: 'church planting', location: 'West Africa' },
      { agency: 'ABWE', title: 'Church Planters', description: 'Plant churches among unreached peoples in West Africa.', role_type: 'church planting', location: 'West Africa' },
      { agency: 'Avant Ministries', title: 'Serve in Albania', description: 'Serve in Albania — Avant Ministries Explore mission opportunities in Albania.', role_type: 'administration', location: 'Albania' }
    ];
    const { opportunities, categoryReassignments } = sanitizeOpportunities(input, new Date('2026-07-16'));

    expect(opportunities).toHaveLength(2);
    expect(categoryReassignments).toEqual([]);

    const avant = opportunities.find((o) => o.agency === 'Avant Ministries');
    expect(avant.listing_type).toBe('category_page');
    expect(avant.description_full).toBe('Explore mission opportunities in Albania.');

    const abwe = opportunities.find((o) => o.agency === 'ABWE');
    expect(abwe.merged_titles).toEqual(['Church Planters']);
  });
});
