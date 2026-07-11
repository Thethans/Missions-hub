import IMBScraper from './imb.js';
import PioneersScraper from './pioneers.js';
import Ethnos360Scraper from './ethnos360.js';
import OMFScraper from './omf.js';
import YWAMScraper from './ywam.js';
import AIMScraper from './aim.js';
import WorldTeamScraper from './world-team.js';

export const SCRAPERS = {
  imb:        new IMBScraper(),
  pioneers:   new PioneersScraper(),
  ethnos360:  new Ethnos360Scraper(),
  omf:        new OMFScraper(),
  ywam:       new YWAMScraper(),
  aim:        new AIMScraper(),
  worldteam:  new WorldTeamScraper()
};

export const SCRAPER_KEYS = Object.keys(SCRAPERS);
