import React, { useRef, useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import RouteLine from './RouteLine.jsx';
import BrandLockup from './BrandMark.jsx';
import { routeImports, deepPrefetchImports } from '../routeImports.js';
import { List, X } from '@phosphor-icons/react';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';

// Below this scroll depth the nav lockup collapses from the full "Fielded"
// wordmark to the bare F monogram, freeing up header space — the ember dot
// glides from the wordmark's dotless-ı to the F's diacritic slot via
// BrandLockup's shared layoutId rather than swapping instantly.
const COLLAPSE_THRESHOLD = 80;

// Checklist temporarily pulled from nav (page and route still live at
// /checklist — just not linked as a tab). Re-add between Opportunities and
// For Churches, with tag '05', to restore it.
const LINKS = [
  { to: '/', label: 'Home', end: true, tag: '01' },
  { to: '/map', label: 'Map', tag: '02' },
  { to: '/quiz', label: 'Agency Match', tag: '03' },
  { to: '/opportunities', label: 'Opportunities', tag: '04' },
  { to: '/for-churches', label: 'For Churches', tag: '05' },
  { to: '/for-missionaries', label: 'For Missionaries', tag: '06' },
  { to: '/about', label: 'About', tag: '07' }
];

export default function TopNav() {
  const [hovered, setHovered] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const prefetched = useRef(new Set());
  const location = useLocation();
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    const onScroll = () => setCollapsed(window.scrollY > COLLAPSE_THRESHOLD);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const prefetch = (to) => {
    if (prefetched.current.has(to)) return;
    const load = routeImports[to];
    if (!load) return;
    prefetched.current.add(to);
    load();
    deepPrefetchImports[to]?.();
  };

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') setDrawerOpen(false);
  }, []);

  useEffect(() => {
    if (drawerOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [drawerOpen, handleKeyDown]);

  const navLinks = LINKS.map((link) => (
    <NavLink
      key={link.to}
      to={link.to}
      end={link.end}
      className={({ isActive }) => (isActive ? 'active' : undefined)}
      onMouseEnter={() => { setHovered(link.to); prefetch(link.to); }}
      onMouseLeave={() => setHovered(null)}
      onFocus={() => prefetch(link.to)}
      onTouchStart={() => prefetch(link.to)}
    >
      <span className="site-nav-tag">{link.tag}</span>
      {link.label}
      <RouteLine
        variant="hover"
        hovered={hovered === link.to}
        pathD="M0,4 L100,4"
        viewBox="0 0 100 8"
        className="site-nav-underline"
      />
    </NavLink>
  ));

  return (
    <header className="site-nav">
      <NavLink to="/" className="site-nav-logo" aria-label="Fielded — Home">
        <BrandLockup expanded={!collapsed || prefersReduced} />
      </NavLink>

      {/* Desktop nav */}
      <nav className="site-nav-links site-nav-links--desktop" aria-label="Primary navigation">
        {navLinks}
      </nav>

      {/* Mobile hamburger */}
      <button
        type="button"
        className="site-nav-hamburger"
        onClick={() => setDrawerOpen(!drawerOpen)}
        aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={drawerOpen}
      >
        {drawerOpen ? <X size={24} weight="bold" /> : <List size={24} weight="bold" />}
      </button>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div
            className="site-nav-overlay"
            role="presentation"
            onClick={() => setDrawerOpen(false)}
          />
          <nav className="site-nav-drawer" aria-label="Mobile navigation">
            {navLinks}
          </nav>
        </>
      )}
    </header>
  );
}
