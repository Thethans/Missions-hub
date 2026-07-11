import React from 'react';
import './LegalPages.css';

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <div className="legal-content">
        <h1>Privacy Policy</h1>
        <p className="last-updated"><strong>Last Updated:</strong> July 10, 2026 — <strong>Version:</strong> 1.0</p>

        <nav className="toc">
          <h2>Table of Contents</h2>
          <ol>
            <li><a href="#s1">Introduction</a></li>
            <li><a href="#s2">Information We Collect</a></li>
            <li><a href="#s3">How We Use Your Information</a></li>
            <li><a href="#s4">Legal Basis for Processing (GDPR)</a></li>
            <li><a href="#s5">Data Retention</a></li>
            <li><a href="#s6">How We Share Your Information</a></li>
            <li><a href="#s7">Cookies and Tracking Technologies</a></li>
            <li><a href="#s8">Your Rights</a></li>
            <li><a href="#s9">CCPA/CPRA Disclosures (California Residents)</a></li>
            <li><a href="#s10">Data Security</a></li>
            <li><a href="#s11">Children's Privacy</a></li>
            <li><a href="#s12">International Data Transfers</a></li>
            <li><a href="#s13">Third-Party Links and Services</a></li>
            <li><a href="#s14">Changes to This Policy</a></li>
            <li><a href="#s15">Contact and Complaint Procedures</a></li>
          </ol>
        </nav>

        <section id="s1">
          <h2>1. Introduction</h2>
          <p>Fielded ("we," "us," or "our") operates a web-based missions-matching platform that helps individuals explore unreached people groups, discover mission agencies, and prepare for missions service. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services (collectively, the "Service").</p>
          <p>By using the Service, you consent to the data practices described in this policy. If you do not agree, please do not use the Service.</p>
        </section>

        <section id="s2">
          <h2>2. Information We Collect</h2>

          <h3>2.1 Information You Provide Directly</h3>
          <table className="info-table">
            <thead>
              <tr><th>Data Type</th><th>When Collected</th><th>Purpose</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>Email address</strong></td><td>When you sign in to access the pre-field checklist (magic-link authentication)</td><td>Account creation, authentication, communication</td></tr>
              <tr><td><strong>Quiz responses</strong></td><td>When you complete the missions-matching quiz</td><td>Generating personalized agency matches</td></tr>
              <tr><td><strong>Checklist progress</strong></td><td>When you interact with the pre-field checklist</td><td>Saving and displaying your preparation progress</td></tr>
            </tbody>
          </table>

          <h3>2.2 Information Collected Automatically</h3>
          <table className="info-table">
            <thead>
              <tr><th>Data Type</th><th>Collection Method</th><th>Purpose</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>Usage analytics</strong></td><td>Vercel Web Analytics (privacy-focused, no cookies)</td><td>Understanding how the Service is used, improving performance</td></tr>
              <tr><td><strong>Device and browser information</strong></td><td>Vercel Web Analytics</td><td>Service optimization and compatibility</td></tr>
              <tr><td><strong>Page views and navigation paths</strong></td><td>Vercel Web Analytics</td><td>Understanding user engagement</td></tr>
              <tr><td><strong>IP address</strong></td><td>Server logs (Vercel, Supabase)</td><td>Security, abuse prevention, approximate geolocation for analytics</td></tr>
            </tbody>
          </table>

          <h3>2.3 Information from Third Parties</h3>
          <p>We do not purchase or receive personal information about you from third parties. People-group data displayed on the Service is sourced from Joshua Project and does not contain personal information about individual users.</p>
        </section>

        <section id="s3">
          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect for the following purposes:</p>
          <ul>
            <li><strong>Providing the Service</strong> — authenticating your identity, saving your checklist progress, generating quiz matches, and displaying relevant content.</li>
            <li><strong>Improving the Service</strong> — analyzing aggregate usage patterns to improve features, performance, and user experience.</li>
            <li><strong>Security and abuse prevention</strong> — detecting, investigating, and preventing fraudulent, unauthorized, or illegal activity.</li>
            <li><strong>Communication</strong> — sending you authentication emails (magic links). We do not send marketing emails unless you explicitly opt in.</li>
            <li><strong>Legal compliance</strong> — complying with applicable laws, regulations, and legal processes.</li>
          </ul>
          <p>We do <strong>not</strong> use your data for:</p>
          <ul>
            <li>Selling to third parties.</li>
            <li>Targeted advertising.</li>
            <li>Automated decision-making with legal or similarly significant effects.</li>
            <li>AI model training.</li>
          </ul>
        </section>

        <section id="s4">
          <h2>4. Legal Basis for Processing (GDPR)</h2>
          <p>If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland, we process your personal data under the following legal bases:</p>
          <table className="info-table">
            <thead>
              <tr><th>Legal Basis</th><th>Data & Purpose</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>Consent</strong></td><td>Processing your email for magic-link authentication (you initiate the sign-in)</td></tr>
              <tr><td><strong>Contract performance</strong></td><td>Storing checklist progress and quiz results to deliver the Service you requested</td></tr>
              <tr><td><strong>Legitimate interests</strong></td><td>Usage analytics for service improvement; security monitoring and abuse prevention</td></tr>
              <tr><td><strong>Legal obligation</strong></td><td>Retaining data as required by applicable laws</td></tr>
            </tbody>
          </table>
          <p>You may withdraw consent at any time by contacting us or deleting your account, without affecting the lawfulness of processing based on consent before its withdrawal.</p>
        </section>

        <section id="s5">
          <h2>5. Data Retention</h2>
          <p>We retain your data only as long as necessary for the purposes described in this policy:</p>
          <table className="info-table">
            <thead>
              <tr><th>Data Type</th><th>Retention Period</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>Email address and account data</strong></td><td>Until you request deletion or your account is terminated</td></tr>
              <tr><td><strong>Checklist progress</strong></td><td>Until you request deletion or your account is terminated</td></tr>
              <tr><td><strong>Quiz responses</strong></td><td>Not stored server-side; processed in-browser only</td></tr>
              <tr><td><strong>Usage analytics (Vercel)</strong></td><td>Aggregated; individual data retained per Vercel's data retention policy (typically 30 days for raw data)</td></tr>
              <tr><td><strong>Server logs</strong></td><td>Up to 90 days</td></tr>
            </tbody>
          </table>
          <p>Upon account deletion, we will remove your personal data from our active systems within 30 days. Residual copies in backups may persist for up to 90 additional days before being overwritten.</p>
        </section>

        <section id="s6">
          <h2>6. How We Share Your Information</h2>
          <p>We do <strong>not</strong> sell, rent, or trade your personal information. We share data only in the following limited circumstances:</p>

          <h3>6.1 Service Providers (Data Processors)</h3>
          <table className="info-table">
            <thead>
              <tr><th>Provider</th><th>Data Shared</th><th>Purpose</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>Supabase</strong></td><td>Email address, authentication tokens, checklist progress</td><td>Database hosting, user authentication</td></tr>
              <tr><td><strong>Vercel</strong></td><td>Usage analytics, IP address (anonymized)</td><td>Website hosting, analytics</td></tr>
            </tbody>
          </table>
          <p>These providers process data on our behalf under contractual obligations to protect your data and use it only for the specified purposes.</p>

          <h3>6.2 Legal Requirements</h3>
          <p>We may disclose your information if required to do so by law or in response to valid legal requests by public authorities (e.g., a court order or government agency).</p>

          <h3>6.3 Business Transfers</h3>
          <p>In the event of a merger, acquisition, or sale of assets, your personal data may be transferred. We will provide notice before your data is transferred and becomes subject to a different privacy policy.</p>

          <h3>6.4 With Your Consent</h3>
          <p>We may share your information for other purposes with your explicit consent.</p>
        </section>

        <section id="s7">
          <h2>7. Cookies and Tracking Technologies</h2>

          <h3>7.1 Our Approach</h3>
          <p>Fielded uses <strong>Vercel Web Analytics</strong>, which is a privacy-focused analytics service that does <strong>not</strong> use cookies or track individual users across sites. It collects aggregate, anonymized usage data.</p>

          <h3>7.2 Essential Cookies</h3>
          <p>The Service uses essential cookies only for authentication session management (set by Supabase). These cookies are strictly necessary for the Service to function and cannot be opted out of while using authenticated features.</p>
          <table className="info-table">
            <thead>
              <tr><th>Cookie</th><th>Purpose</th><th>Duration</th></tr>
            </thead>
            <tbody>
              <tr><td>Supabase auth token</td><td>Maintaining your authenticated session</td><td>Session / up to 1 week</td></tr>
            </tbody>
          </table>

          <h3>7.3 No Third-Party Tracking</h3>
          <p>We do <strong>not</strong> use:</p>
          <ul>
            <li>Third-party advertising cookies.</li>
            <li>Social media tracking pixels.</li>
            <li>Cross-site tracking technologies.</li>
            <li>Google Analytics or similar cookie-based analytics.</li>
          </ul>
        </section>

        <section id="s8">
          <h2>8. Your Rights</h2>
          <p>Depending on your location, you may have some or all of the following rights regarding your personal data:</p>
          <table className="info-table">
            <thead>
              <tr><th>Right</th><th>Description</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>Access</strong></td><td>Request a copy of the personal data we hold about you</td></tr>
              <tr><td><strong>Correction</strong></td><td>Request correction of inaccurate or incomplete data</td></tr>
              <tr><td><strong>Deletion</strong></td><td>Request deletion of your personal data</td></tr>
              <tr><td><strong>Portability</strong></td><td>Request your data in a structured, commonly used, machine-readable format</td></tr>
              <tr><td><strong>Objection</strong></td><td>Object to processing based on legitimate interests</td></tr>
              <tr><td><strong>Restriction</strong></td><td>Request that we restrict processing of your data</td></tr>
              <tr><td><strong>Withdraw consent</strong></td><td>Withdraw consent at any time where processing is based on consent</td></tr>
              <tr><td><strong>Complaint</strong></td><td>Lodge a complaint with a supervisory authority</td></tr>
            </tbody>
          </table>
          <p>To exercise any of these rights, contact us at <a href="mailto:ethansantana2004@gmail.com">ethansantana2004@gmail.com</a>. We will respond within 30 days (or within the timeframe required by applicable law).</p>
          <p>We will not discriminate against you for exercising any of these rights.</p>
        </section>

        <section id="s9">
          <h2>9. CCPA/CPRA Disclosures (California Residents)</h2>

          <h3>9.1 Categories of Personal Information Collected</h3>
          <p>In the preceding 12 months, we have collected the following categories of personal information:</p>
          <ul>
            <li><strong>Identifiers:</strong> email address.</li>
            <li><strong>Internet or network activity:</strong> browsing history on our Service, page views, interactions with features.</li>
          </ul>

          <h3>9.2 Sale and Sharing of Personal Information</h3>
          <p>We do <strong>not</strong> sell your personal information. We do <strong>not</strong> share your personal information for cross-context behavioral advertising.</p>

          <h3>9.3 Your California Rights</h3>
          <ul>
            <li><strong>Right to Know:</strong> You may request the categories and specific pieces of personal information we have collected about you.</li>
            <li><strong>Right to Delete:</strong> You may request deletion of your personal information.</li>
            <li><strong>Right to Correct:</strong> You may request correction of inaccurate personal information.</li>
            <li><strong>Right to Opt-Out of Sale/Sharing:</strong> Not applicable — we do not sell or share personal information.</li>
            <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your CCPA/CPRA rights.</li>
          </ul>
          <p>To exercise these rights, contact us at <a href="mailto:ethansantana2004@gmail.com">ethansantana2004@gmail.com</a>.</p>

          <h3>9.4 Authorized Agents</h3>
          <p>You may designate an authorized agent to submit requests on your behalf. The agent must provide written authorization from you, and we may require you to verify your identity directly.</p>
        </section>

        <section id="s10">
          <h2>10. Data Security</h2>
          <p>We implement reasonable administrative, technical, and physical safeguards to protect your personal data, including:</p>
          <ul>
            <li>Encryption of data in transit (TLS/HTTPS).</li>
            <li>Authentication via secure, tokenized magic links (no passwords stored).</li>
            <li>Row-level security policies on our Supabase database.</li>
            <li>Access controls limiting data access to necessary service functions.</li>
            <li>Regular security updates to our dependencies and hosting infrastructure.</li>
          </ul>
          <p>No method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your personal data, we cannot guarantee absolute security.</p>
        </section>

        <section id="s11">
          <h2>11. Children's Privacy</h2>
          <p>The Service is not directed at children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal data from a child under 13 without parental consent, we will take steps to delete that information promptly.</p>
          <p>If you are a parent or guardian and believe your child has provided us with personal information, please contact us at <a href="mailto:ethansantana2004@gmail.com">ethansantana2004@gmail.com</a>.</p>
        </section>

        <section id="s12">
          <h2>12. International Data Transfers</h2>
          <p>The Service is hosted in the United States. If you access the Service from outside the United States, your information may be transferred to, stored, and processed in the United States, where data protection laws may differ from those in your country.</p>
          <p>If you are in the EEA, UK, or Switzerland, we rely on the following transfer mechanisms:</p>
          <ul>
            <li>Standard Contractual Clauses (SCCs) where applicable.</li>
            <li>Data processing agreements with our service providers (Supabase, Vercel).</li>
          </ul>
          <p>By using the Service, you consent to the transfer of your information to the United States.</p>
        </section>

        <section id="s13">
          <h2>13. Third-Party Links and Services</h2>
          <p>The Service may contain links to third-party websites, including mission agency websites. We are not responsible for the privacy practices or content of these external sites. We encourage you to read the privacy policies of any third-party sites you visit.</p>
        </section>

        <section id="s14">
          <h2>14. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. Changes will be indicated by updating the "Last Updated" date at the top of this document. Material changes may also be communicated via a notice on the Service.</p>
          <p>Your continued use of the Service after any changes constitutes acceptance of the updated policy.</p>

          <h3>Change Log</h3>
          <table className="info-table">
            <thead>
              <tr><th>Version</th><th>Date</th><th>Description</th></tr>
            </thead>
            <tbody>
              <tr><td>1.0</td><td>July 10, 2026</td><td>Initial version</td></tr>
            </tbody>
          </table>
        </section>

        <section id="s15">
          <h2>15. Contact and Complaint Procedures</h2>

          <h3>15.1 Contact Us</h3>
          <p>For questions, concerns, or requests regarding this Privacy Policy or your personal data, contact us at:</p>
          <p><strong>Email:</strong> <a href="mailto:ethansantana2004@gmail.com">ethansantana2004@gmail.com</a></p>

          <h3>15.2 Complaints</h3>
          <p>If you believe your data protection rights have been violated, you have the right to lodge a complaint with:</p>
          <ul>
            <li><strong>Us</strong> — contact us first and we will work to resolve your concern.</li>
            <li><strong>Your local data protection authority</strong> — if you are in the EEA, you may contact your local supervisory authority. A list is available at <a href="https://edpb.europa.eu/about-edpb/about-edpb/members_en" target="_blank" rel="noopener noreferrer">https://edpb.europa.eu/about-edpb/about-edpb/members_en</a>.</li>
            <li><strong>The UK Information Commissioner's Office (ICO)</strong> — if you are in the United Kingdom.</li>
          </ul>
          <p>We aim to respond to all complaints within 30 days.</p>
        </section>
      </div>
    </div>
  );
}
