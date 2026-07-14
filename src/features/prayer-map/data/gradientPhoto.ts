interface GradientPhotoOptions {
  from: string;
  to: string;
  emoji: string;
  caption: string;
}

/**
 * Builds an inline SVG-gradient placeholder photo (a data URI), matching the
 * illustration style the original reference prototype used for every update.
 *
 * Used only for the creative-access missionary's updates: a real photo could
 * reveal identifying visual context (faces, architecture, landscape) for a
 * security-sensitive location, so that record intentionally uses abstract
 * illustration instead of stock photography — see missionaries.ts.
 */
export function buildGradientPhoto({ from, to, emoji, caption }: GradientPhotoOptions): string {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='240'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>` +
    `<stop offset='0' stop-color='${from}'/><stop offset='1' stop-color='${to}'/>` +
    `</linearGradient></defs>` +
    `<rect width='400' height='240' fill='url(#g)'/>` +
    `<circle cx='330' cy='55' r='28' fill='#ffffff' opacity='0.85'/>` +
    `<path d='M0 190 Q100 150 200 175 T400 165 V240 H0 Z' fill='#ffffff' opacity='0.15'/>` +
    `<path d='M0 205 Q120 175 240 195 T400 185 V240 H0 Z' fill='#000000' opacity='0.12'/>` +
    `<text x='200' y='125' font-family='sans-serif' font-size='46' text-anchor='middle'>${emoji}</text>` +
    `<text x='200' y='225' font-family='sans-serif' font-size='13' fill='#ffffff' text-anchor='middle' opacity='0.9'>${caption}</text>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
