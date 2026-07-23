import { useEffect, useState } from 'react';

// Delays propagating a fast-changing value (e.g. every keystroke in a search
// box) until it's been stable for `delayMs` — so a Fuse.js re-index/search
// over 1,000+ records runs once per pause in typing, not once per keystroke.
export default function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
