import { describe, it, expect } from 'vitest';
import { evaluateAgency, getMatches, matchLabel } from './scoreAgency.js';

// A fully-specified agency — every field an answer could match against.
const FULL_AGENCY = {
  name: 'Fully Specified Mission',
  tradition: 'broadly evangelical',
  focus: ['church planting', 'unreached peoples'],
  supportRaising: 'full personal support raising',
  familyFriendly: true,
  termLengths: ['short-term (under 2 years)', 'career/long-term'],
  regions: ['Sub-Saharan Africa'],
  roles: ['church planting', 'medical']
};

// An agency that conflicts on every dimension a user could answer.
const CONFLICTING_AGENCY = {
  name: 'Conflicting Mission',
  tradition: 'Reformed / Presbyterian',
  focus: ['aviation/logistics'],
  supportRaising: 'fully-funded / salaried (agency pays you)',
  familyFriendly: false,
  termLengths: ['mid-term (2-4 years)'],
  regions: ['Eastern Europe'],
  roles: ['support/admin']
};

// An agency that hasn't published anything for most fields — should read as
// "unconfirmed" concerns, never scored in either direction.
const UNCONFIRMED_AGENCY = {
  name: 'Sparse Mission',
  tradition: null,
  focus: [],
  supportRaising: null,
  familyFriendly: null,
  termLengths: null,
  regions: [],
  roles: null
};

const FULL_MATCH_ANSWERS = {
  focus: ['church planting'],
  tradition: 'broadly evangelical',
  supportRaising: 'full personal support raising',
  region: ['Sub-Saharan Africa'],
  lifeStage: 'married with kids',
  termLength: ['career/long-term'],
  roleType: ['church planting']
};

describe('evaluateAgency', () => {
  it('scores every matching dimension and lists them under matched, with no concerns', () => {
    const result = evaluateAgency(FULL_AGENCY, FULL_MATCH_ANSWERS);

    // focus(3) + tradition(2) + supportRaising(2) + region(2) + lifeStage(2) + termLength(1) + roleType(2) = 14
    expect(result.score).toBe(14);
    expect(result.maxPossible).toBe(14);
    expect(result.matchPercent).toBe(100);
    expect(result.matched).toHaveLength(7);
    expect(result.concerns).toHaveLength(0);
  });

  it('scores zero and surfaces a conflict per dimension when nothing matches', () => {
    const result = evaluateAgency(CONFLICTING_AGENCY, FULL_MATCH_ANSWERS);

    expect(result.score).toBe(0);
    // Every dimension was still comparable (agency has a confirmed, just
    // conflicting, value for each) — maxPossible is the full 14, so this
    // reads as a real, fully-informed 0%, not "we don't know."
    expect(result.maxPossible).toBe(14);
    expect(result.matchPercent).toBe(0);
    expect(result.matched).toHaveLength(0);
    // lifeStage only applies for 'married with kids' (it does here), so all 7 dimensions engage.
    expect(result.concerns).toHaveLength(7);
    expect(result.concerns.every((c) => c.type === 'conflict')).toBe(true);
  });

  it('flags null/empty agency fields as unconfirmed, never as a conflict, and never scores them', () => {
    const result = evaluateAgency(UNCONFIRMED_AGENCY, FULL_MATCH_ANSWERS);

    expect(result.score).toBe(0);
    // Nothing was actually comparable — every engaged dimension was
    // unconfirmed — so this is "not enough public info," not a 0% fit.
    expect(result.maxPossible).toBe(0);
    expect(result.matchPercent).toBeNull();
    expect(result.matched).toHaveLength(0);
    expect(result.concerns).toHaveLength(7);
    expect(result.concerns.every((c) => c.type === 'unconfirmed')).toBe(true);
  });

  it('skips a dimension entirely when the user gave no opinion (neutral value)', () => {
    const result = evaluateAgency(FULL_AGENCY, {
      ...FULL_MATCH_ANSWERS,
      region: ['no strong preference'],
      termLength: ['not sure yet']
    });

    // region and termLength dropped out entirely — no match, no concern for either.
    expect(result.matched.some((m) => m.dimension === 'region')).toBe(false);
    expect(result.concerns.some((c) => c.dimension === 'region')).toBe(false);
    expect(result.matched.some((m) => m.dimension === 'termLength')).toBe(false);
    expect(result.concerns.some((c) => c.dimension === 'termLength')).toBe(false);
    // focus(3) + tradition(2) + supportRaising(2) + lifeStage(2) + roleType(2) = 11
    expect(result.score).toBe(11);
  });

  it('counts a multi-select dimension as matched on partial overlap, not full agreement', () => {
    const result = evaluateAgency(FULL_AGENCY, {
      ...FULL_MATCH_ANSWERS,
      focus: ['church planting', 'aviation/logistics'] // agency only has the first
    });

    const focusMatch = result.matched.find((m) => m.dimension === 'focus');
    expect(focusMatch).toBeDefined();
    expect(focusMatch.label).toContain('church planting');
    expect(result.concerns.some((c) => c.dimension === 'focus')).toBe(false);
  });

  it('only engages lifeStage when the answer is "married with kids"', () => {
    const single = evaluateAgency(CONFLICTING_AGENCY, { ...FULL_MATCH_ANSWERS, lifeStage: 'single' });
    expect(single.matched.some((m) => m.dimension === 'lifeStage')).toBe(false);
    expect(single.concerns.some((c) => c.dimension === 'lifeStage')).toBe(false);

    const marriedNoKids = evaluateAgency(CONFLICTING_AGENCY, {
      ...FULL_MATCH_ANSWERS,
      lifeStage: 'married, no kids yet'
    });
    expect(marriedNoKids.concerns.some((c) => c.dimension === 'lifeStage')).toBe(false);
  });

  it('matches a region answer against an agency tagged "global / multiple regions"', () => {
    const globalAgency = { ...FULL_AGENCY, regions: ['global / multiple regions'] };
    const result = evaluateAgency(globalAgency, FULL_MATCH_ANSWERS);
    expect(result.matched.some((m) => m.dimension === 'region')).toBe(true);
  });

  it('matches a sub-region answer against an agency tagged only at the parent-region level', () => {
    const europeAgency = { ...FULL_AGENCY, regions: ['Europe'] };
    const result = evaluateAgency(europeAgency, { ...FULL_MATCH_ANSWERS, region: ['Eastern Europe'] });
    expect(result.matched.some((m) => m.dimension === 'region')).toBe(true);
  });

  // No agency in agencies.json has a confirmed field for which religious
  // groups it specializes in reaching, so `religions` intentionally has no
  // entry in DIMENSIONS — answering it must never change a score, appear as
  // matched, or appear as an "unconfirmed" concern (which would wrongly
  // imply agencies could in principle confirm it).
  it('never scores the religions answer against any agency, matched or unconfirmed', () => {
    const withReligions = evaluateAgency(FULL_AGENCY, {
      ...FULL_MATCH_ANSWERS,
      religions: ['Islam', 'Buddhism']
    });
    const without = evaluateAgency(FULL_AGENCY, FULL_MATCH_ANSWERS);

    expect(withReligions.score).toBe(without.score);
    expect(withReligions.matched.some((m) => m.dimension === 'religions')).toBe(false);
    expect(withReligions.concerns.some((c) => c.dimension === 'religions')).toBe(false);
  });
});

