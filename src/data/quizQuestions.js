// Question text/options shown in the UI. Option lists for region/termLength/roleType
// are the union of real values actually present across the agencies.json roster, so
// every option is reachable — see agencies.json for the source data.
export const QUESTIONS = [
  {
    key: 'focus',
    text: 'What kind of ministry pulls you most?',
    options: [
      'church planting',
      'unreached peoples',
      'medical',
      'Bible translation',
      'creative access',
      'leadership development',
      'theological education',
      'relief and development',
      'community development',
      'campus ministry',
      'youth ministry',
      'aviation/logistics'
    ]
  },
  {
    key: 'tradition',
    text: 'What theological tradition fits you best?',
    options: [
      'broadly evangelical',
      'Baptist / conservative evangelical',
      'interdenominational',
      'Pentecostal/charismatic',
      'Reformed / Presbyterian'
    ]
  },
  {
    key: 'supportRaising',
    text: 'How do you feel about support raising?',
    options: ['full personal support raising', 'faith-support model']
  },
  {
    key: 'region',
    text: 'Where do you feel drawn to serve?',
    options: [
      'Sub-Saharan Africa',
      'Middle East / North Africa',
      'Asia',
      'Latin America',
      'Europe',
      'North America',
      'no strong preference'
    ]
  },
  {
    key: 'lifeStage',
    text: "What's your family/life stage?",
    options: ['single', 'married, no kids yet', 'married with kids', 'not sure yet']
  },
  {
    key: 'termLength',
    text: 'How long of a commitment are you thinking?',
    options: ['short-term (under 2 years)', 'mid-term (2-4 years)', 'career/long-term', 'not sure yet']
  },
  {
    key: 'roleType',
    text: 'What kind of role fits your skills?',
    options: [
      'church planting',
      'medical',
      'education/TESOL',
      'Bible translation/linguistics',
      'business as mission',
      'media/creative',
      'relief and development',
      'support/admin',
      'aviation/logistics',
      'community development',
      'not sure yet'
    ]
  }
];

const GLOBAL_REGION = 'global / multiple regions';
const NEUTRAL_VALUES = new Set(['no strong preference', 'not sure yet']);

function includesMatch(agencyValue, userAnswer) {
  return Array.isArray(agencyValue) && agencyValue.includes(userAnswer);
}

// Scoring config: one entry per question. `compare` returns true/false/null —
// null means "this dimension doesn't apply to this answer" (used for lifeStage,
// where only 'married with kids' actually engages familyFriendly).
export const DIMENSIONS = [
  {
    key: 'focus',
    weight: 3,
    field: 'focus',
    isEmpty: (v) => !Array.isArray(v) || v.length === 0,
    compare: includesMatch,
    matchLabel: (answer) => `Focuses on ${answer}`,
    conflictLabel: (agencyValue, answer) => `Doesn't list ${answer} as a focus area`,
    unconfirmedLabel: () => 'Ministry focus areas aren’t fully itemized on their site'
  },
  {
    key: 'tradition',
    weight: 2,
    field: 'tradition',
    isEmpty: (v) => v == null,
    compare: (agencyValue, answer) => agencyValue === answer,
    matchLabel: () => 'Shares your theological tradition',
    conflictLabel: (agencyValue) => `Their tradition is ${agencyValue}, not what you selected`,
    unconfirmedLabel: () => 'Theological tradition not clearly stated'
  },
  {
    key: 'supportRaising',
    weight: 2,
    field: 'supportRaising',
    isEmpty: (v) => v == null,
    compare: (agencyValue, answer) => agencyValue === answer,
    matchLabel: () => 'Matches your support-raising comfort',
    conflictLabel: (agencyValue) => `Their model is "${agencyValue}", not what you selected`,
    unconfirmedLabel: () => 'Support-raising model not clearly stated on their site'
  },
  {
    key: 'region',
    weight: 2,
    field: 'regions',
    isEmpty: (v) => !Array.isArray(v) || v.length === 0,
    compare: (agencyValue, answer) => agencyValue.includes(answer) || agencyValue.includes(GLOBAL_REGION),
    matchLabel: (answer) => (
      answer === undefined ? 'Serves globally' : `Active in ${answer === GLOBAL_REGION ? 'many regions' : answer}`
    ),
    conflictLabel: (agencyValue, answer) => `Their focus regions don't include ${answer}`,
    unconfirmedLabel: () => 'Regional focus not clearly stated'
  },
  {
    key: 'lifeStage',
    weight: 2,
    field: 'familyFriendly',
    appliesTo: (answer) => answer === 'married with kids',
    isEmpty: (v) => v == null,
    compare: (agencyValue) => agencyValue === true,
    matchLabel: () => 'Explicitly supports families with children on the field',
    conflictLabel: () => 'Doesn’t explicitly support families with children on the field',
    unconfirmedLabel: () => 'Family/children field policy not clearly stated'
  },
  {
    key: 'termLength',
    weight: 1,
    field: 'termLengths',
    isEmpty: (v) => !Array.isArray(v) || v.length === 0,
    compare: includesMatch,
    matchLabel: (answer) => `Offers ${answer} terms`,
    conflictLabel: (agencyValue, answer) => `Doesn't list ${answer} as an available term length`,
    unconfirmedLabel: () => 'Term length options not clearly stated'
  },
  {
    key: 'roleType',
    weight: 2,
    field: 'roles',
    isEmpty: (v) => !Array.isArray(v) || v.length === 0,
    compare: includesMatch,
    matchLabel: (answer) => `Recruits for ${answer} roles`,
    conflictLabel: (agencyValue, answer) => `Doesn't list ${answer} as a role they recruit for`,
    unconfirmedLabel: () => 'Specific roles recruited aren’t itemized on their site'
  }
];

export { NEUTRAL_VALUES };
