// Post-processing stage between scrape and upsert (P1-C in
// FIELDED_PROFESSIONALIZATION_AUDIT.md). Pure functions only — no I/O, no
// Supabase calls — so this module can be unit-tested directly and reused
// unchanged by both scripts/sync-opportunities.js (every scrape) and
// scripts/backfill-sanitize.js (one-off pass over existing rows).
//
// No new npm dependencies: the near-dupe matching below is a small,
// self-contained approximation of fuzzywuzzy's token_set_ratio (Levenshtein
// + a difflib-style SequenceMatcher ratio via LCS length), not the real
// library — good enough for "is this the same listing reworded," not meant
// to be a general-purpose string-similarity utility.

// ── Contact-block stripping ─────────────────────────────────────────────

const PHONE_RE = /\(\d{3}\)\s?\d{3}[-.\s]?\d{4}|\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/g;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// Obfuscated addresses like "info [at] christar [dot] org" or "info (at) x (dot) org".
const OBFUSCATED_EMAIL_RE = /[A-Za-z0-9._%+-]+\s*[[(]\s*at\s*[\])]\s*[A-Za-z0-9.-]+\s*[[(]\s*dot\s*[\])]\s*[A-Za-z]{2,}/gi;
const PO_BOX_RE = /P\.?\s?O\.?\s*Box\s*#?\d+[,.]?/gi;
// Requires the full address shape (house number + street text + ", ST 12345")
// rather than a bare 5-digit number, so page counts/years aren't mistaken
// for a zip code.
const ADDRESS_ZIP_RE = /\b\d+\s+[A-Za-z0-9.,'\s]{3,60}?,\s*[A-Z]{2}\s*\d{5}(-\d{4})?/g;

export function stripContactBlocks(text) {
  if (!text) return text;
  let out = text;
  out = out.replace(OBFUSCATED_EMAIL_RE, '');
  out = out.replace(EMAIL_RE, '');
  out = out.replace(PHONE_RE, '');
  out = out.replace(PO_BOX_RE, '');
  out = out.replace(ADDRESS_ZIP_RE, '');
  return out
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/([,;:])(\s*[,;:])+/g, '$1')
    .trim();
}

// ── Title-in-description dedupe ─────────────────────────────────────────

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function dedupeTitleFromDescription(title, description, agency) {
  if (!description || !title) return description;
  const titlePart = escapeRegExp(title.trim());
  const agencyPart = agency ? escapeRegExp(agency.trim()) : '';
  const dash = '[—–-]';
  const pattern = agencyPart
    ? new RegExp(`^\\s*${titlePart}\\s*(?:${dash}\\s*${agencyPart}\\s*)?`, 'i')
    : new RegExp(`^\\s*${titlePart}\\s*(?:${dash}\\s*)?`, 'i');
  const result = description.replace(pattern, '').trim();
  return result.length > 0 ? result : description.trim();
}

// ── Truncation ───────────────────────────────────────────────────────────

export function truncateDescription(text, maxLen = 200) {
  if (!text) return text;
  if (text.length <= maxLen) return text;
  const slice = text.slice(0, maxLen);
  const lastSpace = slice.lastIndexOf(' ');
  const truncated = lastSpace > 40 ? slice.slice(0, lastSpace) : slice;
  return `${truncated.trim().replace(/[.,;:]+$/, '')}…`;
}

// ── Boilerplate denylist ─────────────────────────────────────────────────

const BOILERPLATE_DENYLIST = [/will be explained in detail upon inquiry/i];

export function isBoilerplate(text) {
  if (!text) return true;
  const trimmed = text.trim();
  if (trimmed.length < 20) return true;
  return BOILERPLATE_DENYLIST.some((re) => re.test(trimmed));
}

export function generateFallbackDescription(category, location) {
  const what = category ? `A ${category} opportunity` : 'An opportunity';
  const where = location ? ` based in ${location}` : '';
  return `${what}${where}. Reach out to the agency directly for full role details.`;
}

// ── Staleness guard ──────────────────────────────────────────────────────

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const STALE_DATE_RE = new RegExp(`(${MONTHS.join('|')})\\s+20(1\\d|2[0-4])`, 'i');

// Flags for review, doesn't change what's displayed — the audit is explicit
// that the stale date itself should never render on the card either way.
export function isStale(text, referenceDate = new Date()) {
  if (!text) return false;
  const match = text.match(STALE_DATE_RE);
  if (!match) return false;
  const monthIndex = MONTHS.findIndex((m) => m.toLowerCase() === match[1].toLowerCase());
  const mentioned = new Date(Number(`20${match[2]}`), monthIndex, 1);
  const twelveMonthsAgo = new Date(referenceDate);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  return mentioned < twelveMonthsAgo;
}

// ── Near-dupe collapse ───────────────────────────────────────────────────

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(title) {
  return new Set(
    normalizeTitle(title)
      .split(' ')
      .filter(Boolean)
      .map((w) => w.replace(/s$/, ''))
  );
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

function lcsLength(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    let prev = 0;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev + 1 : Math.max(dp[j], dp[j - 1]);
      prev = temp;
    }
  }
  return dp[n];
}

