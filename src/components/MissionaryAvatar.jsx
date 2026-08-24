import React from 'react';
import { initials } from '../data/missionaryDisplay.js';

// Shared between MissionaryDirectory's card grid and MissionaryProfile's
// header — same fallback rule in both places. Honest empty state when
// there's no headshot_url: initials, not a generic person silhouette
// pretending to be a real photo. aria-hidden either way since the
// missionary's name is always rendered right next to this and already
// carries the same information for assistive tech.
export default function MissionaryAvatar({ missionary, className }) {
  if (missionary.headshot_url) {
    return <img src={missionary.headshot_url} alt="" className={className} />;
  }
  return (
    <span className={`${className} ${className}--initials`} aria-hidden="true">
      {initials(missionary.display_name)}
    </span>
  );
}
