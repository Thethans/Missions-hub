// Church equivalent of missionaryDisplay.js. Simpler than that file on
// purpose — church_profiles has no field_visibility (a church's own
// location isn't the security concern a missionary's field location can
// be) and no verification level, so there's no redaction rule or
// verification-label lookup to keep in sync here.
export function churchLocationText(church) {
  if (church.city && church.state) return `${church.city}, ${church.state}`;
  return church.city || church.state || 'Location not specified';
}

export function churchTagIds(church) {
  return new Set(
    (church.church_doctrinal_tags || [])
      .map((r) => r.doctrinal_tags?.id)
      .filter(Boolean)
  );
}

export function churchTags(church) {
  return (church.church_doctrinal_tags || [])
    .map((r) => r.doctrinal_tags)
    .filter(Boolean);
}
