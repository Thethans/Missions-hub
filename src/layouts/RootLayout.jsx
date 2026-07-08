import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TopNav from '../components/TopNav.jsx';

const TITLES = {
  '/': 'Fielded — Get to the Field',
  '/map': 'World Map — Fielded',
  '/quiz': 'Find Your Mission Board — Fielded',
  '/checklist': 'Pre-Field Checklist — Fielded',
  '/about': 'About — Fielded'
};

export default function RootLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = TITLES[pathname] || 'Page Not Found — Fielded';
    // New page = start at the top, like a normal multi-page site.
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="app-shell">
      <TopNav />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