function difflibRatio(a, b) {
  const total = a.length + b.length;
  if (total === 0) return 100;
  return Math.round((2 * lcsLength(a, b) * 100) / total);
}

// Approximates fuzzywuzzy's token_set_ratio: split both strings into token
// sets, then compare the shared-token string against each side's full
// (shared + unique) reconstruction. When one title's tokens are a subset of
// the other's — "Church Planter" vs. "Church Planters and Church Planting
// Assistants" — this scores 100, which plain Levenshtein on the raw strings
// would badly under-score given the large length difference.
export function tokenSetRatio(a, b) {
  const t1 = tokenize(a);
  const t2 = tokenize(b);
  const intersection = [...t1].filter((w) => t2.has(w)).sort();
  const diff1 = [...t1].filter((w) => !t2.has(w)).sort();
  const diff2 = [...t2].filter((w) => !t1.has(w)).sort();

  const sortedIntersection = intersection.join(' ');
  const combined1 = [sortedIntersection, diff1.join(' ')].filter(Boolean).join(' ').trim();
  const combined2 = [sortedIntersection, diff2.join(' ')].filter(Boolean).join(' ').trim();

  return Math.max(
    difflibRatio(sortedIntersection, combined1),
    difflibRatio(sortedIntersection, combined2),
    difflibRatio(combined1, combined2)
  );
}

export function isNearDuplicateTitle(a, b) {
  const normA = normalizeTitle(a);
  const normB = normalizeTitle(b);
  return levenshtein(normA, normB) <= 3 || tokenSetRatio(a, b) >= 90;
}

// Collapses near-dupe titles within one agency to a single canonical
// record (the first-encountered variant), recording the rest in
// `merged_titles` rather than discarding them outright.
export function collapseNearDuplicates(opportunities) {
  const byAgency = new Map();
  for (const opp of opportunities) {
    if (!byAgency.has(opp.agency)) byAgency.set(opp.agency, []);
    byAgency.get(opp.agency).push(opp);
  }

  const result = [];
  for (const group of byAgency.values()) {
    const kept = [];
    for (const opp of group) {
      const match = kept.find((k) => isNearDuplicateTitle(opp.title, k.title));
      if (match) {
        match.merged_titles = [...(match.merged_titles || []), opp.title];
      } else {
        kept.push({ ...opp, merged_titles: opp.merged_titles || [] });
      }
    }
    result.push(...kept);
  }
  return result;
}

// ── Category validation ──────────────────────────────────────────────────

// Keyed by the real role_type values used across agencies.json/ROLE_TYPES —
// keeping this map in sync with new categories is a manual step, same as
// every other per-scraper inference helper (inferRegion/inferRole/inferTerm).
const CATEGORY_KEYWORDS = {
  administration: ['finance', 'financial', 'accounting', 'accountant', 'bookkeep', 'human resources', '\\bhr\\b', 'administrat', 'office manager', 'payroll', 'treasurer'],
  medical: ['nurse', 'doctor', 'physician', 'medical', 'clinic', 'health', 'dentist', 'anesthes'],
  'media/creative': ['media', 'creative', 'graphic design', 'videograph', 'photograph', 'marketing', 'content creat'],
  'education/TESOL': ['teach', 'tesol', '\\besl\\b', 'education', '\\bschool\\b', 'professor', 'academic'],
  'church planting': ['church plant', 'planter', 'pastoral', 'pastor'],
  'training/leadership': ['leadership', 'develop leaders', 'discipleship training', 'train leaders'],
  'relief and development': ['relief', 'humanitarian', 'disaster'],
  'aviation/logistics': ['aviation', '\\bpilot\\b', 'logistics', 'aircraft'],
  'Bible translation/linguistics': ['bible translation', 'translator', 'linguist']
};

function keywordScore(text, keywords) {
  return keywords.reduce((score, kw) => {
    const re = new RegExp(kw, 'i');
    return score + (re.test(text) ? 1 : 0);
  }, 0);
}

// Returns the current category unchanged unless another category's keywords
// score strictly higher against title+description — logged by the caller,
// never silently applied without a record of what changed and why.
// Title only, deliberately — a real dry-run against the live dataset showed
// description text is unsafe here: several agencies (Wycliffe in particular)
// repeat org-wide mission boilerplate ("...bringing the Bible to every
// language...") on every single listing regardless of role, which flooded
// unrelated IT/HR/admin postings into "Bible translation/linguistics" when
// description text was included. Every mis-tag the audit actually names
// (Finance Manager, HR Manager, Church/Pastoral Leadership Developers) is
// identifiable from the title alone, so this stays conservative on purpose.
export function validateCategory(title, description, currentCategory) {
  const text = title || '';
  const scores = Object.fromEntries(
    Object.entries(CATEGORY_KEYWORDS).map(([cat, kws]) => [cat, keywordScore(text, kws)])
  );
  const currentScore = scores[currentCategory] || 0;
  const [bestCategory, bestScore] = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];

  if (bestScore > 0 && bestScore > currentScore && bestCategory !== currentCategory) {
    return { category: bestCategory, reassigned: true };
  }
  return { category: currentCategory, reassigned: false };
}

