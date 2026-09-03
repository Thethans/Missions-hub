import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChurchMissionaryCard from './ChurchMissionaryCard.jsx';

function makeMissionary(overrides = {}) {
  return {
    id: 'm1',
    full_name: 'Jordan Reyes',
    sending_agency: 'Frontier Fellowship',
    ministry_field: 'Church planting',
    family_summary: 'Serving with their two kids since 2021.',
    photo_url: null,
    contact_email: null,
    currentPrayerNeed: null,
    pastPrayerNeeds: [],
    latestMediaUpdate: null,
    ...overrides
  };
}

describe('ChurchMissionaryCard', () => {
  it('renders the name, agency, and ministry field', () => {
    render(<ChurchMissionaryCard missionary={makeMissionary()} />);

    expect(screen.getByText('Jordan Reyes')).toBeInTheDocument();
    expect(screen.getByText('Frontier Fellowship')).toBeInTheDocument();
    expect(screen.getByText('Church planting')).toBeInTheDocument();
  });

  it('falls back to initials when there is no photo', () => {
    render(<ChurchMissionaryCard missionary={makeMissionary()} />);

    expect(screen.getByText('JR')).toBeInTheDocument();
  });

  it('shows the current prayer need in an always-visible strip', () => {
    render(
      <ChurchMissionaryCard
        missionary={makeMissionary({
          currentPrayerNeed: { id: 'n1', need_text: 'Wisdom for a difficult visa renewal.' }
        })}
      />
    );

    expect(screen.getByText('Wisdom for a difficult visa renewal.')).toBeInTheDocument();
  });

  it('does not render a prayer-need strip when there is no current need', () => {
    render(<ChurchMissionaryCard missionary={makeMissionary()} />);

    expect(screen.queryByText(/prayer/i)).not.toBeInTheDocument();
  });

  it('collapses past prayer needs under a disclosure, closed by default', () => {
    render(
      <ChurchMissionaryCard
        missionary={makeMissionary({
          pastPrayerNeeds: [
            { id: 'n2', need_text: 'Safe travel during furlough.' },
            { id: 'n3', need_text: 'Language school progress.' }
          ]
        })}
      />
    );

    const disclosure = screen.getByText('Past prayer needs (2)').closest('details');
    expect(disclosure).not.toHaveAttribute('open');
    expect(screen.getByText('Safe travel during furlough.')).toBeInTheDocument();
  });

  it('does not render the past-needs disclosure when there are none', () => {
    render(<ChurchMissionaryCard missionary={makeMissionary()} />);

    expect(screen.queryByText(/past prayer needs/i)).not.toBeInTheDocument();
  });

  it('renders a photo thumbnail for the latest media update', () => {
    render(
      <ChurchMissionaryCard
        missionary={makeMissionary({
          latestMediaUpdate: { id: 'u1', media_type: 'photo', url: 'https://example.com/p.jpg', caption: 'New well dedication' }
        })}
      />
    );

    const img = screen.getByAltText('');
    expect(img.tagName).toBe('IMG');
    expect(screen.getByText('New well dedication')).toBeInTheDocument();
  });

  it('renders a video placeholder (not an <img>) for a video media update', () => {
    render(
      <ChurchMissionaryCard
        missionary={makeMissionary({
          latestMediaUpdate: { id: 'u2', media_type: 'video', url: 'https://youtube.com/embed/xyz', caption: null }
        })}
      />
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders a mailto contact link when a contact email is present', () => {
    render(
      <ChurchMissionaryCard missionary={makeMissionary({ contact_email: 'jordan@example.org' })} />
    );

    expect(screen.getByRole('link', { name: /contact/i })).toHaveAttribute(
      'href',
      'mailto:jordan@example.org'
    );
  });
});
