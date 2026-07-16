import { useEffect } from 'react';

const SITE_NAME = 'Fielded';
// Single source of truth for the site's host — P3-A (custom domain) is a
// one-line change here (or set VITE_SITE_URL and skip the code edit
// entirely). index.html's static tags and public/sitemap.xml can't read
// this at runtime (see the comments there); everything else that needs the
// real domain — every page's canonical/OG tags via usePageMeta, which is
// what scripts/prerender.js actually snapshots into the shipped HTML —
// goes through this constant.
export const BASE_URL = import.meta.env.VITE_SITE_URL || 'https://missions-hub.vercel.app';
const DEFAULT_IMAGE = BASE_URL + '/og-image.png';

const DEFAULT_DESC =
  'Find the people still waiting to hear, the agencies who can send you, and everything in between.';

export default function usePageMeta({ title, description, path = '/' }) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Get to the Field`;
    const desc = description || DEFAULT_DESC;
    const url = BASE_URL + path;

    document.title = fullTitle;

    setMeta('description', desc);
    setMeta('og:title', fullTitle, 'property');
    setMeta('og:description', desc, 'property');
    setMeta('og:url', url, 'property');
    setMeta('og:image', DEFAULT_IMAGE, 'property');
    setMeta('twitter:title', fullTitle, 'name');
    setMeta('twitter:description', desc, 'name');
    setMeta('twitter:image', DEFAULT_IMAGE, 'name');

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', url);
  }, [title, description, path]);
}

function setMeta(key, content, attr = 'name') {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}
