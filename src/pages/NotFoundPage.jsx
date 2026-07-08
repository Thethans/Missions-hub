import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer.jsx';

export default function NotFoundPage() {
  return (
    <>
      <div className="page-about page-notfound">
        <p className="notfound-code">404</p>
        <h1>Off the map</h1>
        <p>There's no page at this address. The routes that do exist:</p>
        <nav className="notfound-links">
          <Link to="/">Home</Link>
          <Link to="/map">Map</Link>
          <Link to="/quiz">Quiz</Link>
          <Link to="/checklist">Checklist</Link>
          <Link to="/about">About</Link>
        </nav>
      </div>
      <Footer />
    </>
  );
}
