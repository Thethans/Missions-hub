import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Question } from '@phosphor-icons/react';
import { matchLabel } from '../data/scoreAgency.js';
import RevealOnScroll from './RevealOnScroll.jsx';

export default function MatchResultCard({ result, index }) {
  const { name, tradition, focus, supportRaising, url, score, matched, concerns } = result;

  return (
    <RevealOnScroll index={index} className="match-result-wrapper">
      <div className="board-card match-result-card">
        <span className="match-label">{matchLabel(score)}</span>
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

        {concerns.length > 0 && (
          <div className="match-attributes">
            <p className="match-attributes-heading">Worth asking about ({concerns.length})</p>
            <ul className="match-chip-list">
              {concerns.map((c) => (
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
