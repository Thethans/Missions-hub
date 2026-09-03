import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import Footer from '../components/Footer.jsx';
import ChurchMissionaryCard from '../components/ChurchMissionaryCard.jsx';
import usePageMeta from '../hooks/usePageMeta.js';
import useSupabaseSession from '../hooks/useSupabaseSession.js';
import useChurchMembership from '../hooks/useChurchMembership.js';
import useChurchMissionaries from '../hooks/useChurchMissionaries.js';

// Auth/role gate for the whole church-private missionary directory. This is
// a UX nicety on top of the real boundary — church_missionary_profiles has
// no public select policy at all, so a non-member's queries come back empty
// regardless of what this component does (same framing as
// AdminReviewQueuePage.jsx). Card/map/globe view components (later steps)
// render inside here once role is known to be 'admin' or 'member'.
export default function ChurchMissionariesPage() {
  const { churchId } = useParams();

  usePageMeta({
    title: 'Our Missionaries',
    description: "Your church's private missionary directory.",
    path: `/church/${churchId}/missionaries`,
    noindex: true
  });

  const { session, loading: sessionLoading } = useSupabaseSession();
  const { role, loading: roleLoading } = useChurchMembership(
    sessionLoading ? undefined : session,
    churchId
  );
  const { missionaries, loading: missionariesLoading, error } = useChurchMissionaries(
    role ? churchId : null
  );

  if (sessionLoading || roleLoading) {
    return (
      <div className="page-body">
        <p className="onboarding-loading" role="status">Loading…</p>
      </div>
    );
  }

  if (!session || !role) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <section className="page-hero">
        <h1>Our missionaries</h1>
      </section>
      <div className="cm-explorer page-body">
        {missionariesLoading && (
          <p className="cm-loading" role="status">Loading missionaries…</p>
        )}
        {error && (
          <p className="cm-error" role="alert">
            Couldn't load your missionary directory right now — try refreshing the page.
          </p>
        )}
        {!missionariesLoading && !error && missionaries.length === 0 && (
          <p className="cm-empty" role="status">
            No missionaries have been added to this church's directory yet.
          </p>
        )}
        {!missionariesLoading && !error && missionaries.length > 0 && (
          <div className="cm-grid">
            {missionaries.map((missionary, index) => (
              <ChurchMissionaryCard key={missionary.id} missionary={missionary} index={index} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
