-- Seed data for checklist_items
-- Assumes pgcrypto extension enabled (gen_random_uuid()) — default on Supabase.
-- role_tags: long_term, short_term, marketplace_tentmaker (empty array = universal)
-- access_tags: open_access, creative_access, restricted_access (empty array = universal)

insert into checklist_items (id, category, title, description, external_link, role_tags, access_tags, sort_order) values

-- LEGAL & DOCUMENTATION
(gen_random_uuid(), 'legal', 'Valid passport (12+ months remaining)', 'Most countries require at least 6-12 months validity beyond your entry date.', null, '{}', '{}', 10),
(gen_random_uuid(), 'legal', 'Entry visa or long-term residency permit', 'Requirements vary widely by country and by role type — confirm with your sending agency.', null, '{}', '{}', 20),
(gen_random_uuid(), 'legal', 'Criminal background check (national + local)', null, null, '{}', '{}', 30),
(gen_random_uuid(), 'legal', 'Notarized will and power of attorney', null, null, '{long_term,marketplace_tentmaker}', '{}', 40),
(gen_random_uuid(), 'legal', 'Guardianship documents for minor children', 'If applicable.', null, '{long_term}', '{}', 50),
(gen_random_uuid(), 'legal', 'Copies of vital documents with a trusted contact', 'Birth certificate, marriage certificate, passport photo page.', null, '{}', '{}', 60),
(gen_random_uuid(), 'legal', 'Work or business registration/permit', null, null, '{marketplace_tentmaker}', '{}', 70),
(gen_random_uuid(), 'legal', 'Letter of invitation or partnership agreement', 'From local host, church, or partner organization.', null, '{long_term,marketplace_tentmaker}', '{}', 80),
(gen_random_uuid(), 'legal', 'Registered with home embassy in destination country', 'e.g. U.S. State Department STEP program or equivalent.', null, '{}', '{}', 90),
(gen_random_uuid(), 'legal', 'Additional permits confirmed for sensitive-access context', 'Check with your sending agency on country-specific requirements.', null, '{}', '{creative_access,restricted_access}', 100),

-- FINANCIAL
(gen_random_uuid(), 'financial', 'Personal/family field budget built', 'Cost of living, housing, transportation, ministry expenses.', null, '{}', '{}', 110),
(gen_random_uuid(), 'financial', 'Support-raising goal and plan finalized', null, null, '{long_term}', '{}', 120),
(gen_random_uuid(), 'financial', 'Sending agency financial/accountability structure confirmed', null, null, '{long_term,marketplace_tentmaker}', '{}', 130),
(gen_random_uuid(), 'financial', 'Bank access arranged for time abroad', 'International-friendly card or local account plan.', null, '{}', '{}', 140),
(gen_random_uuid(), 'financial', 'International health insurance policy active', null, null, '{}', '{}', 150),
(gen_random_uuid(), 'financial', 'Home-country tax filing plan for time abroad', null, null, '{long_term,marketplace_tentmaker}', '{}', 160),
(gen_random_uuid(), 'financial', 'Emergency evacuation coverage funded', null, null, '{}', '{creative_access,restricted_access}', 170),
(gen_random_uuid(), 'financial', 'Trip cost estimate finalized', 'Flights, lodging, in-country costs.', null, '{short_term}', '{}', 180),

-- MEDICAL
(gen_random_uuid(), 'medical', 'Physical exam and dental checkup completed', null, null, '{}', '{}', 190),
(gen_random_uuid(), 'medical', 'Required and recommended vaccinations received', 'Check CDC/WHO guidance for destination.', null, '{}', '{}', 200),
(gen_random_uuid(), 'medical', 'Prescription medication supply arranged', 'Carry generic names for customs; check destination-country legality.', null, '{}', '{}', 210),
(gen_random_uuid(), 'medical', 'Mental health/wellness check-in completed', null, null, '{long_term}', '{}', 220),
(gen_random_uuid(), 'medical', 'Medical evacuation coverage confirmed', null, null, '{long_term,marketplace_tentmaker}', '{}', 230),
(gen_random_uuid(), 'medical', 'Region-specific medication plan (e.g. malaria prophylaxis)', null, null, '{}', '{}', 240),
(gen_random_uuid(), 'medical', 'Travel health kit packed', 'First aid basics, water purification, etc.', null, '{}', '{}', 250),

-- TRAINING
(gen_random_uuid(), 'training', 'Cross-cultural ministry training completed', null, null, '{long_term}', '{}', 260),
(gen_random_uuid(), 'training', 'Language-learning plan started', null, null, '{long_term,marketplace_tentmaker}', '{}', 270),
(gen_random_uuid(), 'training', 'Security and situational awareness training completed', null, null, '{}', '{creative_access,restricted_access}', 280),
(gen_random_uuid(), 'training', 'Digital security practices reviewed', 'Secure communication and data-handling habits with your team.', null, '{}', '{creative_access,restricted_access}', 290),
(gen_random_uuid(), 'training', 'Member care / crisis response orientation completed', null, null, '{long_term}', '{}', 300),
(gen_random_uuid(), 'training', 'Short-term team orientation attended', null, null, '{short_term}', '{}', 310),
(gen_random_uuid(), 'training', 'Relevant business/industry certification obtained', 'For tentmaker/marketplace roles requiring professional credentials.', null, '{marketplace_tentmaker}', '{}', 320),

-- TEAM & LOGISTICS
(gen_random_uuid(), 'team_logistics', 'Sending agency pre-field requirements fully completed', null, null, '{}', '{}', 330),
(gen_random_uuid(), 'team_logistics', 'Home church commissioning service scheduled', null, null, '{long_term,marketplace_tentmaker}', '{}', 340),
(gen_random_uuid(), 'team_logistics', 'Prayer and support team recruited', null, null, '{}', '{}', 350),
(gen_random_uuid(), 'team_logistics', 'Communication plan with supporters established', 'How and how often you''ll send updates.', null, '{}', '{}', 360),
(gen_random_uuid(), 'team_logistics', 'Emergency contact plan shared with family and agency', null, null, '{}', '{}', 370),
(gen_random_uuid(), 'team_logistics', 'Housing arranged for arrival', 'Or a concrete plan for the first weeks.', null, '{long_term,marketplace_tentmaker}', '{}', 380),
(gen_random_uuid(), 'team_logistics', 'Role and expectations confirmed with field team', null, null, '{}', '{}', 390),

-- DEPARTURE
(gen_random_uuid(), 'departure', 'Flights booked', null, null, '{}', '{}', 400),
(gen_random_uuid(), 'departure', 'Luggage packed within limits', 'Airline and any agency-specific packing guidelines.', null, '{}', '{}', 410),
(gen_random_uuid(), 'departure', 'Farewell/goodbye gatherings scheduled', null, null, '{long_term}', '{}', 420),
(gen_random_uuid(), 'departure', 'Final departure checklist reviewed with sending agency', null, null, '{}', '{}', 430),
(gen_random_uuid(), 'departure', 'Phone/communication plan activated for destination', null, null, '{}', '{}', 440);
