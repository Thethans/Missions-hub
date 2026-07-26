import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import RootLayout from './layouts/RootLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import { routeImports } from './routeImports.js';
import RouteFlyOverlay from './components/RouteFlyOverlay.jsx';
import useRouteFlyTransition from './hooks/useRouteFlyTransition.js';
import { DisplayLocationProvider } from './context/DisplayLocationContext.js';

// Code-split everything but the landing page — visiting "/" shouldn't pull
// in maplibre-gl (Map), the quiz scoring data, or any other route's code.
// The import() functions live in routeImports.js so TopNav can call the
// same ones to prefetch a chunk on link hover, before the user clicks.
const MapPage = lazy(routeImports['/map']);
const PrayerMapPage = lazy(routeImports['/prayer-map']);
const PrayerMapAdminPage = lazy(routeImports['/prayer-map/admin']);
const QuizPage = lazy(routeImports['/quiz']);
const OpportunitiesPage = lazy(routeImports['/opportunities']);
const ChecklistPage = lazy(routeImports['/checklist']);
const AboutPage = lazy(routeImports['/about']);
const TermsPage = lazy(routeImports['/terms']);
const PrivacyPage = lazy(routeImports['/privacy']);
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

export default function App() {
  // <Routes> matches against `displayLocation`, not the live router
  // location — see useRouteFlyTransition.js — so a nav-tab click doesn't
  // swap the page until the flyover has fully covered the screen.
  const { displayLocation, panelControls, planeControls, isFlying, prefersReduced } = useRouteFlyTransition();

  return (
    <DisplayLocationProvider value={displayLocation}>
      <Routes location={displayLocation}>
        <Route element={<RootLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/prayer-map" element={<PrayerMapPage />} />
          <Route path="/prayer-map/admin" element={<PrayerMapAdminPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/opportunities" element={<OpportunitiesPage />} />
          <Route path="/checklist" element={<ChecklistPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      {!prefersReduced && (
        <RouteFlyOverlay panelControls={panelControls} planeControls={planeControls} isFlying={isFlying} />
      )}
    </DisplayLocationProvider>
  );
}
