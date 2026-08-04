import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { LazyMotion, domAnimation } from 'framer-motion';
import TopNav from '../components/TopNav.jsx';
import RouteLoadingBar from '../components/RouteLoadingBar.jsx';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import useJsonLd from '../hooks/useJsonLd.js';
import { BASE_URL } from '../hooks/usePageMeta.js';

// Site-level entity data, present on every route (unlike Faq.jsx's FAQPage
// schema, which only applies to the homepage) — establishes the
// Organization/WebSite identity Google otherwise has to guess at from
// scratch. Only facts already stated elsewhere on the site (index.html's own
// og:description, the footer copyright line) — no invented sameAs profiles
// or contact details.
const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Fielded',
  url: BASE_URL,
  logo: `${BASE_URL}/icon-512.png`,
  description: 'A live map of unreached people groups, a transparent mission-agency matcher, and a pre-field checklist.'
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Fielded',
  url: BASE_URL
};

const TITLES = {
  '/': 'Fielded — Get to the Field',
  '/map': 'World Map — Fielded',
  '/quiz': 'Find Your Mission Board — Fielded',
  '/opportunities': 'Opportunities — Fielded',
  '/checklist': 'Pre-Field Checklist — Fielded',
  '/for-churches': 'For Churches — Fielded',
  '/for-churches/onboarding': 'Church Onboarding — Fielded',
  '/missionary-support': 'Missionary Dashboard — Fielded',
  '/missionary-support/onboarding': 'Missionary Onboarding — Fielded',
  '/admin/review-queue': 'Admin Review Queue — Fielded',
  '/about': 'About — Fielded',
  '/terms': 'Terms of Service — Fielded',
  '/privacy': 'Privacy Policy — Fielded'
};

export default function RootLayout() {
  const { pathname } = useLocation();
  const mainRef = useRef(null);
  useJsonLd('organization', orgSchema);
  useJsonLd('website', websiteSchema);
  // Derived synchronously from the current path (not '' + an effect): the
  // effect below only needs to fire on subsequent route changes now, so the
  // very first render already matches scripts/prerender.js's snapshot
  // (which always captures post-effect, with the title resolved) instead of
  // diverging from it.
  const [announcement, setAnnouncement] = useState(() => TITLES[pathname] || 'Page Not Found — Fielded');

  useEffect(() => {
    const title = TITLES[pathname] || 'Page Not Found — Fielded';
    document.title = title;
    // New page = start at the top, like a normal multi-page site.
    window.scrollTo(0, 0);
    // SPA route changes are otherwise silent for screen-reader/keyboard
    // users — move focus to the new page's content and announce its title,
    // same as a full page load would. preventScroll is essential: without
    // it, focusing <main> scrolls it flush to the viewport top, pushing the
    // sticky nav out of view so every page loaded slightly scrolled down.
    mainRef.current?.focus({ preventScroll: true });
    setAnnouncement(title);
  }, [pathname]);

  return (
    // Every m.* component on the site (HomePage, Faq/OpportunitiesExplorer's
    // RevealOnScroll, TopNav's BrandMark) renders somewhere under RootLayout,
    // so one LazyMotion boundary here covers the whole routed tree — no
    // per-page provider needed. domAnimation (not domMax) since nothing here
    // uses drag or layout animations, see App.jsx's own route-splitting
    // comment for the same "only pay for what a route actually needs" idea.
    <LazyMotion features={domAnimation}>
      <div className="app-shell">
        <TopNav />
        <main ref={mainRef} tabIndex={-1}>
          <Suspense fallback={<RouteLoadingBar />}>
            {/* Keyed by pathname so a crash on one route doesn't keep showing
                the fallback after the visitor navigates elsewhere via
                TopNav — nav/footer stay live either way since this boundary
                only wraps the routed page content, not the whole shell. */}
            <ErrorBoundary key={pathname}>
              <Outlet />
            </ErrorBoundary>
          </Suspense>
        </main>
        <footer className="app-footer">
          <div className="footer-content">
            <p>&copy; 2026 Fielded. All rights reserved.</p>
            <nav className="footer-links">
              <a href="/missionary-support">For Missionaries</a>
              <a href="/terms">Terms of Service</a>
              <a href="/privacy">Privacy Policy</a>
            </nav>
          </div>
        </footer>
        <p className="visually-hidden" role="status" aria-live="polite">{announcement}</p>
        <Analytics />
      </div>
    </LazyMotion>
  );
}
