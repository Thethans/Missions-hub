#!/usr/bin/env node

// Scrapes mission opportunities from agency websites and upserts them into
// Supabase. Designed to run weekly via GitHub Actions or manually from CLI.
//
// Usage:
//   node scripts/sync-opportunities.js --all              # scrape all agencies
//   node scripts/sync-opportunities.js --agency imb       # single agency
//   node scripts/sync-opportunities.js --all --dryRun     # preview without writing
//   node scripts/sync-opportunities.js --all --force      # re-scrape even if recent

import 'dotenv/config';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import winston from 'winston';
import { SCRAPERS, SCRAPER_KEYS, BROWSER_SCRAPERS } from './lib/scrapers/index.js';
import { dedupeOpportunities } from './lib/scrapers/base.js';
import { closeBrowser } from './lib/scrapers/browser.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = join(__dirname, '.scraper-cache.json');
const FRESHNESS_HOURS = 24;
const STATIC_CONCURRENCY = 6;
const BROWSER_CONCURRENCY = 2;

// ── Logger ────────────────────────────────────────────────────────────

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) =>
      `${timestamp} [${level.toUpperCase().padEnd(5)}] ${message}`
    )
  ),
  transports: [new winston.transports.Console()]
});

// ── CLI ───────────────────────────────────────────────────────────────

const argv = yargs(hideBin(process.argv))
  .usage('$0 [options]')
  .option('all', {
    type: 'boolean',
    description: 'Scrape all agencies'
  })
  .option('agency', {
    type: 'string',
    description: `Scrape one agency (${SCRAPER_KEYS.join(', ')})`,
    choices: SCRAPER_KEYS
  })
  .option('dryRun', {
    type: 'boolean',
    default: false,
    description: 'Scrape but don\'t write to Supabase'
  })
  .option('force', {
    type: 'boolean',
    default: false,
    description: 'Scrape even if data was recently refreshed'
  })
  .check((args) => {
    if (!args.all && !args.agency) {
      throw new Error('Specify --all or --agency <name>');
    }
    return true;
  })
  .strict()
  .help()
  .parse();

// ── Freshness cache ──────────────────────────────────────────────────

