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
  // Sum of weights for dimensions where a real match/conflict determination
  // was actually made — i.e. the user answered AND the agency has a
  // confirmed value for that field. An "unconfirmed" dimension contributes
  // to neither score nor maxPossible: it's excluded from the comparison
  // entirely rather than counted as a loss, so an agency with less public
  // documentation doesn't get penalized relative to an equally-good but
  // better-documented one. matchPercent below is score/maxPossible — the
  // fraction of everything actually checkable that came back a match,
  // which is comparable across agencies in a way a raw weighted sum never
  // was (someone answering 1 question could hit the old "Strong match"
  // threshold as easily as someone answering all 7).
  let maxPossible = 0;

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

      maxPossible += dim.weight;
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

    maxPossible += dim.weight;
    const isMatch = dim.compare(agencyValue, rawAnswer);
    if (isMatch) {
      score += dim.weight;
      matched.push({ dimension: dim.key, label: dim.matchLabel(rawAnswer) });
    } else {
      concerns.push({ dimension: dim.key, type: 'conflict', label: dim.conflictLabel(agencyValue, rawAnswer) });
    }
  }

  // null (not 0) when nothing was comparable at all — e.g. every dimension
  // the user answered happens to be unconfirmed for this agency. That's a
  // "we don't know," never a "0% fit," and matchLabel below treats it as
  // its own honest bucket rather than lumping it in with "Loose fit."
  const matchPercent = maxPossible > 0 ? Math.round((score / maxPossible) * 100) : null;

  return { ...agency, score, maxPossible, matchPercent, matched, concerns };
}

export function getMatches(answers, agencies, count = 3) {
  return agencies
    .map((agency) => evaluateAgency(agency, answers))
    .sort((a, b) => {
      // matchPercent is what's actually comparable across agencies (two
      // agencies can have the same raw score off entirely different
      // numbers of confirmed dimensions) — null (nothing comparable) sorts
      // last. A tie on percent is broken by how much was actually
      // corroborated (more confirmed-and-matching dimensions beats a
      // single lucky one at the same percentage), then by raw score.
      const pctA = a.matchPercent ?? -1;
      const pctB = b.matchPercent ?? -1;
      if (pctB !== pctA) return pctB - pctA;
      if (b.maxPossible !== a.maxPossible) return b.maxPossible - a.maxPossible;
      return b.score - a.score;
    })
    .slice(0, count);
}

export function matchLabel(matchPercent) {
  if (matchPercent == null) return 'Not enough public info to compare';
  if (matchPercent >= 75) return 'Strong match';
  if (matchPercent >= 40) return 'Worth exploring';
  return 'Loose fit';
}
