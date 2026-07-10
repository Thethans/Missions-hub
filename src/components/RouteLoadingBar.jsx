import React from 'react';

// Suspense fallback for lazy-loaded routes — with hover/focus prefetching in
// TopNav this rarely shows at all, but on a direct/slow load it gives
// immediate feedback instead of a blank flash where the page content was.
export default function RouteLoadingBar() {
  return (
    <div className="route-loading-bar" role="status" aria-label="Loading page">
      <div className="route-loading-bar-fill" />
    </div>
  );
}
