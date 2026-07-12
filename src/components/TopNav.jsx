import React, { useRef, useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import RouteLine from './RouteLine.jsx';
import CompassIcon from './CompassIcon.jsx';
import { routeImports } from '../routeImports.js';
import { List, X } from '@phosphor-icons/react';

const LINKS = [
  { to: '/', label: 'Home', end: true, tag: '01' },
  { to: '/map', label: 'Map', tag: '02' },
  { to: '/quiz', label: 'Quiz', tag: '03' },
  { to: '/opportunities', label: 'Opportunities', tag: '04' },
  { to: '/checklist', label: 'Checklist', tag: '05' },
  { to: '/about', label: 'About', tag: '06' }
];

export default function TopNav() {
  const [hovered, setHovered] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const prefetched = useRef(new Set());
  const location = useLocation();

  const prefetch = (to) => {
    if (prefetched.current.has(to)) return;
    const load = routeImports[to];
    if (!load) return;
    prefetched.current.add(to);
    load();
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
      <NavLink to="/" className="site-nav-logo">
        <span className="site-nav-logo-mark" aria-hidden="true">
          <CompassIcon size={20} />
        </span>
        Fielded
      </NavLink>

      {/* Desktop nav */}
      <nav className="site-nav-links site-nav-links--desktop">
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
