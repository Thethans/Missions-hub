import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, Question } from '@phosphor-icons/react';
import { matchLabel } from '../data/scoreAgency.js';
import RevealOnScroll from './RevealOnScroll.jsx';

export default function MatchResultCard({ result, index }) {
  const { name, tradition, focus, supportRaising, url, matchPercent, matched, concerns } = result;
  // "Worth asking about" (unconfirmed — the agency simply hasn't published
  // it) and a real conflict (they've stated something that doesn't match)
  // are different claims and read differently — grouping them under one
  // heading blurred that distinction. Split, never relabeled: same data,
  // same wording, just sorted into the group it actually belongs to.
  const conflicts = concerns.filter((c) => c.type === 'conflict');
  const unconfirmed = concerns.filter((c) => c.type === 'unconfirmed');

  return (
    <RevealOnScroll index={index} className="match-result-wrapper">
      <div className="board-card match-result-card">
        <div className="match-label-row">
          <span className="match-label">{matchLabel(matchPercent)}</span>
          {matchPercent != null && <span className="match-percent">{matchPercent}%</span>}
        </div>
        <h4>{name}</h4>
        <p>{tradition} — {focus.join(', ')}</p>
        <p><em>{supportRaising || 'Support-raising model not clearly stated on their site'}</em></p>

        {matched.length > 0 && (
          <div className="match-attributes">
            <p className="match-attributes-heading">Matched on ({matched.length})</p>
            <ul className="match-chip-list">
              {matched.map((m) => (
                <li key={m.dimension} className="match-chip match-chip--positive">
                  <CheckCircle weight="fill" size={16} /> {m.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {conflicts.length > 0 && (
          <div className="match-attributes">
            <p className="match-attributes-heading">Doesn't match ({conflicts.length})</p>
            <ul className="match-chip-list">
              {conflicts.map((c) => (
                <li key={c.dimension} className="match-chip match-chip--conflict">
                  <XCircle weight="fill" size={16} /> {c.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {unconfirmed.length > 0 && (
          <div className="match-attributes">
            <p className="match-attributes-heading">Worth asking about ({unconfirmed.length})</p>
            <ul className="match-chip-list">
              {unconfirmed.map((c) => (
                <li key={c.dimension} className="match-chip match-chip--concern">
                  <Question weight="fill" size={16} /> {c.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="match-result-links">
          <a href={url} target="_blank" rel="noreferrer">Visit site →</a>
          <Link to={`/opportunities?agency=${encodeURIComponent(name)}`}>
            View opportunities →
          </Link>
        </div>
      </div>
    </RevealOnScroll>
  );
}
