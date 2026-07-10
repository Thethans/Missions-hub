import React, { useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import RouteLine from './RouteLine.jsx';
import PlaneIcon from './PlaneIcon.jsx';
import { routeImports } from '../routeImports.js';

const LINKS = [
  { to: '/', label: 'Home', end: true, tag: '01' },
  { to: '/map', label: 'Map', tag: '02' },
  { to: '/quiz', label: 'Quiz', tag: '03' },
  { to: '/checklist', label: 'Checklist', tag: '04' },
  { to: '/about', label: 'About', tag: '05' }
];

export default function TopNav() {
  const [hovered, setHovered] = useState(null);
  const prefetched = useRef(new Set());

  // Start fetching a route's chunk as soon as intent shows (hover, keyboard
  // focus, or a mobile tap landing) instead of waiting for the click — by
  // the time the navigation actually happens the code is often already in
  // the browser's cache, so the page swap feels instant.
  const prefetch = (to) => {
    if (prefetched.current.has(to)) return;
    const load = routeImports[to];
    if (!load) return;
    prefetched.current.add(to);
    load();
  };

  return (
    <header className="site-nav">
      <NavLink to="/" className="site-nav-logo">
        <span className="site-nav-logo-mark" aria-hidden="true">
          <PlaneIcon size={20} />
        </span>
        Fielded
      </NavLink>
      <nav className="site-nav-links">
        {LINKS.map((link) => (
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
        ))}
      </nav>
    </header>
  );
}