// ── Pagination-artifact detection ─────────────────────────────────────────

// Catches pagination controls scraped in as if they were listings — e.g.
// "» Last", "« Prev", "Next »": a run of arrow glyphs/whitespace around at
// most one nav word, and nothing else. Real listing titles never match this
// shape (anchored full-string, so "Next Steps in Discipleship" is untouched).
const PAGINATION_ONLY_RE = /^[\s»«›‹→←]*(next|prev(?:ious)?|first|last|page\s*\d+)?[\s»«›‹→←]*$/i;

export function isPaginationArtifact(title) {
  const t = (title || '').trim();
  if (!t) return false;
  return /[»«›‹→←]/.test(t) && PAGINATION_ONLY_RE.test(t);
}

// Site-chrome link text (filter/search controls, "browse all" links) that
// broad card selectors also sweep up, but without the arrow glyphs
// isPaginationArtifact keys off — e.g. Global Partners' "Clear Filters" and
// "Show all", or a bare "Opportunities" link back to the index (also seen
// from WorldVenture). Exact whole-string match only, so a real title like
// "Opportunities in Kenya" is untouched.
const SITE_CHROME_TITLES = new Set([
  'clear filters', 'clear all filters', 'show all', 'opportunities', 'filters', 'search'
]);

export function isSiteChromeTitle(title) {
  const t = (title || '').trim().toLowerCase();
  if (!t) return false;
  return SITE_CHROME_TITLES.has(t);
}

// ── Listing-type flag ─────────────────────────────────────────────────────

const CATEGORY_PAGE_TITLE_RE = /^(serve in|explore)\b/i;

export function classifyListingType(opp) {
  const title = (opp.title || '').trim();
  // Pagination controls and site-chrome links scraped in as if they were
  // listings (e.g. Global Partners' "» Last") aren't individual openings
  // any more than the "Serve in {Country}" category pages below are — same
  // bucket, same fix, checked first since it's a cheap exact/shape match.
  if (isPaginationArtifact(title) || isSiteChromeTitle(title)) return 'category_page';
  if (CATEGORY_PAGE_TITLE_RE.test(title)) return 'category_page';
  if (opp.description && /explore mission opportunities/i.test(opp.description)) return 'category_page';
  // The audit names two Avant patterns: "Serve in {Country}" (caught above)
  // and "{Category} — Avant" — a title that literally ends in "— {the
  // agency's own name}" is a real opening's title almost never (nobody
  // titles an individual role "Accountant — ABWE"), but is exactly how
  // every one of these category/browse pages is titled.
  if (opp.agency) {
    const suffix = new RegExp(`[—–-]\\s*${escapeRegExp(opp.agency.trim())}$`, 'i');
    if (suffix.test(title)) return 'category_page';
  }
  return 'opening';
}

// ── Orchestration ─────────────────────────────────────────────────────────

// Sanitizes one opportunity. Returns the cleaned record plus (if the
// category changed) a plain-object note the caller can log — the record
// itself never carries a "why" field into the database.
export function sanitizeOpportunity(opp, referenceDate = new Date()) {
  const listing_type = classifyListingType(opp);
  // Category validation runs before the fallback-description generator so a
  // reassigned category (e.g. media/creative → administration) is what a
  // generated one-liner actually names — otherwise a boilerplate Finance
  // Manager listing would get "A media/creative opportunity..." text.
  const { category, reassigned } = validateCategory(opp.title, opp.description, opp.role_type);
  const deduped = dedupeTitleFromDescription(opp.title, opp.description, opp.agency);
  const contactStripped = stripContactBlocks(deduped);
  const stale_flag = isStale(`${opp.title} ${contactStripped || ''}`, referenceDate);
  const description_full = isBoilerplate(contactStripped)
    ? generateFallbackDescription(category, opp.location)
    : contactStripped;
  const description = truncateDescription(description_full, 200);

  return {
    opportunity: {
      ...opp,
      description,
      description_full,
      role_type: category,
      listing_type,
      stale_flag,
      merged_titles: opp.merged_titles || []
    },
    categoryReassigned: reassigned ? { agency: opp.agency, title: opp.title, from: opp.role_type, to: category } : null
  };
}

// Batch entry point used by both the scraper and the backfill script —
// sanitizes every record, then collapses near-dupe titles within each
// agency. Order matters: collapsing before sanitizing would compare
// un-cleaned (contact-block-laden) descriptions for no benefit, since only
// the title is used for near-dupe matching anyway.
export function sanitizeOpportunities(list, referenceDate = new Date()) {
  const sanitized = [];
  const categoryReassignments = [];
  for (const opp of list) {
    const { opportunity, categoryReassigned } = sanitizeOpportunity(opp, referenceDate);
    sanitized.push(opportunity);
    if (categoryReassigned) categoryReassignments.push(categoryReassigned);
  }
  return {
    opportunities: collapseNearDuplicates(sanitized),
    categoryReassignments
  };
}
