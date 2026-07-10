// Single source of truth for the lazily-loaded route chunks — App.jsx wraps
// these in lazy() for the router, and TopNav calls the same functions on
// link hover/focus to start the chunk fetch before the user actually clicks.
export const routeImports = {
  '/map': () => import('./pages/MapPage.jsx'),
  '/quiz': () => import('./pages/QuizPage.jsx'),
  '/checklist': () => import('./pages/ChecklistPage.jsx'),
  '/about': () => import('./pages/AboutPage.jsx')
};