describe('getMatches', () => {
  it('sorts by score descending and caps at `count`', () => {
    const agencies = [CONFLICTING_AGENCY, FULL_AGENCY, UNCONFIRMED_AGENCY];
    const matches = getMatches(FULL_MATCH_ANSWERS, agencies, 2);

    expect(matches).toHaveLength(2);
    expect(matches[0].name).toBe('Fully Specified Mission');
    expect(matches[0].score).toBeGreaterThanOrEqual(matches[1].score);
  });

  it('keeps both agencies (in stable input order) when scores tie', () => {
    const agencyA = { ...FULL_AGENCY, name: 'Twin A' };
    const agencyB = { ...FULL_AGENCY, name: 'Twin B' };
    const matches = getMatches(FULL_MATCH_ANSWERS, [agencyA, agencyB], 2);

    expect(matches.map((m) => m.name)).toEqual(['Twin A', 'Twin B']);
    expect(matches[0].score).toBe(matches[1].score);
  });

  it('returns every agency scored (even at zero) when nothing conflicts and nothing is answered', () => {
    const matches = getMatches({}, [FULL_AGENCY, CONFLICTING_AGENCY], 5);
    expect(matches).toHaveLength(2);
    expect(matches.every((m) => m.score === 0)).toBe(true);
  });

  it('ranks by matchPercent, not raw score, so answering fewer questions never wins on a technicality', () => {
    // Answering only 'focus' (weight 3): a match is a 100% fit off a single
    // dimension. That must not outrank an agency confirmed to conflict on
    // every other dimension too but still nets a higher raw score from
    // matching more of them (a case the old raw-score sort got backwards).
    const oneQuestionAnswer = { focus: ['church planting'] };
    const partialMatchAgency = { ...CONFLICTING_AGENCY, name: 'Partial', focus: ['church planting'] };
    const matches = getMatches(oneQuestionAnswer, [partialMatchAgency], 1);
    expect(matches[0].matchPercent).toBe(100);
  });

  it('sorts an unconfirmed (null-percent) agency behind any agency with a real percentage, even 0%', () => {
    const matches = getMatches(FULL_MATCH_ANSWERS, [UNCONFIRMED_AGENCY, CONFLICTING_AGENCY], 2);
    expect(matches[0].name).toBe('Conflicting Mission');
    expect(matches[0].matchPercent).toBe(0);
    expect(matches[1].name).toBe('Sparse Mission');
    expect(matches[1].matchPercent).toBeNull();
  });

  it('breaks a percent tie in favor of the agency with more confirmed (corroborated) dimensions', () => {
    // Both are a 100% fit, but "Broad" had twice as many dimensions actually
    // confirmed-and-matching — a more corroborated match, so it should rank
    // first even though the percentages are identical.
    const narrowAgency = { ...FULL_AGENCY, name: 'Narrow', regions: [], termLengths: [], roles: [] };
    const broadAgency = { ...FULL_AGENCY, name: 'Broad' };
    const matches = getMatches(FULL_MATCH_ANSWERS, [narrowAgency, broadAgency], 2);

    expect(matches[0].name).toBe('Broad');
    expect(matches[0].matchPercent).toBe(100);
    expect(matches[1].name).toBe('Narrow');
    expect(matches[1].matchPercent).toBe(100);
    expect(matches[0].maxPossible).toBeGreaterThan(matches[1].maxPossible);
  });
});

describe('matchLabel', () => {
  it('labels by match-percentage threshold', () => {
    expect(matchLabel(100)).toBe('Strong match');
    expect(matchLabel(75)).toBe('Strong match');
    expect(matchLabel(74)).toBe('Worth exploring');
    expect(matchLabel(40)).toBe('Worth exploring');
    expect(matchLabel(39)).toBe('Loose fit');
    expect(matchLabel(0)).toBe('Loose fit');
  });

  it('gives null (nothing comparable) its own honest label instead of reading as a bad fit', () => {
    expect(matchLabel(null)).toBe('Not enough public info to compare');
  });
});
