import IMBScraper from './imb.js';
import PioneersScraper from './pioneers.js';
import Ethnos360Scraper from './ethnos360.js';
import OMFScraper from './omf.js';
import YWAMScraper from './ywam.js';
import AIMScraper from './aim.js';
import WorldTeamScraper from './world-team.js';
import WycliffeScraper from './wycliffe.js';
import ABWEScraper from './abwe.js';
import SIMScraper from './sim.js';
import MTWScraper from './mtw.js';
import TEAMScraper from './team.js';
import CrossworldScraper from './crossworld.js';
import ChristarScraper from './christar.js';
import CruScraper from './cru.js';
import WorldVentureScraper from './worldventure.js';
import ReachGlobalScraper from './reachglobal.js';
import ReachBeyondScraper from './reachbeyond.js';
import GlobalPartnersScraper from './globalpartners.js';
import GEMScraper from './gem.js';
import InterserveScraper from './interserve.js';

export const SCRAPERS = {
  imb:            new IMBScraper(),
  pioneers:       new PioneersScraper(),
  ethnos360:      new Ethnos360Scraper(),
  omf:            new OMFScraper(),
  ywam:           new YWAMScraper(),
  aim:            new AIMScraper(),
  worldteam:      new WorldTeamScraper(),
  wycliffe:       new WycliffeScraper(),
  abwe:           new ABWEScraper(),
  sim:            new SIMScraper(),
  mtw:            new MTWScraper(),
  team:           new TEAMScraper(),
  crossworld:     new CrossworldScraper(),
  christar:       new ChristarScraper(),
  cru:            new CruScraper(),
  worldventure:   new WorldVentureScraper(),
  reachglobal:    new ReachGlobalScraper(),
  reachbeyond:    new ReachBeyondScraper(),
  globalpartners: new GlobalPartnersScraper(),
  gem:            new GEMScraper(),
  interserve:     new InterserveScraper(),
};

export const SCRAPER_KEYS = Object.keys(SCRAPERS);

export const BROWSER_SCRAPERS = new Set([
  'imb', 'pioneers', 'ywam', 'worldventure', 'reachglobal',
]);
