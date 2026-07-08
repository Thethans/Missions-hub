import React from 'react';
import Checklist from '../components/Checklist.jsx';
import Footer from '../components/Footer.jsx';

export default function ChecklistPage() {
  return (
    <>
      <section className="page-hero">
        <h1>Pre-Field Checklist</h1>
        <p>Everything to sort out before you deploy, tailored to your role and access level.</p>
      </section>
      <div className="page-body">
        <Checklist />
      </div>
      <Footer />
    </>
  );
}
