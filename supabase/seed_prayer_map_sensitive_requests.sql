-- Seed data for missionary_sensitive_requests (see schema.sql's
-- "Prayer map: confidential prayer requests" section, and
-- src/features/prayer-map/REAL_AUTH_DESIGN.md).
--
-- This is the demo/mock confidential text that used to be a plain field in
-- the client-bundled src/features/prayer-map/data/missionaries.ts. It now
-- lives only here, behind RLS — run this after schema.sql. missionary_id
-- values match the string ids in data/missionaries.ts.

insert into missionary_sensitive_requests (missionary_id, text) values

('johnson-ethiopia', 'The fire was not accidental. A local official opposed to our work is behind ongoing intimidation. Please pray for protection for our staff, wisdom in dealing with authorities, and that we would respond with the grace of Christ. We are keeping details off the public page for the safety of our Ethiopian team members, whose names we cannot share openly.'),
('johnson-ethiopia', 'One of our teachers, [name withheld], is facing pressure from her family to leave the ministry over her new faith. Pray for her courage and for her family''s hearts to soften.'),

('creative-access-middle-east', 'They serve among a specific unreached people group in the wider Gulf region. For the safety of national believers, the people group name and exact country are shared only with our missions committee, not on this platform. Please don''t discuss specifics outside official channels.');
