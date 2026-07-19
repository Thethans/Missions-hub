// Question text/options shown in the UI. Option lists for region/termLength/roleType
// are the union of real values actually present across the agencies.json roster, so
// every option is reachable — see agencies.json for the source data.
export const QUESTIONS = [
  {
    key: 'focus',
    multi: true,
    text: 'What kind of ministry pulls you most? (choose all that apply)',
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
    options: [
      'full personal support raising',
      'faith-support model',
      'fully-funded / salaried (agency pays you)'
    ]
  },
  {
    key: 'region',
    multi: true,
    text: 'Where do you feel drawn to serve? (choose all that apply)',
    options: [
      'Sub-Saharan Africa',
      'Middle East / North Africa',
      'Central Asia',
      'South Asia',
      'Southeast Asia',
      'East Asia',
      'Latin America',
      'Western Europe',
      'Eastern Europe',
      'Balkans',
      'Nordic countries',
      'North America',
      'no strong preference'
    ]
  },
  {
    key: 'targetReligion',
    multi: true,
    text: 'What religions/people groups do you feel called to? (choose all that apply)',
    options: ['Christian', 'Muslim', 'Hindu', 'Buddhist', 'Animist', 'Atheist/Secular', 'no strong preference']
  },
  {
    key: 'lifeStage',
    text: "What's your family/life stage?",
    options: ['single', 'married, no kids yet', 'married with kids', 'not sure yet']
  },
  {
    key: 'termLength',
    multi: true,
    text: 'How long of a commitment are you thinking? (choose all that apply)',
    options: ['short-term (under 2 years)', 'mid-term (2-4 years)', 'career/long-term', 'not sure yet']
  },
  {
    key: 'roleType',
    multi: true,
    text: 'What kind of role fits your skills? (choose all that apply)',
    options: [
      'church planting',
      'medical',
      'education/TESOL',
      'Bible translation/linguistics',
      'business as mission',
      'media/creative',
      'relief and development',
      'support/admin',
      'support care',
      'risk management',
      'mobilization',
      'aviation/logistics',
      'community development',
      'not sure yet'
    ]
  }
];

const GLOBAL_REGION = 'global / multiple regions';
const NEUTRAL_VALUES = new Set(['no strong preference', 'not sure yet']);

// Some agencies are only confirmed at the broader region level (e.g. tagged
// "Asia" or "Europe" generically, with no source specific enough to split
// further) — this lets a sub-region answer still match those, instead of
// treating "not broken out yet" the same as "doesn't serve there".
const REGION_PARENT = {
  'Central Asia': 'Asia',
  'South Asia': 'Asia',
  'Southeast Asia': 'Asia',
  'East Asia': 'Asia',
  'Western Europe': 'Europe',
  'Eastern Europe': 'Europe',
  'Balkans': 'Europe',
  'Nordic countries': 'Europe'
};

function includesMatch(agencyValue, userAnswer) {
  return Array.isArray(agencyValue) && agencyValue.includes(userAnswer);
}

