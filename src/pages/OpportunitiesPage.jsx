import React from 'react';
import { useSearchParams } from 'react-router-dom';
import OpportunitiesExplorer from '../components/OpportunitiesExplorer.jsx';
import Footer from '../components/Footer.jsx';
import usePageMeta from '../hooks/usePageMeta.js';

export default function OpportunitiesPage() {
  const [params] = useSearchParams();
  const agencyFilter = params.get('agency') || '';
  usePageMeta({
    title: 'Opportunities',
    description: 'Browse live mission openings from 7+ agencies. Filter by region, role type, or term length.',
    path: '/opportunities'
  });

  return (
    <>
      <section className="page-hero page-hero--compact">
        <h1>Opportunities</h1>
        <p>
          Live openings scraped weekly from mission agency websites. Filter by
          region, role, or agency — or let your quiz results guide you.
        </p>
      </section>
      <div className="page-body">
        <OpportunitiesExplorer agencyFilter={agencyFilter} />
      </div>
      <Footer />
    </>
  );
}
