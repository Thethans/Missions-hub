import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import RootLayout from './layouts/RootLayout.jsx';
import HomePage from './pages/HomePage.jsx';

// Code-split everything but the landing page — visiting "/" shouldn't pull
// in maplibre-gl (Map), the quiz scoring data, or any other route's code.
const MapPage = lazy(() => import('./pages/MapPage.jsx'));
const QuizPage = lazy(() => import('./pages/QuizPage.jsx'));
const ChecklistPage = lazy(() => import('./pages/ChecklistPage.jsx'));
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'));
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
