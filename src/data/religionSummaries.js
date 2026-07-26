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
    "Centers on Jesus Christ as the Son of God, whose death and resurrection Christians believe reconciles humanity with God. Beliefs and practices vary widely across traditions such as Catholic, Orthodox, and Protestant churches, but most affirm the Bible as scripture.",
  Islam:
    "Teaches that there is one God (Allah) and that Muhammad is God's final prophet, delivering the message recorded in the Quran. Core practices include the Five Pillars: professing faith, praying five times daily, giving to charity, fasting during Ramadan, and pilgrimage to Mecca.",
  'Ethnic Religions':
    "Not a single religion but a broad category for traditional belief systems closely tied to a specific people group's culture, land, and ancestry. These vary widely by region and often include ancestor veneration, animism, or other locally rooted spiritual practices.",
  Hinduism:
    'Encompasses a wide range of traditions generally built around dharma (duty and order), karma, and reincarnation across many lifetimes. Most traditions honor one or more deities, often understood as expressions of a single underlying reality.',
  Buddhism:
    'Follows the teachings of Siddhartha Gautama (the Buddha) on ending suffering by understanding its causes and following a path toward enlightenment. Most traditions hold to a cycle of rebirth, with the goal of reaching nirvana — freedom from craving and suffering.',
  'Non-Religious':
    "People who don't identify with an organized religion, ranging from atheists and agnostics to those simply unaffiliated with any faith. It's not a shared belief system, just an absence of religious identification in the data.",
  Unknown:
    "This isn't a belief system — it means Joshua Project's records for these people groups don't include a documented religious affiliation. It reflects a gap in available data, not a religious classification.",
  Judaism:
    'Centers on a covenant relationship between God and the Jewish people, rooted in the Torah and the wider Hebrew Bible. Central practices include observing the Sabbath, following dietary laws (kashrut), and keeping the ethical and ritual commandments (mitzvot).',
  Sikhism:
    'Founded by Guru Nanak in 15th-century Punjab, it teaches belief in one God and the equality of all people, rejecting caste distinctions. Sikhs follow the teachings of ten Gurus, recorded in their scripture, the Guru Granth Sahib.',
  'Other / Small':
    'A catch-all category for religious traditions too small or specific to warrant their own listing in this dataset. It groups a variety of minor faiths together rather than representing one shared belief system.'
};

export default RELIGION_SUMMARIES;
