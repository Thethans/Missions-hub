// Shared between the missionary/church onboarding forms and the public
// directory's tag filter — all three need the same category → label
// mapping for supabase/schema.sql's doctrinal_tags.category values.
export const CATEGORY_LABELS = {
  baptism: 'Baptism',
  gender_roles: 'Gender Roles',
  spiritual_gifts: 'Spiritual Gifts',
  soteriology: 'Soteriology',
  eschatology: 'Eschatology',
  bible_translation: 'Bible Translation',
  church_government: 'Church Government'
};

export function groupTagsByCategory(tags) {
  const groups = new Map();
  for (const tag of tags) {
    if (!groups.has(tag.category)) groups.set(tag.category, []);
    groups.get(tag.category).push(tag);
  }
  return groups;
}
