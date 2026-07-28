-- Seed data for the missionaries table (see schema.sql's "Prayer map:
-- missionary records" section, and src/features/prayer-map/REAL_AUTH_DESIGN.md
-- Stage 2). Run this once after schema.sql, on a fresh database.
--
-- This is the exact same 5-missionary mock dataset that used to be
-- hardcoded in src/features/prayer-map/data/missionaries.ts (nothing here
-- is fabricated or new) — moved so it's admin-editable via
-- /prayer-map/admin without a code deploy. Update photos now point at
-- public/prayer-map-photos/ (stable, unhashed paths) instead of the old
-- Vite-bundled asset imports, which had per-build content hashes that
-- can't be stored in a database row. Confidential text is intentionally
-- NOT here — see seed_prayer_map_sensitive_requests.sql.

insert into missionaries
  (id, name, name_note, location, lat, lng, role, ministry, prayer_count, support_goal, budget, prayer_requests, sensitive_count, updates, location_sensitive)
values

(
  'smith-burkina-faso',
  'Jonathan & Sarah Smith',
  null,
  'Ouagadougou, Burkina Faso',
  12.3714,
  -1.5197,
  'Church Planting',
  'Jonathan and Sarah serve among the Mossi people, planting reproducing churches in villages that have never had a Gospel witness. Their work centers on evangelism, discipleship of new believers, and training indigenous leaders who can shepherd their own congregations. They also run a clean-water initiative that opens doors for relationships across the region.',
  3847,
  92,
  '[
    {"item": "Housing & utilities", "purpose": "Rent and power for the family home and ministry meeting space", "amount": 850},
    {"item": "Discipleship materials", "purpose": "Bibles, literature, and training resources in Moore", "amount": 400},
    {"item": "Food & living", "purpose": "Groceries and daily needs for a family of four", "amount": 600},
    {"item": "Transportation", "purpose": "Fuel and vehicle upkeep for village travel", "amount": 350},
    {"item": "Medical & insurance", "purpose": "Overseas health coverage and clinic visits", "amount": 450},
    {"item": "Children''s schooling", "purpose": "Homeschool curriculum and materials", "amount": 300},
    {"item": "Clean-water project", "purpose": "Well maintenance and new drilling supplies", "amount": 250},
    {"item": "Sending agency & member care", "purpose": "Field accounting, oversight, and pastoral care", "amount": 300}
  ]'::jsonb,
  '[
    {"text": "Pray for new believers to grow in faith and community", "type": "sticky"},
    {"text": "Wisdom in selecting local leaders for the church", "type": "sticky"}
  ]'::jsonb,
  0,
  '[
    {
      "date": "2 days ago",
      "title": "47 at our new gathering",
      "text": "This weekend we had 47 people visit our new worship gathering. Pray for wisdom as we disciple these new believers and help them understand the Gospel.",
      "photo": "/prayer-map-photos/smith-gathering.jpg",
      "photoWidth": 1024,
      "photoHeight": 682
    },
    {
      "date": "1 week ago",
      "title": "Well project complete",
      "text": "The village well is finished! Clean water for 200 families, and every day it opens doors for Gospel conversations with those who come to draw water.",
      "photo": "/prayer-map-photos/smith-well.jpg",
      "photoWidth": 1024,
      "photoHeight": 732
    },
    {
      "date": "3 weeks ago",
      "title": "Language milestone",
      "text": "Sarah preached her first full lesson in Moore this week. Two years of study bearing fruit. The women wept to hear Scripture in their heart language.",
      "photo": "/prayer-map-photos/smith-bible-study.jpg",
      "photoWidth": 1024,
      "photoHeight": 768
    }
  ]'::jsonb,
  false
),

