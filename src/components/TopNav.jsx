import React, { useRef, useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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

// Same title/description used by PrayerMapPage's own usePageMeta call — kept
// in sync here rather than invented separately, so the preview promises
// exactly what the page delivers.
const SUPPORT_MAP_PREVIEW = {
  title: 'Missionary Support Map',
  description:
    'Pray for and support missionaries around the world. Tap a pin to see their ministry, prayer requests, and monthly support needs.'
};

// Checklist temporarily pulled from nav (page and route still live at
// /checklist — just not linked as a tab). Re-add between Support Map and
// For Churches, with tag '06', to restore it.
const LINKS = [
  { to: '/', label: 'Home', end: true, tag: '01' },
  { to: '/quiz', label: 'Agency Match', tag: '02' },
  { to: '/map', label: 'Map', tag: '03' },
  { to: '/opportunities', label: 'Opportunities', tag: '04' },
  { to: '/prayer-map', label: 'Support Map', tag: '05', preview: SUPPORT_MAP_PREVIEW },
  { to: '/for-churches', label: 'For Churches', tag: '06' },
  { to: '/for-missionaries', label: 'For Missionaries', tag: '07' },
  { to: '/about', label: 'About', tag: '08' }
];

export default function TopNav() {
  const [hovered, setHovered] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [previewLink, setPreviewLink] = useState(null);
  const prefetched = useRef(new Set());
  const location = useLocation();
  const navigate = useNavigate();
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
    setPreviewLink(null);
  }, [location.pathname]);

  useEffect(() => {
    if (drawerOpen || previewLink) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen, previewLink]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') setDrawerOpen(false);
  }, []);

  useEffect(() => {
    if (drawerOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [drawerOpen, handleKeyDown]);

  const closePreview = useCallback(() => setPreviewLink(null), []);

  useEffect(() => {
    if (!previewLink) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closePreview();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [previewLink, closePreview]);

  const confirmPreview = () => {
    if (!previewLink) return;
    navigate(previewLink.to);
    closePreview();
  };

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
      onClick={(e) => {
        // A tab with a `preview` shows a popup describing the destination
        // before navigating, rather than jumping straight there — skip that
        // when we're already on the page (nothing new to preview).
        if (link.preview && location.pathname !== link.to) {
          e.preventDefault();
          setDrawerOpen(false);
          setPreviewLink(link);
        }
      }}
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

      {previewLink && (
        <NavPreviewPopup link={previewLink} onClose={closePreview} onConfirm={confirmPreview} />
      )}
    </header>
  );
}

function NavPreviewPopup({ link, onClose, onConfirm }) {
  const confirmRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  // Same Tab-wrap focus trap as MapPopupCard/InquiryModal — role="dialog"
  // plus aria-modal alone doesn't stop keyboard focus from escaping into
  // the nav behind it.
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key !== 'Tab') return;
      const focusable = cardRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="nav-preview-overlay" role="presentation" onClick={onClose}>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div
        className="nav-preview-card"
        role="dialog"
        aria-modal="true"
        aria-label={link.preview.title}
        ref={cardRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="nav-preview-close" onClick={onClose} aria-label="Close">
          <X size={18} weight="bold" />
        </button>
        <h3>{link.preview.title}</h3>
        <p>{link.preview.description}</p>
        <div className="nav-preview-actions">
          <button type="button" className="cta-button" ref={confirmRef} onClick={onConfirm}>
            View the map
          </button>
          <button type="button" className="nav-preview-dismiss" onClick={onClose}>
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