// Scoring config: one entry per question. `compare` returns true/false/null —
// null means "this dimension doesn't apply to this answer" (used for lifeStage,
// where only 'married with kids' actually engages familyFriendly).
export const DIMENSIONS = [
  {
    key: 'focus',
    multi: true,
    weight: 3,
    field: 'focus',
    isEmpty: (v) => !Array.isArray(v) || v.length === 0,
    compare: includesMatch,
    matchLabel: (values) => `Focuses on ${values.join(', ')}`,
    conflictLabel: (agencyValue, values) => `Doesn't list ${values.join(' or ')} as a focus area`,
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
    multi: true,
    weight: 2,
    field: 'regions',
    isEmpty: (v) => !Array.isArray(v) || v.length === 0,
    compare: (agencyValue, answer) =>
      agencyValue.includes(answer) ||
      agencyValue.includes(GLOBAL_REGION) ||
      (REGION_PARENT[answer] != null && agencyValue.includes(REGION_PARENT[answer])),
    matchLabel: (values) => {
      const named = values.filter((v) => v !== GLOBAL_REGION);
      return named.length > 0 ? `Active in ${named.join(', ')}` : 'Active in many regions';
    },
    conflictLabel: (agencyValue, values) => `Their focus regions don't include ${values.join(' or ')}`,
    unconfirmedLabel: () => 'Regional focus not clearly stated'
  },
  {
    key: 'targetReligion',
    multi: true,
    weight: 2,
    field: 'targetReligions',
    isEmpty: (v) => !Array.isArray(v) || v.length === 0,
    compare: includesMatch,
    matchLabel: (values) => `Works with ${values.join(', ')} populations`,
    conflictLabel: (agencyValue, values) => `Doesn't list ${values.join(' or ')} as a target religious group`,
    unconfirmedLabel: () => 'Target religious groups not clearly stated'
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
    multi: true,
    weight: 1,
    field: 'termLengths',
    isEmpty: (v) => !Array.isArray(v) || v.length === 0,
    compare: includesMatch,
    matchLabel: (values) => `Offers ${values.join(' or ')} terms`,
    conflictLabel: (agencyValue, values) => `Doesn't list ${values.join(' or ')} as an available term length`,
    unconfirmedLabel: () => 'Term length options not clearly stated'
  },
  {
    key: 'roleType',
    multi: true,
    weight: 2,
    field: 'roles',
    isEmpty: (v) => !Array.isArray(v) || v.length === 0,
    compare: includesMatch,
    matchLabel: (values) => `Recruits for ${values.join(', ')} roles`,
    conflictLabel: (agencyValue, values) => `Doesn't list ${values.join(' or ')} as a role they recruit for`,
    unconfirmedLabel: () => 'Specific roles recruited aren’t itemized on their site'
  }
];

// Hover tooltips for terms that may not be immediately intuitive
export const TERM_DEFINITIONS = {
  // Focus areas
  "church planting": "Starting or establishing new churches in unreached areas",
  "unreached peoples": "Groups with minimal access to the gospel and few believers",
  "Bible translation": "Translating Scripture into languages that don't yet have it",
  "creative access": "Ministry in restricted countries where religious work is limited—often through business, education, or cultural programs",
  "leadership development": "Training and mentoring leaders for churches, missions, or Christian organizations",
  "community development": "Long-term programs to improve education, health, income, and quality of life",
  "campus ministry": "Outreach and discipleship at universities and colleges",
  "youth ministry": "Working with teenagers and young adults to grow faith and life skills",
  "aviation/logistics": "Providing transportation, supplies, and operational support to remote missionary teams",

  // Support-raising models
  "full personal support raising": "You raise 100% of your budget from churches, individuals, and donors",
  "faith-support model": "You raise some funding; the agency supplements the rest based on demonstrated need",
  "fully-funded / salaried (agency pays you)": "The agency covers your salary and expenses—minimal fundraising needed",

  // Theological traditions
  "broadly evangelical": "Non-denominational focus on salvation through Christ, though denominationally diverse",
  "Baptist / conservative evangelical": "Baptist tradition emphasizing congregational autonomy, believer's baptism, and evangelical theology",
  "interdenominational": "Working across multiple denominational traditions without a single theological identity",
  "Pentecostal/charismatic": "Emphasis on the Holy Spirit's gifts, speaking in tongues, divine healing, and Spirit-empowered ministry",
  "Reformed / Presbyterian": "Theology emphasizing God's sovereignty, salvation through Christ, and often presbyterian church structure",

  // Role types
  "Bible translation/linguistics": "Translating Scripture and developing language materials for unreached peoples",
  "business as mission": "Using business as a platform for ministry and reaching people in restricted areas",
  "relief and development": "Humanitarian response and long-term community development projects",
  "support/admin": "Administrative, finance, HR, and operations roles supporting missionary teams",
  "support care": "Caring for missionaries' spiritual, emotional, and physical wellbeing",
  "risk management": "Security, crisis response, and safety planning for missionary operations",
  "mobilization": "Recruiting, training, and deploying new missionaries and teams",
  "media/creative": "Digital content, photography, video, design, and communication for ministry",
  "education/TESOL": "Teaching English or academics; often a platform for ministry in restricted areas",
  "medical": "Healthcare delivery and medical missionary work",
  "children/youth ministry": "Working with children and teenagers in faith formation and discipleship",
  "training/leadership": "Training leaders and developing disciples in the church or missions",
  "theological education": "Teaching theology and Scripture at seminaries or training institutions"
};

export { NEUTRAL_VALUES };
