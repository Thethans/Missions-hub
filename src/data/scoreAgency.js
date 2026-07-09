import { DIMENSIONS, NEUTRAL_VALUES } from './quizQuestions.js';

// Evaluates one agency against the user's answers. Returns the agency plus a
// score and two explanation lists — `matched` (why it ranked well) and
// `concerns` (either a real conflict, or a dimension the agency's public
// materials simply don't confirm). Unconfirmed fields are NEVER scored in
// either direction and are NEVER phrased as a negative — only as an open
// question worth asking the agency directly.
//
// Multi-select questions (dim.multi) store the answer as an array of chosen
// values. A dimension counts as "matched" if ANY chosen value matches the
// agency (reuses the same per-value `compare` used by single-select
// dimensions, so the region wildcard logic etc. isn't duplicated) — a
// conflict is only surfaced when NONE of the chosen values match, so partial
// overlap reads as a match, not a scattered pile of concerns.
export function evaluateAgency(agency, answers) {
  const matched = [];
  const concerns = [];
  let score = 0;

  for (const dim of DIMENSIONS) {
    const rawAnswer = answers[dim.key];

    if (dim.multi) {
      const selected = (rawAnswer || []).filter((v) => !NEUTRAL_VALUES.has(v));
      if (selected.length === 0) continue; // no opinion given — skip entirely

      const agencyValue = agency[dim.field];
      if (dim.isEmpty(agencyValue)) {
        concerns.push({ dimension: dim.key, type: 'unconfirmed', label: dim.unconfirmedLabel() });
        continue;
      }

      const matchedValues = selected.filter((v) => dim.compare(agencyValue, v));
      if (matchedValues.length > 0) {
        score += dim.weight;
        matched.push({ dimension: dim.key, label: dim.matchLabel(matchedValues) });
      } else {
        concerns.push({ dimension: dim.key, type: 'conflict', label: dim.conflictLabel(agencyValue, selected) });
      }
      continue;
    }

    if (!rawAnswer || NEUTRAL_VALUES.has(rawAnswer)) continue; // no opinion given — skip entirely
    if (dim.appliesTo && !dim.appliesTo(rawAnswer)) continue; // e.g. lifeStage only engages for "married with kids"

    const agencyValue = agency[dim.field];

    if (dim.isEmpty(agencyValue)) {
      concerns.push({ dimension: dim.key, type: 'unconfirmed', label: dim.unconfirmedLabel() });
      continue;
    }

    const isMatch = dim.compare(agencyValue, rawAnswer);
    if (isMatch) {
      score += dim.weight;
      matched.push({ dimension: dim.key, label: dim.matchLabel(rawAnswer) });
    } else {
      concerns.push({ dimension: dim.key, type: 'conflict', label: dim.conflictLabel(agencyValue, rawAnswer) });
    }
  }

  return { ...agency, score, matched, concerns };
}

export function getMatches(answers, agencies, count = 3) {
  return agencies
    .map((agency) => evaluateAgency(agency, answers))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

export function matchLabel(score) {
  if (score >= 8) return 'Strong match';
  if (score >= 4) return 'Worth exploring';
  return 'Loose fit';
}
