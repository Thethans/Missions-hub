import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import TopNav from '../components/TopNav.jsx';
import RouteLoadingBar from '../components/RouteLoadingBar.jsx';

const TITLES = {
  '/': 'Fielded — Get to the Field',
  '/map': 'World Map — Fielded',
  '/quiz': 'Find Your Mission Board — Fielded',
  '/opportunities': 'Opportunities — Fielded',
  '/checklist': 'Pre-Field Checklist — Fielded',
  '/about': 'About — Fielded',
  '/terms': 'Terms of Service — Fielded',
  '/privacy': 'Privacy Policy — Fielded'
};

export default function RootLayout() {
  const { pathname } = useLocation();
  const mainRef = useRef(null);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const title = TITLES[pathname] || 'Page Not Found — Fielded';
    document.title = title;
    // New page = start at the top, like a normal multi-page site.
    window.scrollTo(0, 0);
    // SPA route changes are otherwise silent for screen-reader/keyboard
    // users — move focus to the new page's content and announce its title,
    // same as a full page load would.
    mainRef.current?.focus();
    setAnnouncement(title);
  }, [pathname]);

  return (
    <div className="app-shell">
      <TopNav />
      <main ref={mainRef} tabIndex={-1}>
        <Suspense fallback={<RouteLoadingBar />}>
          <Outlet />
        </Suspense>
      </main>
      <footer className="app-footer">
        <div className="footer-content">
          <p>&copy; 2026 Fielded. All rights reserved.</p>
          <nav className="footer-links">
            <a href="/terms">Terms of Service</a>
            <a href="/privacy">Privacy Policy</a>
          </nav>
        </div>
      </footer>
      <p className="visually-hidden" role="status" aria-live="polite">{announcement}</p>
      <Analytics />
    </div>
  );
}
