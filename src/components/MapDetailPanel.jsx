import React from 'react';
import { formatPopulation } from '../lib/format.js';

const STATUS_LABEL = {
  unreached: 'Unreached',
  formative: 'Formative',
  reached: 'Reached'
};

const STATUS_SENTENCE = {
  unreached: 'considered unreached — there is little to no access to the gospel in their own language and culture',
  formative: 'in a formative stage — an evangelical presence exists but is not yet self-sustaining',
  reached: 'considered reached — an established, self-sustaining evangelical presence exists among them'
};

// Factual engagement prompts, not statistics — safe to show alongside the data.
const STATUS_ENGAGEMENT = {
  unreached:
    'With little to no access to the gospel in their heart language, they are among the peoples the Great Commission has yet to reach. Pray for laborers, for Scripture in their own language, and for the first lasting churches among them.',
  formative:
    'A gospel presence has begun here, but it is young and not yet self-sustaining. Pray for it to take root, mature, and grow strong enough to reach the rest of the community on its own.',
  reached:
    'An established, self-sustaining church exists among them. Pray for it to keep growing in depth and to send workers of its own to peoples still waiting to hear.'
};

// Progress toward a self-sustaining evangelical presence. Joshua Project's
// thresholds: ≥2% evangelical = formative, ≥5% = reached. The meter shows how
// far a group sits along that same scale.
const FORMATIVE_THRESHOLD = 2;
const REACHED_THRESHOLD = 5;