(
  'chen-laos',
  'Dr. Michael Chen',
  null,
  'Northern Laos, Southeast Asia',
  20.25,
  101.9,
  'Medical Missions',
  'Dr. Chen provides medical care to remote mountain villages while training local healthcare workers and sharing the Gospel with every family he treats. His mobile clinics reach communities with no access to doctors, and he disciples believers who can carry both physical and spiritual healing to their own people.',
  2156,
  78,
  '[
    {"item": "Housing", "purpose": "Rent near the regional clinic base", "amount": 500},
    {"item": "Medical supplies & clinic", "purpose": "Medicines and mobile clinic equipment", "amount": 900},
    {"item": "Food & living", "purpose": "Daily needs and groceries", "amount": 400},
    {"item": "Transportation", "purpose": "Travel to remote mountain villages", "amount": 450},
    {"item": "Health insurance", "purpose": "Evacuation and overseas medical coverage", "amount": 400},
    {"item": "Local staff training", "purpose": "Stipends and training for national health workers", "amount": 350},
    {"item": "Visa & travel", "purpose": "Residency renewals and border trips", "amount": 200},
    {"item": "Sending agency & admin", "purpose": "Field oversight and member care", "amount": 300}
  ]'::jsonb,
  '[
    {"text": "Physical strength and wisdom for medical decisions", "type": "sticky"},
    {"text": "Open doors in three unreached villages", "type": "auto"}
  ]'::jsonb,
  0,
  '[
    {
      "date": "5 days ago",
      "title": "284 patients this week",
      "text": "Conducted a mobile clinic in three villages. Treated 284 patients and shared the Gospel with each family. Many asked for prayer over their sick children.",
      "photo": "/prayer-map-photos/chen-clinic.jpg",
      "photoWidth": 1024,
      "photoHeight": 683
    },
    {
      "date": "2 weeks ago",
      "title": "A doctor comes to faith",
      "text": "A local doctor I''ve mentored for a year professed faith in Christ. He now wants to reach his own people. Pray for his boldness.",
      "photo": "/prayer-map-photos/chen-mentoring.jpg",
      "photoWidth": 1024,
      "photoHeight": 681
    }
  ]'::jsonb,
  false
),

(
  'rodriguez-peru',
  'Pastor David & Lucia Rodriguez',
  null,
  'Ancash Region, Peru',
  -9.5278,
  -77.5278,
  'Leadership Training',
  'David and Lucia equip pastors and church leaders across remote Andean communities. Through intensive training retreats and ongoing mentorship, they multiply healthy, self-governing churches led by well-taught local shepherds. Their vision is a Gospel movement carried by Peruvians to Peruvians.',
  5234,
  100,
  '[
    {"item": "Housing", "purpose": "Rent and utilities in the regional hub", "amount": 600},
    {"item": "Training retreats", "purpose": "Venues, meals, and lodging for pastor training events", "amount": 700},
    {"item": "Food & living", "purpose": "Daily needs for the family", "amount": 500},
    {"item": "Transportation", "purpose": "Outreach trips across the Andes", "amount": 500},
    {"item": "Medical & insurance", "purpose": "Overseas health coverage", "amount": 400},
    {"item": "Ministry materials", "purpose": "Curriculum and printed training resources", "amount": 300},
    {"item": "Youth ministry", "purpose": "Regional youth camps and discipleship", "amount": 300},
    {"item": "Savings & retirement", "purpose": "Long-term financial stewardship", "amount": 300},
    {"item": "Sending agency & admin", "purpose": "Accounting and member care", "amount": 300}
  ]'::jsonb,
  '[
    {"text": "Spiritual maturity for new church leaders", "type": "sticky"},
    {"text": "Transport and resources for outreach trips", "type": "auto"}
  ]'::jsonb,
  0,
  '[
    {
      "date": "1 day ago",
      "title": "15 pastors trained",
      "text": "Trained 15 pastors from remote mountain communities this month. We''re seeing spiritual multiplication happen. Please pray for sustainable discipleship.",
      "photo": "/prayer-map-photos/rodriguez-retreat.jpg",
      "photoWidth": 1024,
      "photoHeight": 768
    },
    {
      "date": "10 days ago",
      "title": "New church in Yungay",
      "text": "The believers in Yungay have organized into a self-governing church with their own elders. Our fourth church plant to reach this milestone!",
      "photo": "/prayer-map-photos/rodriguez-church.jpg",
      "photoWidth": 819,
      "photoHeight": 1024
    },
    {
      "date": "1 month ago",
      "title": "Youth camp",
      "text": "Over 80 teenagers attended our first regional youth camp. Twelve made decisions to follow Christ and several sense a call to ministry.",
      "photo": "/prayer-map-photos/rodriguez-youthcamp.jpg",
      "photoWidth": 1024,
      "photoHeight": 683
    }
  ]'::jsonb,
  false
),

