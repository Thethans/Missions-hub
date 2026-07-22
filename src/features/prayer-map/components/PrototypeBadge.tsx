import { Link } from 'react-router-dom';

/**
 * This whole feature is a working demo, not a live product (see the
 * "Support map (prototype)" section on /about) — every missionary, budget,
 * prayer request, and donation is mock data. That disclosure only existed
 * in prose on /about; anyone landing on /prayer-map or its admin page
 * directly (a shared link, nav exploration) had no on-page signal of it.
 */
export default function PrototypeBadge() {
  return (
    <p className="pm-prototype-badge">
      Prototype — sample data only, nothing here is real. <Link to="/about">Read more</Link>
    </p>
  );
}
