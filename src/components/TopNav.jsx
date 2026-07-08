import React from 'react';
import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/map', label: 'Map' },
  { to: '/quiz', label: 'Quiz' },
  { to: '/checklist', label: 'Checklist' },
  { to: '/about', label: 'About' }
];

export default function TopNav() {
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
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
