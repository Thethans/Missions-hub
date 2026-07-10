import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import RootLayout from './layouts/RootLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import { routeImports } from './routeImports.js';

// Code-split everything but the landing page — visiting "/" shouldn't pull
// in maplibre-gl (Map), the quiz scoring data, or any other route's code.
// The import() functions live in routeImports.js so TopNav can call the
// same ones to prefetch a chunk on link hover, before the user clicks.
const MapPage = lazy(routeImports['/map']);
const QuizPage = lazy(routeImports['/quiz']);
const ChecklistPage = lazy(routeImports['/checklist']);
const AboutPage = lazy(routeImports['/about']);
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/checklist" element={<ChecklistPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      <Analytics />
    </>
  );
}
