import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import RouteLine from './RouteLine.jsx';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/map', label: 'Map' },
  { to: '/quiz', label: 'Quiz' },
  { to: '/checklist', label: 'Checklist' },
  { to: '/about', label: 'About' }
];

export default function TopNav() {
  const [hovered, setHovered] = useState(null);

  return (
    <header className="site-nav">
      <NavLink to="/" className="site-nav-logo">Fielded</NavLink>
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
