// Single source of truth for the lazily-loaded route chunks — App.jsx wraps
// these in lazy() for the router, and TopNav calls the same functions on
// link hover/focus to start the chunk fetch before the user actually clicks.
export const routeImports = {
  '/map': () => import('./pages/MapPage.jsx'),
  '/prayer-map': () => import('./features/prayer-map/PrayerMapPage.tsx'),
  '/prayer-map/admin': () => import('./features/prayer-map/AdminPage.tsx'),
  '/quiz': () => import('./pages/QuizPage.jsx'),
  '/opportunities': () => import('./pages/OpportunitiesPage.jsx'),
  '/checklist': () => import('./pages/ChecklistPage.jsx'),
  '/missionary-support/onboarding': () => import('./pages/MissionaryOnboardingPage.jsx'),
  '/for-churches': () => import('./pages/ForChurchesPage.jsx'),
  '/for-churches/:missionaryId': () => import('./pages/MissionaryProfilePage.jsx'),
  '/for-churches/onboarding': () => import('./pages/ChurchOnboardingPage.jsx'),
  '/admin/review-queue': () => import('./pages/AdminReviewQueuePage.jsx'),
  '/about': () => import('./pages/AboutPage.jsx'),
  '/terms': () => import('./pages/TermsPage.jsx'),
  '/privacy': () => import('./pages/PrivacyPage.jsx')
};

// A route's own page chunk above is small — the real weight some routes pay
// for is a child component the page unconditionally renders, one lazy()
// boundary deeper (so it isn't fetched just because MapPage's own tiny
// chunk was). /map is the extreme case: MapPage always renders WorldMap.jsx,
// which pulls in maplibre-gl's ~800KB/218KB-gzip chunk — every visitor to
// /map needs it, so there's no reason not to start that fetch during
// hover-to-click dead time same as the page chunk itself, rather than
// waiting for MapPage to mount and its own lazy() import to kick in.
export const deepPrefetchImports = {
  '/map': () => import('./components/WorldMap.jsx')
};
