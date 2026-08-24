// Shared between the public directory (Step 6) and the individual profile
// page (Step 7) — both need the exact same field_visibility rule so a
// missionary's location redaction can't drift between the two views.
export function locationText(missionary) {
  if (missionary.field_visibility === 'private') return 'Location available on request';
  return missionary.field_region || 'Region not specified';
}

export function missionaryTagIds(missionary) {
  return new Set(
    (missionary.missionary_doctrinal_tags || [])
      .map((r) => r.doctrinal_tags?.id)
      .filter(Boolean)
  );
}

export function missionaryTags(missionary) {
  return (missionary.missionary_doctrinal_tags || [])
    .map((r) => r.doctrinal_tags)
    .filter(Boolean);
}

export const VERIFICATION_LABEL = {
  self_reported: 'Self-reported',
  agency_verified: 'Agency-verified'
};

// Fallback avatar content for a missionary with no headshot_url — first
// letter of up to the first two words of display_name, e.g. "Grace Marrow"
// → "GM", "Mei-Lin" → "M". An honest placeholder (initials, never a generic
// person silhouette pretending to be a real photo) rather than treating the
// photo as required.
export function initials(displayName) {
  return (displayName || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}
