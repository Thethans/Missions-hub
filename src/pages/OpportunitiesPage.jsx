import React from 'react';
import { useSearchParams } from 'react-router-dom';
import OpportunitiesExplorer from '../components/OpportunitiesExplorer.jsx';
import Footer from '../components/Footer.jsx';

export default function OpportunitiesPage() {
  const [params] = useSearchParams();
  const agencyFilter = params.get('agency') || '';

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
