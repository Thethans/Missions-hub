import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import UpdatesFeed from './UpdatesFeed';
import type { MissionaryUpdate } from '../data/types';

function makeUpdate(overrides: Partial<MissionaryUpdate>): MissionaryUpdate {
  return {
    date: '2 days ago',
    title: 'An update',
    text: 'Some text.',
    photo: '/photo.jpg',
    photoWidth: 800,
    photoHeight: 600,
    ...overrides
  };
}

function photoStyle(title: string) {
  const img = screen.getByAltText(new RegExp(title));
  return img.getAttribute('style') || '';
}

describe('UpdatesFeed photo aspect ratio', () => {
  it('uses the real ratio for a photo already within the thumbnail range', () => {
    // 800/600 = 1.333, well inside [0.75, 1.75] — should pass through unclamped.
    render(<UpdatesFeed updates={[makeUpdate({ title: 'Normal' })]} prayerRequests={[]} missionaryName="Jane" />);
    expect(photoStyle('Normal')).toContain('--pm-photo-aspect: 1.3333333333333333');
  });

  it('clamps an extremely wide (panoramic) photo instead of letting its true ratio disagree with the CSS min/max-width', () => {
    // 6240/3512 ≈ 1.777, just over the 112/64 = 1.75 max the thumbnail box allows.
    render(
      <UpdatesFeed
        updates={[makeUpdate({ title: 'Panorama', photoWidth: 6240, photoHeight: 3512 })]}
        prayerRequests={[]}
        missionaryName="Jane"
      />
    );
    expect(photoStyle('Panorama')).toContain('--pm-photo-aspect: 1.75');
  });

  it('clamps an extremely tall (portrait) photo to the minimum allowed ratio', () => {
    // 600/1600 = 0.375, well under the 48/64 = 0.75 min the thumbnail box allows.
    render(
      <UpdatesFeed
        updates={[makeUpdate({ title: 'Portrait', photoWidth: 600, photoHeight: 1600 })]}
        prayerRequests={[]}
        missionaryName="Jane"
      />
    );
    expect(photoStyle('Portrait')).toContain('--pm-photo-aspect: 0.75');
  });

  it('falls back to 4/3 when a photo has no known dimensions', () => {
    render(
      <UpdatesFeed
        updates={[makeUpdate({ title: 'Unknown', photoWidth: 0, photoHeight: 0 })]}
        prayerRequests={[]}
        missionaryName="Jane"
      />
    );
    expect(photoStyle('Unknown')).toContain('--pm-photo-aspect: 4 / 3');
  });
});
