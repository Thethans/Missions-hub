import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/fraunces/full.css';
import '@fontsource-variable/inter';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import App from './App.jsx';
import './styles/tokens.css';
import './styles.css';

// scripts/prerender.js injects a <script id="__PRELOADED_DATA__"> with
// whatever public data was on the page at snapshot time. Parse it into
// window.__PRELOADED__ before the first render so components' initial state
// (read via src/utils/preloadedData.js) already has real content instead of
// a loading skeleton — this is still createRoot (see the design doc note:
// hydrateRoot can't work here while routes are wrapped in <Suspense> for
// code-splitting, since scripts/prerender.js captures a client-rendered DOM
// snapshot rather than real react-dom/server output, so it never has the
// comment markers hydration needs to locate a Suspense boundary), but a
// fresh client render seeded with this data paints real content on the
// first frame instead of a spinner, which is most of the win without the
// Suspense blocker.
const preloadEl = document.getElementById('__PRELOADED_DATA__');
if (preloadEl) {
  try {
    window.__PRELOADED__ = JSON.parse(preloadEl.textContent);
  } catch {
    // Malformed/missing preload data — components fall back to their own
    // loading state and fetch normally.
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
