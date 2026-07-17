// Bridges data fetched client-side into the static HTML that
// scripts/prerender.js snapshots, so a real visitor's first React render
// (before any effect has fired) already matches what got captured — the
// prerequisite for ReactDOM.hydrateRoot to attach without discarding and
// re-rendering the subtree. See src/main.jsx for the read side (parsing the
// injected <script id="__PRELOADED_DATA__"> tag before hydration starts).
//
// Only ever put public, non-personalized data here (site stats, opportunity
// listings, map counts) — this object gets serialized verbatim into a
// publicly-cached static HTML file, so it must never carry per-user session
// or auth data.
export function getPreloaded(key) {
  return typeof window !== 'undefined' ? window.__PRELOADED__?.[key] : undefined;
}

export function setPreloaded(key, value) {
  if (typeof window === 'undefined') return;
  (window.__PRELOADED__ ??= {})[key] = value;
}
