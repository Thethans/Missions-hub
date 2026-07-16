import { useEffect, useState } from 'react';

// Generic version of the same pattern usePrefersReducedMotion.js already
// uses for a single fixed query — this one takes any media query string
// (e.g. the hero atlas's mobile viewBox crop).
export default function useMatchMedia(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    setMatches(mql.matches);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
