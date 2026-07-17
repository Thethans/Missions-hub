import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer.jsx';
import PlaneIcon from '../components/PlaneIcon.jsx';

export default function NotFoundPage() {
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
          <Link to="/checklist">Checklist</Link>
          <Link to="/about">About</Link>
        </nav>
      </div>
      <Footer />
    </>
  );
}