(
  'johnson-ethiopia',
  'Rebecca Johnson',
  null,
  'Addis Ababa, Ethiopia',
  9.03,
  38.74,
  'Education & Discipleship',
  'Rebecca runs a literacy and discipleship program for vulnerable children in Addis Ababa, teaching them to read through the Scriptures. What began as a classroom has grown into a ministry to whole families, with mothers now gathering for weekly Bible study. She serves children the wider society often overlooks.',
  1847,
  64,
  '[
    {"item": "Housing", "purpose": "Rent in Addis Ababa", "amount": 450},
    {"item": "School program", "purpose": "Schoolroom rent, teacher stipends, and supplies", "amount": 600},
    {"item": "Food & living", "purpose": "Daily needs and groceries", "amount": 350},
    {"item": "Transportation", "purpose": "Local travel for home visits", "amount": 200},
    {"item": "Medical & insurance", "purpose": "Overseas health coverage", "amount": 350},
    {"item": "Literacy materials", "purpose": "Books and learning resources in Amharic", "amount": 250},
    {"item": "Rebuild & contingency", "purpose": "Emergency fund (currently covering fire repairs)", "amount": 150},
    {"item": "Sending agency & admin", "purpose": "Accounting and member care", "amount": 250}
  ]'::jsonb,
  '[
    {"text": "URGENT: Fire damaged our schoolroom Tuesday night. We need $4,200 to repair the roof and replace supplies before the rainy season. 60 children are out of class until it''s fixed.", "type": "urgent"},
    {"text": "Pray the children and families come to know Christ", "type": "sticky"}
  ]'::jsonb,
  2,
  '[
    {
      "date": "8 hours ago",
      "title": "Fire in the schoolroom",
      "text": "Please pray. An electrical fire damaged our schoolroom Tuesday night. No one was hurt, praise God, but the roof and most of our books are gone. We''re determined to rebuild quickly so the children don''t lose momentum.",
      "photo": "/prayer-map-photos/johnson-fire.jpg",
      "photoWidth": 1024,
      "photoHeight": 683
    },
    {
      "date": "3 days ago",
      "title": "60 children reading",
      "text": "Started a literacy program for 60 children. Our prayer is that they''ll encounter Jesus through God''s Word as they learn to read.",
      "photo": "/prayer-map-photos/johnson-reading.jpg",
      "photoWidth": 500,
      "photoHeight": 332
    },
    {
      "date": "2 weeks ago",
      "title": "Mothers'' discipleship group",
      "text": "The mothers of my students asked to start a weekly Bible study. Fifteen women now gather every Thursday. God is at work in whole families.",
      "photo": "/prayer-map-photos/johnson-mothers.jpg",
      "photoWidth": 804,
      "photoHeight": 1024
    }
  ]'::jsonb,
  false
),

