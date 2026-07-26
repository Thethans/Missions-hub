// Plain-language, two-sentence summaries shown on hover/focus for each
// religion chip in the map legend. Keyed by the exact string Joshua
// Project's data uses (see WorldMap.jsx's religion tally) — a religion
// with no entry here just shows no tooltip, rather than guessing.
//
// A few of these keys aren't actually religions — "Ethnic Religions",
// "Non-Religious", "Unknown", and "Other / Small" are data-categorization
// labels Joshua Project uses, not single belief systems, so their entries
// explain what the label means instead of inventing a shared theology
// that doesn't exist. Stating that plainly matches CLAUDE.md's rule on
// never fabricating data: an unclear or non-uniform category is described
// as such, not smoothed over.
const RELIGION_SUMMARIES = {
  Christianity:
    'Centers on Jesus Christ as the Son of God, whose death and resurrection reconcile humanity with God. Practices vary across Catholic, Orthodox, and Protestant traditions, but most affirm the Bible as scripture.',
  Islam:
    "Teaches that there is one God (Allah) and that Muhammad is God's final prophet, delivering the Quran. Core practices are the Five Pillars: faith, daily prayer, charity, fasting during Ramadan, and pilgrimage to Mecca.",
  'Ethnic Religions':
    "A broad category, not a single religion — traditional belief systems tied to a specific people group's culture and ancestry. Varies by region, often including ancestor veneration or animism.",
  Hinduism:
    'A family of traditions built around dharma (duty and order), karma, and reincarnation across many lifetimes. Most traditions honor one or more deities as expressions of a single underlying reality.',
  Buddhism:
    'Follows the teachings of Siddhartha Gautama (the Buddha) on ending suffering by understanding its causes. Most traditions hold to a cycle of rebirth, aiming for nirvana — freedom from craving and suffering.',
  'Non-Religious':
    "People who don't identify with an organized religion, from atheists to those simply unaffiliated. Not a shared belief system — just an absence of religious identification in the data.",
  Unknown:
    "This isn't a belief system — it means Joshua Project's records for these people groups list no documented religious affiliation. A gap in available data, not a classification.",
  Judaism:
    'Centers on a covenant between God and the Jewish people, rooted in the Torah and Hebrew Bible. Central practices include the Sabbath, dietary laws (kashrut), and the mitzvot.',
  Sikhism:
    'Founded by Guru Nanak in 15th-century Punjab, teaching one God and the equality of all people. Sikhs follow the ten Gurus, recorded in their scripture, the Guru Granth Sahib.',
  'Other / Small':
    'A catch-all for traditions too small or specific to list individually in this dataset. Groups several minor faiths together rather than one shared belief system.'
};

export default RELIGION_SUMMARIES;
