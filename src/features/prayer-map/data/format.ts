/** Whole-dollar USD, e.g. 3500 → "$3,500". */
export function formatMoney(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-US');
}

/** First name / household name before an "&", e.g. "Jonathan & Sarah Smith" → "Jonathan". */
export function firstName(name: string): string {
  return name.split(' &')[0] ?? name;
}

const HONORIFIC_RE = /^(Dr|Pastor|Rev|Mr|Mrs|Ms)\.?\s+/i;

/**
 * Two-letter fallback avatar for when a missionary has no photo yet —
 * first token's initial + last token's initial, honorifics and "&" both
 * stripped first. "Dr. Michael Chen" → "MC", "Jonathan & Sarah Smith" →
 * "JS" (first-listed name + surname, not both first names), "Karim & Noor"
 * → "KN" (no surname to fall back to, so this is just the pair).
 */
export function initials(name: string): string {
  const tokens = name.replace(HONORIFIC_RE, '').split(/[\s&]+/).filter(Boolean);
  const first = tokens[0]?.[0] ?? '';
  const last = tokens[tokens.length - 1]?.[0] ?? '';
  return (tokens.length <= 1 ? first : first + last).toUpperCase();
}