(
  'torres-png',
  'Mark & Amanda Torres',
  null,
  'Eastern Highlands, Papua New Guinea',
  -6.0833,
  145.3866,
  'Bible Translation',
  'Mark and Amanda are Bible translators bringing God''s Word into the Kamano language for the first time. Beyond translation, they train mother-tongue readers, produce audio Scripture for oral learners, and help establish churches grounded in the Word they can finally understand.',
  4102,
  88,
  '[
    {"item": "Housing", "purpose": "Rent and utilities in the highlands base", "amount": 700},
    {"item": "Translation & recording", "purpose": "Audio gear, software, and printing", "amount": 650},
    {"item": "Food & living", "purpose": "Daily needs for the family", "amount": 550},
    {"item": "Transportation", "purpose": "Highland travel and small aircraft flights", "amount": 500},
    {"item": "Medical & insurance", "purpose": "Evacuation and overseas coverage", "amount": 500},
    {"item": "Children''s schooling", "purpose": "Curriculum and boarding costs", "amount": 350},
    {"item": "Language helpers", "purpose": "Stipends for local translation assistants", "amount": 300},
    {"item": "Sending agency & admin", "purpose": "Field oversight and member care", "amount": 350}
  ]'::jsonb,
  '[
    {"text": "Pray for effective distribution and study of the translation", "type": "sticky"},
    {"text": "Health and safety through the rainy season", "type": "auto"}
  ]'::jsonb,
  0,
  '[
    {
      "date": "6 hours ago",
      "title": "New Testament complete!",
      "text": "We finished the Kamano New Testament translation today! The community gathered to see God''s Word in their heart language for the very first time. Tears everywhere.",
      "photo": "/prayer-map-photos/torres-bible.jpg",
      "photoWidth": 1024,
      "photoHeight": 768
    },
    {
      "date": "3 weeks ago",
      "title": "Recording the Gospels",
      "text": "We''ve begun audio recording the Gospels for the many who cannot yet read. Pray for clear recordings and willing local voices.",
      "photo": "/prayer-map-photos/torres-recording.jpg",
      "photoWidth": 753,
      "photoHeight": 1023
    }
  ]'::jsonb,
  false
),

(
  'creative-access-middle-east',
  'Karim & Noor',
  'Names changed for security',
  'Middle East',
  27,
  44,
  'Business as Mission (Creative Access)',
  'Karim and Noor live and work in a nation where open Christian ministry is restricted by law. Under the cover of a legitimate small business, they build relationships, disciple a handful of new believers in their home, and quietly support a small network of local house churches. Because of the risk to the national believers they serve, we withhold their city, their business, and any detail that could identify the people around them.',
  612,
  81,
  '[
    {"item": "Housing & utilities", "purpose": "Rent for the family''s home, which also serves as a meeting space", "amount": 700},
    {"item": "Business operating costs", "purpose": "Covers the small business that provides legal residency and community access", "amount": 900},
    {"item": "Food & living", "purpose": "Daily needs for the family", "amount": 500},
    {"item": "Security & travel", "purpose": "Secure communications, travel, and periodic rest outside the country", "amount": 450},
    {"item": "Local believer support", "purpose": "Discreet support for national believers facing family or economic pressure", "amount": 300},
    {"item": "Children''s education", "purpose": "International schooling costs", "amount": 400},
    {"item": "Medical & insurance", "purpose": "Overseas health coverage", "amount": 350},
    {"item": "Sending agency & security review", "purpose": "Field oversight, security vetting, and member care", "amount": 300}
  ]'::jsonb,
  '[
    {"text": "Wisdom and discernment in day-to-day interactions", "type": "sticky"},
    {"text": "Continued favor for their business and residency status", "type": "auto"},
    {"text": "A local believer is currently facing pressure from their family over their new faith. Please pray for courage and protection — details are kept off the public page for their safety.", "type": "urgent"}
  ]'::jsonb,
  1,
  '[
    {
      "date": "4 days ago",
      "title": "A quiet gathering",
      "text": "Six friends met in our home again this week to talk through the Scriptures together. Please pray for eyes to see and hearts to soften — and for our continued cover as we go about ordinary life.",
      "photo": "/prayer-map-photos/karim-gathering.jpg",
      "photoWidth": 768,
      "photoHeight": 1024
    },
    {
      "date": "3 weeks ago",
      "title": "Answered prayer on paperwork",
      "text": "A residency renewal that had been stuck for months finally went through this week. Thank you for praying — please continue to pray for favor with local officials.",
      "photo": "/prayer-map-photos/karim-paperwork.jpg",
      "photoWidth": 682,
      "photoHeight": 1024
    },
    {
      "date": "2 months ago",
      "title": "New season, same mission",
      "text": "The business is steady, our cover remains solid, and the small group of believers we walk with keeps growing in faith, even amid real risk. Thank you for standing with us in prayer, even without knowing our names.",
      "photo": "/prayer-map-photos/karim-season.jpg",
      "photoWidth": 1024,
      "photoHeight": 768
    }
  ]'::jsonb,
  true
)

on conflict (id) do nothing;
