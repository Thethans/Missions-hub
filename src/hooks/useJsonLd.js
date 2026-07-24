import { useEffect } from 'react';

// Same imperative <head>-injection pattern as usePageMeta.js — a script tag
// keyed by `id` (so e.g. an Organization block and a FAQPage block can
// coexist without clobbering each other) is created once and its content
// kept in sync, then removed on unmount so navigating to a route that
// doesn't have this schema doesn't leave stale structured data behind for
// crawlers/prerendering to pick up.
//
// `schema` should be a stable reference (module-level or memoized), same
// expectation usePageMeta already has for the strings it's passed — a fresh
// object literal every render just means the effect re-runs harmlessly.
export default function useJsonLd(id, schema) {
  useEffect(() => {
    if (!schema) return;

    let el = document.querySelector(`script[data-jsonld="${id}"]`);
    if (!el) {
      el = document.createElement('script');
      el.type = 'application/ld+json';
      el.setAttribute('data-jsonld', id);
      document.head.appendChild(el);
    }
    // `<` escaped so a literal "</script>" in any field can never appear in
    // the serialized JSON and prematurely close the tag.
    el.textContent = JSON.stringify(schema).replace(/</g, '\\u003c');

    return () => {
      el?.remove();
    };
  }, [id, schema]);
}