function loadCache() {
  try {
    return JSON.parse(readFileSync(CACHE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  mkdirSync(dirname(CACHE_PATH), { recursive: true });
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

function isFresh(cache, key) {
  const entry = cache[key];
  if (!entry) return false;
  const age = (Date.now() - entry.ts) / (1000 * 60 * 60);
  return age < FRESHNESS_HOURS;
}

// ── Supabase (lazy — skipped in dry-run if env vars missing) ──────────

async function getSupabase() {
  const { supabase } = await import('./lib/supabase-client.js');
  return supabase;
}

// ── Deactivate stale opportunities ────────────────────────────────────

async function deactivateStale(supabase, agency, freshUrls) {
  const { data: existing } = await supabase
    .from('opportunities')
    .select('id, url')
    .eq('agency', agency)
    .eq('active', true);

  if (!existing || existing.length === 0) return 0;

  const freshSet = new Set(freshUrls);
  const staleIds = existing.filter((r) => !freshSet.has(r.url)).map((r) => r.id);

  if (staleIds.length === 0) return 0;

  await supabase
    .from('opportunities')
    .update({ active: false })
    .in('id', staleIds);

  return staleIds.length;
}

// ── Quality filter ───────────────────────────────────────────────────

const NAV_JUNK = /^(home|about|contact|contact us|menu|search|filter|nav|close|open|clear|donate|give|login|sign|subscribe|privacy|terms|cookie|sitemap|thank you!?|thank you|read more|learn more|view more|get started|apply now|submit)$/i;

function filterLowQuality(opps) {
  return opps.filter(opp => {
    const t = (opp.title || '').trim();
    if (t.length < 6) return false;
    if (t.length > 200) return false;
    if (NAV_JUNK.test(t)) return false;
    if (/^filters?$/i.test(t)) return false;
    if (/^(respond to|pursue |know god|be activated|make him)/.test(t.toLowerCase())) return false;
    if (!opp.url || opp.url.endsWith('#')) return false;
    if (/\/(pray|give|donate|about|contact|privacy|terms)\/?$/.test(opp.url)) return false;
    return true;
  });
}

// ── Concurrency pool ─────────────────────────────────────────────────

async function runPool(tasks, concurrency) {
  const results = [];
  let i = 0;

  async function worker() {
    while (i < tasks.length) {
      const idx = i++;
      results[idx] = await tasks[idx]();
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// ── Scrape one agency ────────────────────────────────────────────────

async function scrapeOne(key, supabase, dryRun, cache) {
  const scraper = SCRAPERS[key];
  const t0 = Date.now();
  logger.info(`[${key}] Scraping ${scraper.agency}…`);

  let result;
  try {
    result = await scraper.scrape();
  } catch (err) {
    logger.error(`[${key}] Scrape failed: ${err.message}`);
    return { key, error: true, scraped: 0, upserted: 0, deactivated: 0 };
  }

  const { opportunities: rawOpps, pages = 1 } = result;
  const cleaned = filterLowQuality(rawOpps);
  const opportunities = dedupeOpportunities(cleaned);
  if (rawOpps.length !== cleaned.length) {
    logger.info(`[${key}] Filtered ${rawOpps.length - cleaned.length} low-quality entries`);
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  logger.info(`[${key}] Found ${opportunities.length} opportunities across ${pages} page${pages === 1 ? '' : 's'} in ${elapsed}s`);

  cache[key] = { ts: Date.now(), count: opportunities.length };

  if (dryRun) {
    for (const opp of opportunities) {
      logger.info(`  [dry] ${opp.title} — ${opp.url}`);
    }
    return { key, error: false, scraped: opportunities.length, upserted: 0, deactivated: 0 };
  }

  if (opportunities.length === 0) {
    return { key, error: false, scraped: 0, upserted: 0, deactivated: 0 };
  }

  const rows = opportunities.map((opp) => ({
    ...opp,
    scraped_at: new Date().toISOString(),
    active: true
  }));

  const { error } = await supabase
    .from('opportunities')
    .upsert(rows, { onConflict: 'url', ignoreDuplicates: false });

  if (error) {
    logger.error(`[${key}] Supabase upsert error: ${error.message}`);
    return { key, error: true, scraped: opportunities.length, upserted: 0, deactivated: 0 };
  }

  const deactivated = await deactivateStale(
    supabase,
    scraper.agency,
    opportunities.map((o) => o.url)
  );
  if (deactivated > 0) {
    logger.info(`[${key}] Deactivated ${deactivated} stale opportunities`);
  }

  return { key, error: false, scraped: opportunities.length, upserted: rows.length, deactivated };
}

// ── Main ──────────────────────────────────────────────────────────────

async function run() {
  const keys = argv.all ? SCRAPER_KEYS : [argv.agency];
  const dryRun = argv.dryRun;
  const force = argv.force;
  let supabase = null;

  if (!dryRun) {
    try {
      supabase = await getSupabase();
    } catch (err) {
      logger.error(err.message);
      process.exit(1);
    }
  }

  const cache = loadCache();

  const toRun = keys.filter(key => {
    if (force) return true;
    if (isFresh(cache, key)) {
      logger.info(`[${key}] Skipping — scraped ${((Date.now() - cache[key].ts) / (1000 * 60 * 60)).toFixed(1)}h ago (${cache[key].count} opps). Use --force to override.`);
      return false;
    }
    return true;
  });

  if (toRun.length === 0) {
    logger.info('All agencies are fresh. Nothing to do.');
    return;
  }

  const staticKeys = toRun.filter(k => !BROWSER_SCRAPERS.has(k));
  const browserKeys = toRun.filter(k => BROWSER_SCRAPERS.has(k));

  logger.info(`Starting sync — ${staticKeys.length} static + ${browserKeys.length} browser scrapers${dryRun ? ' (DRY RUN)' : ''}`);
  const t0 = Date.now();

  const staticTasks = staticKeys.map(key => () => scrapeOne(key, supabase, dryRun, cache));
  const browserTasks = browserKeys.map(key => () => scrapeOne(key, supabase, dryRun, cache));

  const [staticResults, browserResults] = await Promise.all([
    runPool(staticTasks, STATIC_CONCURRENCY),
    runPool(browserTasks, BROWSER_CONCURRENCY),
  ]);

  const allResults = [...staticResults, ...browserResults];

  saveCache(cache);

  const totalScraped = allResults.reduce((s, r) => s + r.scraped, 0);
  const totalUpserted = allResults.reduce((s, r) => s + r.upserted, 0);
  const totalDeactivated = allResults.reduce((s, r) => s + r.deactivated, 0);
  const totalErrors = allResults.filter(r => r.error).length;
  const totalElapsed = ((Date.now() - t0) / 1000).toFixed(1);

  logger.info('');
  logger.info('─── Summary ───');
  logger.info(`  Scraped:     ${totalScraped} opportunities`);
  if (!dryRun) {
    logger.info(`  Upserted:    ${totalUpserted}`);
    logger.info(`  Deactivated: ${totalDeactivated}`);
  }
  logger.info(`  Skipped:     ${keys.length - toRun.length} (fresh)`);
  logger.info(`  Time:        ${totalElapsed}s`);
  if (totalErrors > 0) {
    logger.warn(`  Errors:      ${totalErrors}`);
  }
  logger.info('Done.');

  await closeBrowser();

  if (totalErrors > 0) process.exit(1);
}

run();
