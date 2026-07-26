import { createContext, useContext } from 'react';

// The location <Routes> is actually matched/rendered against in App.jsx —
// see useRouteFlyTransition.js. Deliberately lags the real router location
// until the route-fly cover animation finishes, so anything downstream that
// keys off "which page is showing" (RootLayout's title/scroll/focus effects,
// its per-route ErrorBoundary key) stays in sync with what's visually on
// screen instead of firing the instant a nav link is clicked, a beat before
// the old page actually disappears.
const DisplayLocationContext = createContext(null);

export const DisplayLocationProvider = DisplayLocationContext.Provider;

export function useDisplayLocation() {
  const value = useContext(DisplayLocationContext);
  if (!value) {
    throw new Error('useDisplayLocation must be used within a DisplayLocationProvider');
  }
  return value;
}
