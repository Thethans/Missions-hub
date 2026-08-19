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

const GIVING_CAPACITY_LABELS = {
  small: 'Small giving capacity',
  medium: 'Medium giving capacity',
  large: 'Large giving capacity'
};

export function givingCapacityLabel(church) {
  return GIVING_CAPACITY_LABELS[church.giving_capacity_tier] || null;
}

export function engagementLabels(church) {
  const labels = [];
  if (church.hosts_short_term_trips) labels.push('Hosts short-term trips');
  if (church.sends_teams) labels.push('Sends teams');
  if (church.hosts_furloughs) labels.push('Hosts furloughs');
  return labels;
}
