import React from 'react';
import './LegalPages.css';

export default function TermsPage() {
  return (
    <div className="legal-page">
      <div className="legal-content">
        <h1>Terms of Service</h1>
        <p className="last-updated"><strong>Last Updated:</strong> July 10, 2026 — <strong>Version:</strong> 1.0</p>

        <nav className="toc">
          <h2>Table of Contents</h2>
          <ol>
            <li><a href="#s1">Acceptance of Terms</a></li>
            <li><a href="#s2">Description of Service</a></li>
            <li><a href="#s3">Eligibility</a></li>
            <li><a href="#s4">User Accounts and Authentication</a></li>
            <li><a href="#s5">User Responsibilities</a></li>
            <li><a href="#s6">Prohibited Conduct</a></li>
            <li><a href="#s7">Intellectual Property and Content Ownership</a></li>
            <li><a href="#s8">Third-Party Data and Services</a></li>
            <li><a href="#s9">Disclaimer of Warranties</a></li>
            <li><a href="#s10">Limitation of Liability</a></li>
            <li><a href="#s11">Indemnification</a></li>
            <li><a href="#s12">Termination</a></li>
            <li><a href="#s13">Dispute Resolution and Governing Law</a></li>
            <li><a href="#s14">Modifications to Terms</a></li>
            <li><a href="#s15">Severability</a></li>
            <li><a href="#s16">Entire Agreement</a></li>
            <li><a href="#s17">Contact Information</a></li>
          </ol>
        </nav>

        <section id="s1">
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing or using the Fielded website and platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the Service.</p>
          <p>Your continued use of the Service after any changes to these Terms constitutes acceptance of those changes.</p>
        </section>

        <section id="s2">
          <h2>2. Description of Service</h2>
          <p>Fielded is a web-based missions-matching platform that provides:</p>
          <ul>
            <li>An interactive map displaying unreached people groups worldwide, sourced from publicly available Joshua Project data.</li>
            <li>A multi-select quiz designed to match users with mission agencies based on their interests, skills, and calling.</li>
            <li>A pre-field preparation checklist with progress tracking, available to authenticated users.</li>
            <li>Curated mission opportunity listings from partnered agencies.</li>
          </ul>
          <p>Fielded is an informational and matching tool. It does not guarantee placement with any agency, nor does it act as an employer, recruiter, or agent for any mission organization.</p>
        </section>

        <section id="s3">
          <h2>3. Eligibility</h2>
          <p>The Service is intended for individuals aged 13 and older. By using the Service, you represent that you are at least 13 years of age. If you are under 18, you represent that you have obtained parental or guardian consent to use the Service.</p>
        </section>

        <section id="s4">
          <h2>4. User Accounts and Authentication</h2>
          <p>Certain features of the Service (such as the pre-field checklist) require authentication via a magic-link email login powered by Supabase. By authenticating, you agree to:</p>
          <ul>
            <li>Provide a valid email address that you own or are authorized to use.</li>
            <li>Maintain the security of your authentication credentials.</li>
            <li>Accept responsibility for all activity that occurs under your account.</li>
          </ul>
          <p>We reserve the right to suspend or terminate accounts that appear fraudulent, inactive, or in violation of these Terms.</p>
        </section>

        <section id="s5">
          <h2>5. User Responsibilities</h2>
          <p>You agree to:</p>
          <ul>
            <li>Use the Service only for its intended purpose of exploring missions-related information and preparation.</li>
            <li>Provide accurate information when interacting with the quiz, checklist, or any other feature.</li>
            <li>Respect the intellectual property and privacy rights of others.</li>
            <li>Comply with all applicable local, state, national, and international laws.</li>
          </ul>
        </section>

        <section id="s6">
          <h2>6. Prohibited Conduct</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any unlawful purpose or in violation of any applicable law.</li>
            <li>Attempt to gain unauthorized access to any portion of the Service, other user accounts, or any systems or networks connected to the Service.</li>
            <li>Use automated means (bots, scrapers, crawlers) to access or collect data from the Service without prior written consent.</li>
            <li>Interfere with or disrupt the integrity or performance of the Service.</li>
            <li>Upload, transmit, or distribute any viruses, malware, or other harmful code.</li>
            <li>Impersonate any person or entity, or falsely represent your affiliation with any person or entity.</li>
            <li>Use the Service to send unsolicited communications (spam).</li>
            <li>Reproduce, duplicate, copy, sell, resell, or exploit any portion of the Service without express written permission.</li>
            <li>Harass, abuse, threaten, or intimidate other users.</li>
          </ul>
        </section>

        <section id="s7">
          <h2>7. Intellectual Property and Content Ownership</h2>
          <h3>7.1 Our Content</h3>
          <p>The Service and its original content (excluding third-party data), features, and functionality are owned by Fielded and are protected by copyright, trademark, and other intellectual property laws. This includes but is not limited to the website design, quiz logic, agency descriptions (where originally authored), visual identity, illustrations, and code.</p>

          <h3>7.2 Third-Party Data</h3>
          <p>People-group data displayed on the map is sourced from Joshua Project and is used in accordance with their terms. Mission agency information is sourced from publicly available materials and direct research. Fielded does not claim ownership of third-party data.</p>

          <h3>7.3 User Data</h3>
          <p>You retain ownership of any personal data you provide (such as your email address and checklist progress). By using the Service, you grant Fielded a limited, non-exclusive license to store and process this data solely for the purpose of providing the Service to you.</p>
        </section>

        <section id="s8">
          <h2>8. Third-Party Data and Services</h2>
          <p>The Service integrates with and relies upon third-party services, including:</p>
          <ul>
            <li><strong>Supabase</strong> — for user authentication and data storage.</li>
            <li><strong>Vercel</strong> — for hosting and web analytics.</li>
            <li><strong>Joshua Project</strong> — for unreached people-group data.</li>
            <li><strong>MapLibre</strong> — for interactive map rendering.</li>
          </ul>
          <p>Fielded is not responsible for the availability, accuracy, or policies of third-party services. Your use of these third-party services is subject to their respective terms and policies.</p>
          <p>Mission agencies listed on the platform are independent organizations. Fielded does not endorse, guarantee, or assume liability for any agency, its programs, safety, or outcomes.</p>
        </section>

        <section id="s9">
          <h2>9. Disclaimer of Warranties</h2>
          <p><strong>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</strong></p>
          <p><strong>FIELDED DOES NOT WARRANT THAT:</strong></p>
          <ul>
            <li>The Service will be uninterrupted, timely, secure, or error-free.</li>
            <li>The results obtained from using the Service will be accurate or reliable.</li>
            <li>Any information provided, including quiz results and agency matches, will be complete, current, or suitable for your specific circumstances.</li>
            <li>Any defects in the Service will be corrected.</li>
          </ul>
          <p>The quiz and matching features are informational tools only. Results should not be treated as professional career advice, spiritual direction, or a substitute for direct communication with mission agencies.</p>
        </section>

        <section id="s10">
          <h2>10. Limitation of Liability</h2>
          <p><strong>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL FIELDED, ITS OPERATORS, CONTRIBUTORS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF DATA, LOSS OF PROFITS, OR LOSS OF GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF OR INABILITY TO USE THE SERVICE.</strong></p>
          <p><strong>IN NO EVENT SHALL FIELDED'S TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THE USE OF THE SERVICE EXCEED THE AMOUNT YOU PAID TO FIELDED IN THE TWELVE (12) MONTHS PRIOR TO THE EVENT GIVING RISE TO THE CLAIM, OR ONE HUNDRED U.S. DOLLARS ($100), WHICHEVER IS GREATER.</strong></p>
        </section>

        <section id="s11">
          <h2>11. Indemnification</h2>
          <p>You agree to defend, indemnify, and hold harmless Fielded and its operators, contributors, and affiliates from and against any and all claims, damages, obligations, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from:</p>
          <ul>
            <li>Your use of the Service.</li>
            <li>Your violation of these Terms.</li>
            <li>Your violation of any third-party right, including any intellectual property, privacy, or other proprietary right.</li>
            <li>Any claim that your actions caused damage to a third party.</li>
          </ul>
        </section>

        <section id="s12">
          <h2>12. Termination</h2>
          <h3>12.1 By You</h3>
          <p>You may stop using the Service at any time. If you wish to delete your account and associated data, contact us at <a href="mailto:ethansantana2004@gmail.com">ethansantana2004@gmail.com</a>.</p>

          <h3>12.2 By Us</h3>
          <p>We reserve the right to suspend or terminate your access to the Service at any time, with or without cause and with or without notice, including for any violation of these Terms. Upon termination, your right to use the Service will immediately cease.</p>

          <h3>12.3 Survival</h3>
          <p>Sections 7, 9, 10, 11, 13, and 15 shall survive any termination of these Terms.</p>
        </section>

        <section id="s13">
          <h2>13. Dispute Resolution and Governing Law</h2>
          <h3>13.1 Governing Law</h3>
          <p>These Terms shall be governed by and construed in accordance with the laws of the State of South Carolina, United States, without regard to its conflict-of-law provisions.</p>

          <h3>13.2 Informal Resolution</h3>
          <p>Before filing any formal legal action, you agree to first contact us at <a href="mailto:ethansantana2004@gmail.com">ethansantana2004@gmail.com</a> and attempt to resolve the dispute informally for at least thirty (30) days.</p>

          <h3>13.3 Jurisdiction</h3>
          <p>If informal resolution is unsuccessful, any legal action or proceeding shall be brought exclusively in the state or federal courts located in South Carolina, United States, and you consent to the personal jurisdiction of such courts.</p>
        </section>

        <section id="s14">
          <h2>14. Modifications to Terms</h2>
          <p>We reserve the right to modify these Terms at any time. Material changes will be communicated by updating the "Last Updated" date at the top of this document and, where feasible, by posting a notice on the Service. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.</p>
        </section>

        <section id="s15">
          <h2>15. Severability</h2>
          <p>If any provision of these Terms is found to be unenforceable or invalid by a court of competent jurisdiction, that provision shall be enforced to the maximum extent permissible, and the remaining provisions shall remain in full force and effect.</p>
        </section>

        <section id="s16">
          <h2>16. Entire Agreement</h2>
          <p>These Terms, together with the <a href="/privacy">Privacy Policy</a>, constitute the entire agreement between you and Fielded regarding your use of the Service and supersede all prior agreements and understandings.</p>
        </section>

        <section id="s17">
          <h2>17. Contact Information</h2>
          <p>For questions about these Terms, contact us at:</p>
          <p><strong>Email:</strong> <a href="mailto:ethansantana2004@gmail.com">ethansantana2004@gmail.com</a></p>
        </section>
      </div>
    </div>
  );
}
