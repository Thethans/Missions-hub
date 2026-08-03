import React from 'react';
import { Navigate } from 'react-router-dom';
import Footer from '../components/Footer.jsx';
import AdminReviewQueue from '../components/AdminReviewQueue.jsx';
import useSupabaseSession from '../hooks/useSupabaseSession.js';
import useIsAdmin from '../hooks/useIsAdmin.js';
import usePageMeta from '../hooks/usePageMeta.js';

// Gated to active verified_members.is_admin (see useIsAdmin.js) rather than
// a hardcoded user id — reuses the same admin concept the DB-level RLS
// policies in supabase/schema.sql already enforce, so this check is a UX
// nicety on top of a real boundary, not the boundary itself (same framing
// as prayer-map's AdminPage.tsx).
export default function AdminReviewQueuePage() {
  usePageMeta({
    title: 'Review Queue',
    description: 'Admin review queue for pending missionary and church profiles.',
    path: '/admin/review-queue',
    noindex: true
  });

  const { session, loading: sessionLoading } = useSupabaseSession();
  const { isAdmin, loading: adminLoading } = useIsAdmin(sessionLoading ? undefined : session);

  if (sessionLoading || adminLoading) {
    return (
      <div className="page-body">
        <p className="onboarding-loading" role="status">Loading…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <section className="page-hero">
        <h1>Review queue</h1>
        <p>Pending missionary and church profile submissions.</p>
      </section>
      <div className="page-body">
        <AdminReviewQueue />
      </div>
      <Footer />
    </>
  );
}
