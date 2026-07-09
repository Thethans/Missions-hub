import React from 'react';

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

export default function MapDetailPanel({ selected }) {
  if (!selected) {
    return (
      <section className="map-detail map-detail--empty">
        <p>Click any point on the map to see the full profile of that people group here.</p>
      </section>
    );
  }

  const { name, country, population, pctEvangelical, religion, progressStatus } = selected;
  const statusLabel = STATUS_LABEL[progressStatus] || progressStatus;
  const statusSentence = STATUS_SENTENCE[progressStatus] || '';

  return (
    <section className="map-detail">
      <div className="map-detail-header">
        <span className={`map-detail-status-dot status-${progressStatus}`} />
        <span className="map-detail-status-label">{statusLabel}</span>
      </div>
      <h2 className="map-detail-name">{name}</h2>
      <p className="map-detail-meta">{country} · {religion}</p>

      <dl className="map-detail-stats">
        <div>
          <dt>Population</dt>
          <dd>{Number(population).toLocaleString()}</dd>
        </div>
        <div>
          <dt>Evangelical</dt>
          <dd>{pctEvangelical}%</dd>
        </div>
        <div>
          <dt>Primary religion</dt>
          <dd>{religion}</dd>
        </div>
        <div>
          <dt>Country</dt>
          <dd>{country}</dd>
        </div>
      </dl>

      <p className="map-detail-summary">
        The {name} of {country} number an estimated {Number(population).toLocaleString()} people.
        They are {statusSentence}. Their predominant religion is {religion}, and an estimated{' '}
        {pctEvangelical}% identify as evangelical Christian.
      </p>

      <p className="map-detail-source">
        Data from{' '}
        <a href="https://joshuaproject.net" target="_blank" rel="noreferrer">Joshua Project</a>.
      </p>
    </section>
  );
}
