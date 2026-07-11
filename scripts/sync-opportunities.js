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
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import winston from 'winston';
import { SCRAPERS, SCRAPER_KEYS } from './lib/scrapers/index.js';
import { dedupeOpportunities } from './lib/scrapers/base.js';
import { closeBrowser } from './lib/scrapers/browser.js';

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

// ── Main ──────────────────────────────────────────────────────────────

async function run() {
  const keys = argv.all ? SCRAPER_KEYS : [argv.agency];
  const dryRun = argv.dryRun;
  let supabase = null;

  if (!dryRun) {
    try {
      supabase = await getSupabase();
    } catch (err) {
      logger.error(err.message);
      process.exit(1);
    }
  }

  logger.info(`Starting sync — agencies: ${keys.join(', ')}${dryRun ? ' (DRY RUN)' : ''}`);

  let totalScraped = 0;
  let totalUpserted = 0;
  let totalDeactivated = 0;
  let totalErrors = 0;

  for (const key of keys) {
    const scraper = SCRAPERS[key];
    logger.info(`[${key}] Scraping ${scraper.agency}...`);

    let result;
    try {
      result = await scraper.scrape();
    } catch (err) {
      logger.error(`[${key}] Scrape failed: ${err.message}`);
      totalErrors++;
      continue;
    }

    const { opportunities: rawOpps, pages = 1 } = result;
    const cleaned = filterLowQuality(rawOpps);
    const opportunities = dedupeOpportunities(cleaned);
    if (rawOpps.length !== cleaned.length) {
      logger.info(`[${key}] Filtered ${rawOpps.length - cleaned.length} low-quality entries`);
    }

    logger.info(`[${key}] Found ${opportunities.length} opportunities across ${pages} page${pages === 1 ? '' : 's'}${rawOpps.length !== opportunities.length ? ` (${rawOpps.length - opportunities.length} duplicates removed)` : ''}`);
    totalScraped += opportunities.length;

    if (dryRun) {
      for (const opp of opportunities) {
        logger.info(`  [dry] ${opp.title} — ${opp.url}`);
      }
      continue;
    }

    if (opportunities.length === 0) continue;

    // Upsert (on URL conflict, update fields)
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
      totalErrors++;
      continue;
    }

    totalUpserted += rows.length;

    // Deactivate opportunities that disappeared from the listing
    const deactivated = await deactivateStale(
      supabase,
      scraper.agency,
      opportunities.map((o) => o.url)
    );
    totalDeactivated += deactivated;
    if (deactivated > 0) {
      logger.info(`[${key}] Deactivated ${deactivated} stale opportunities`);
    }
  }

  logger.info('');
  logger.info('─── Summary ───');
  logger.info(`  Scraped:     ${totalScraped}`);
  if (!dryRun) {
    logger.info(`  Upserted:    ${totalUpserted}`);
    logger.info(`  Deactivated: ${totalDeactivated}`);
  }
  if (totalErrors > 0) {
    logger.warn(`  Errors:      ${totalErrors}`);
  }
  logger.info('Done.');

  await closeBrowser();

  if (totalErrors > 0) process.exit(1);
}

run();
