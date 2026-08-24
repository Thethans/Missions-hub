import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Footer from '../components/Footer.jsx';
import PlaneIcon from '../components/PlaneIcon.jsx';
import usePageMeta from '../hooks/usePageMeta.js';

export default function NotFoundPage() {
  const { pathname } = useLocation();
  // vercel.json rewrites every unmatched URL to index.html with a 200
  // status (required so client-side routing works on a fresh load) — that
  // makes this a "soft 404" with no server-level noindex signal. Without
  // this call, a dead/mistyped URL would otherwise just keep whatever
  // <title>/description the previously-rendered page left behind (or, on a
  // crawler's first hit, index.html's own homepage defaults) and Google
  // could index it as duplicate homepage content instead of recognizing
  // it's not a real page.
  usePageMeta({
    title: 'Page Not Found',
    description: "There's no page at this address — here are the routes that do exist.",
    path: pathname,
    noindex: true
  });

  return (
    <>
      <div className="page-about page-notfound">
        <div className="notfound-plane-field" aria-hidden="true">
          <div className="notfound-plane">
            <PlaneIcon size={36} />
          </div>
        </div>
        <p className="notfound-code">404</p>
        <h1>Off the map</h1>
        <p>There's no page at this address. The routes that do exist:</p>
        <nav className="notfound-links">
          <Link to="/">Home</Link>
          <Link to="/map">Map</Link>
          <Link to="/quiz">Agency Match</Link>
          <Link to="/about">About</Link>
        </nav>
      </div>
      <Footer />
    </>
  );
}
