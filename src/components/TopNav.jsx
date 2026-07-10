import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import RouteLine from './RouteLine.jsx';
import PlaneIcon from './PlaneIcon.jsx';

const LINKS = [
  { to: '/', label: 'Home', end: true, tag: '01' },
  { to: '/map', label: 'Map', tag: '02' },
  { to: '/quiz', label: 'Quiz', tag: '03' },
  { to: '/checklist', label: 'Checklist', tag: '04' },
  { to: '/about', label: 'About', tag: '05' }
];

export default function TopNav() {
  const [hovered, setHovered] = useState(null);

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
            onMouseEnter={() => setHovered(link.to)}
            onMouseLeave={() => setHovered(null)}
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
