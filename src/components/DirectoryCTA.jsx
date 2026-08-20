import React from 'react';
import { Link } from 'react-router-dom';
import RevealOnScroll from './RevealOnScroll.jsx';

export default function DirectoryCTA({ heading, body, linkTo, linkLabel }) {
  return (
    <RevealOnScroll className="directory-cta">
      <h2>{heading}</h2>
      <p>{body}</p>
      <Link to={linkTo} className="cta-button">{linkLabel}</Link>
    </RevealOnScroll>
  );
}