export default function MapDetailPanel({ selected, featured, onExploreFeatured }) {
  if (!selected) {
    // No photo block here — Joshua Project's feed doesn't include one, and
    // showing a stock/placeholder image next to a specific people group's
    // name would read as a real photo of them (CLAUDE.md: never fabricate).
    // The stat block below only uses fields the data actually has.
    if (featured) {
      const statusLabel = STATUS_LABEL[featured.progressStatus] || featured.progressStatus;
      return (
        <section className="map-detail map-detail--empty">
          <p className="map-detail-featured-kicker">This week's featured people group</p>
          <div className="map-detail-featured">
            <div className="map-detail-header">
              <span className={`map-detail-status-dot status-${featured.progressStatus}`} />
              <span className="map-detail-status-label">{statusLabel} people group</span>
            </div>
            <h2 className="map-detail-name">{featured.name}</h2>
            <p className="map-detail-meta">{featured.country} · {featured.religion}</p>
            <dl className="map-detail-stats">
              <div>
                <dt>Total population</dt>
                <dd>{formatPopulation(featured.population)}</dd>
              </div>
              <div>
                <dt>Evangelical presence</dt>
                <dd>{featured.pctEvangelical}%</dd>
              </div>
            </dl>
            <button type="button" className="cta-button" onClick={() => onExploreFeatured?.(featured)}>
              Explore on the map &rarr;
            </button>
          </div>
        </section>
      );
    }
    return (
      <section className="map-detail map-detail--empty">
        <p>Click any point on the map to see the full profile of that people group here.</p>
      </section>
    );
  }

  const {
    name,
    country,
    population,
    pctEvangelical,
    religion,
    progressStatus,
    coordinates,
    // Optional richer fields — shown only when present in the data, so the
    // panel gains detail automatically the next time the dataset is refreshed
    // with them (see scripts/fetch-joshua-project.mjs).
    language,
    bibleStatus,
    pctChristian
  } = selected;

  const statusLabel = STATUS_LABEL[progressStatus] || progressStatus;
  const statusSentence = STATUS_SENTENCE[progressStatus] || '';
  const engagement = STATUS_ENGAGEMENT[progressStatus] || '';

  // Honest derivations from the fields we already have. Turning the bare
  // percentages into head-counts (out of this group's own population) is what
  // makes them intuitive: "~18 evangelical Christians" reads far more clearly
  // than "1.5%".
  const meterFill = Math.max(0, Math.min(100, (pctEvangelical / REACHED_THRESHOLD) * 100));
  const evangelicalCount = Math.round(population * (pctEvangelical || 0) / 100);
  const christianCount = pctChristian != null ? Math.round(population * pctChristian / 100) : null;
  const withoutEvangelical = Math.max(0, population - evangelicalCount);

  const lat = Array.isArray(coordinates) ? coordinates[1] : null;
  const lon = Array.isArray(coordinates) ? coordinates[0] : null;
  // The 10/40 Window is the latitude band (10°N–40°N) holding most of the
  // world's least-reached peoples — a real geographic classification, derived
  // here straight from the point's own coordinates.
  const inWindow = lat != null ? lat >= 10 && lat <= 40 : null;
  const formatCoord = (v, pos, neg) => `${Math.abs(v).toFixed(1)}° ${v >= 0 ? pos : neg}`;

  return (
    <section className="map-detail">
      <div className="map-detail-header">
        <span className={`map-detail-status-dot status-${progressStatus}`} />
        <span className="map-detail-status-label">{statusLabel} people group</span>
      </div>
      <h2 className="map-detail-name">{name}</h2>
      <p className="map-detail-meta">{country} · {religion}</p>

      {/* Progress-to-reached meter */}
      <div className="map-detail-meter" aria-hidden="true">
        <div className="map-detail-meter-head">
          <span>Evangelical presence</span>
          <span className="map-detail-meter-value">{pctEvangelical}%</span>
        </div>
        <div className={`map-detail-meter-track status-${progressStatus}`}>
          <div className="map-detail-meter-fill" style={{ width: `${meterFill}%` }} />
          <span
            className="map-detail-meter-mark"
            style={{ left: `${(FORMATIVE_THRESHOLD / REACHED_THRESHOLD) * 100}%` }}
          />
        </div>
        <div className="map-detail-meter-scale">
          <span>0%</span>
          <span>Formative · {FORMATIVE_THRESHOLD}%</span>
          <span>Reached · {REACHED_THRESHOLD}%</span>
        </div>
        <p className="map-detail-meter-note">
          The share of this people group who are evangelical Christians. On Joshua Project’s
          scale, under {FORMATIVE_THRESHOLD}% is unreached, {FORMATIVE_THRESHOLD}%+ marks a
          formative presence, and {REACHED_THRESHOLD}%+ a self-sustaining (reached) church.
        </p>
      </div>

      <dl className="map-detail-stats">
        <div>
          <dt>Total population</dt>
          <dd>{formatPopulation(population)}</dd>
        </div>
        <div>
          <dt>Evangelical Christians</dt>
          <dd>~{formatPopulation(evangelicalCount)} <span className="map-detail-stat-sub">({pctEvangelical}%)</span></dd>
        </div>
        {christianCount != null && (
          <div>
            <dt>Christians of any kind</dt>
            <dd>~{formatPopulation(christianCount)} <span className="map-detail-stat-sub">({pctChristian}%)</span></dd>
          </div>
        )}
        {language && (
          <div>
            <dt>Primary language</dt>
            <dd>{language}</dd>
          </div>
        )}
        {bibleStatus && (
          <div>
            <dt>Scripture access</dt>
            <dd>{bibleStatus}</dd>
          </div>
        )}
        {inWindow != null && (
          <div>
            <dt>10/40 Window</dt>
            <dd>{inWindow ? 'Within' : 'Outside'}</dd>
          </div>
        )}
        {lat != null && (
          <div>
            <dt>Coordinates</dt>
            <dd>{formatCoord(lat, 'N', 'S')}, {formatCoord(lon, 'E', 'W')}</dd>
          </div>
        )}
      </dl>

      <div className="map-detail-callout">
        <span className="map-detail-callout-figure">{formatPopulation(withoutEvangelical)}</span>
        <span className="map-detail-callout-label">
          people here are estimated to be without an evangelical Christian community
        </span>
      </div>

      <p className="map-detail-summary">
        The {name} of {country} number an estimated {formatPopulation(population)} people.
        They are {statusSentence}. Their predominant religion is {religion}, and an estimated{' '}
        {pctEvangelical}% identify as evangelical Christian.
      </p>

      <div className="map-detail-insight">
        <h3>What “{statusLabel}” means here</h3>
        <p>{engagement}</p>
      </div>

      <p className="map-detail-source">
        Data from{' '}
        <a href="https://joshuaproject.net" target="_blank" rel="noreferrer">Joshua Project</a>.
        Population without an evangelical community and 10/40 Window placement are derived from these figures.
      </p>
    </section>
  );
}
