import { DIMENSIONS, NEUTRAL_VALUES } from './quizQuestions.js';

// Evaluates one agency against the user's answers. Returns the agency plus a
// score and two explanation lists — `matched` (why it ranked well) and
// `concerns` (either a real conflict, or a dimension the agency's public
// materials simply don't confirm). Unconfirmed fields are NEVER scored in
// either direction and are NEVER phrased as a negative — only as an open
// question worth asking the agency directly.
export function evaluateAgency(agency, answers) {
  const matched = [];
  const concerns = [];
  let score = 0;

  for (const dim of DIMENSIONS) {
    const userAnswer = answers[dim.key];
    if (!userAnswer || NEUTRAL_VALUES.has(userAnswer)) continue; // no opinion given — skip entirely
    if (dim.appliesTo && !dim.appliesTo(userAnswer)) continue; // e.g. lifeStage only engages for "married with kids"

    const agencyValue = agency[dim.field];

    if (dim.isEmpty(agencyValue)) {
      concerns.push({ dimension: dim.key, type: 'unconfirmed', label: dim.unconfirmedLabel() });
      continue;
    }

    const isMatch = dim.compare(agencyValue, userAnswer);
    if (isMatch) {
      score += dim.weight;
      matched.push({ dimension: dim.key, label: dim.matchLabel(userAnswer) });
    } else {
      concerns.push({ dimension: dim.key, type: 'conflict', label: dim.conflictLabel(agencyValue, userAnswer) });
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
