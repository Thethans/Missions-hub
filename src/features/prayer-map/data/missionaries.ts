import type { Missionary } from './types';
import smithGathering from '../assets/updates/smith-gathering.jpg';
import smithWell from '../assets/updates/smith-well.jpg';
import smithBibleStudy from '../assets/updates/smith-bible-study.jpg';
import chenClinic from '../assets/updates/chen-clinic.jpg';
import chenMentoring from '../assets/updates/chen-mentoring.jpg';
import rodriguezRetreat from '../assets/updates/rodriguez-retreat.jpg';
import rodriguezChurch from '../assets/updates/rodriguez-church.jpg';
import rodriguezYouthCamp from '../assets/updates/rodriguez-youthcamp.jpg';
import johnsonFire from '../assets/updates/johnson-fire.jpg';
import johnsonReading from '../assets/updates/johnson-reading.jpg';
import johnsonMothers from '../assets/updates/johnson-mothers.jpg';
import torresBible from '../assets/updates/torres-bible.jpg';
import torresRecording from '../assets/updates/torres-recording.jpg';
import karimGathering from '../assets/updates/karim-gathering.jpg';
import karimPaperwork from '../assets/updates/karim-paperwork.jpg';
import karimSeason from '../assets/updates/karim-season.jpg';

// Hardcoded mock data — the 5 missionaries from fielded-prototype-reference.html.
// Nothing here is fetched or stored.
// TODO(real): source these from Supabase (admin-editable), with prayerCount and
// `raised` computed from real prayer/giving events rather than static numbers.
//
// The reference prototype positioned pins by SVG pixel (cx/cy) on a flat map
// image. This build uses a real MapLibre basemap, so each pin carries real
// lat/lng for its named city instead.
//
// `monthlyNeed` and `raised` are intentionally NOT stored here — they're derived
// from `budget` + `supportGoal` via deriveBudget.ts so they can't drift.
//
// Update photos are illustrative stock photography (public domain / CC BY),
// not real photos of these fictional missionaries or events — see
// assets/updates/CREDITS.md for source and license per image. Exception:
// Karim & Noor's three photos are user-supplied (not sourced/licensed via the
// same pipeline) — deliberately chosen because none show identifiable faces
// or a traceable specific location, consistent with locationSensitive.

export const missionaries: Missionary[] = [
  {
    id: 'smith-burkina-faso',
    name: 'Jonathan & Sarah Smith',
    location: 'Ouagadougou, Burkina Faso',
    lat: 12.3714,
    lng: -1.5197,
    role: 'Church Planting',
    ministry:
      'Jonathan and Sarah serve among the Mossi people, planting reproducing churches in villages that have never had a Gospel witness. Their work centers on evangelism, discipleship of new believers, and training indigenous leaders who can shepherd their own congregations. They also run a clean-water initiative that opens doors for relationships across the region.',
    prayerCount: 3847,
    supportGoal: 92,
    budget: [
      { item: 'Housing & utilities', purpose: 'Rent and power for the family home and ministry meeting space', amount: 850 },
      { item: 'Discipleship materials', purpose: 'Bibles, literature, and training resources in Moore', amount: 400 },
      { item: 'Food & living', purpose: 'Groceries and daily needs for a family of four', amount: 600 },
      { item: 'Transportation', purpose: 'Fuel and vehicle upkeep for village travel', amount: 350 },
      { item: 'Medical & insurance', purpose: 'Overseas health coverage and clinic visits', amount: 450 },
      { item: "Children's schooling", purpose: 'Homeschool curriculum and materials', amount: 300 },
      { item: 'Clean-water project', purpose: 'Well maintenance and new drilling supplies', amount: 250 },
      { item: 'Sending agency & member care', purpose: 'Field accounting, oversight, and pastoral care', amount: 300 }
    ],
    prayerRequests: [
      { text: 'Pray for new believers to grow in faith and community', type: 'sticky' },
      { text: 'Wisdom in selecting local leaders for the church', type: 'sticky' }
    ],
    sensitiveCount: 0,
    updates: [
      {
        date: '2 days ago',
        title: '47 at our new gathering',
        text: 'This weekend we had 47 people visit our new worship gathering. Pray for wisdom as we disciple these new believers and help them understand the Gospel.',
        photo: smithGathering,
        photoWidth: 1024,
        photoHeight: 682
      },
      {
        date: '1 week ago',
        title: 'Well project complete',
        text: 'The village well is finished! Clean water for 200 families, and every day it opens doors for Gospel conversations with those who come to draw water.',
        photo: smithWell,
        photoWidth: 1024,
        photoHeight: 732
      },
      {
        date: '3 weeks ago',
        title: 'Language milestone',
        text: 'Sarah preached her first full lesson in Moore this week. Two years of study bearing fruit. The women wept to hear Scripture in their heart language.',
        photo: smithBibleStudy,
        photoWidth: 1024,
        photoHeight: 768
      }
    ]
  },
  {
    id: 'chen-laos',
    name: 'Dr. Michael Chen',
    location: 'Northern Laos, Southeast Asia',
    lat: 20.25,
    lng: 101.9,
    role: 'Medical Missions',
    ministry:
      'Dr. Chen provides medical care to remote mountain villages while training local healthcare workers and sharing the Gospel with every family he treats. His mobile clinics reach communities with no access to doctors, and he disciples believers who can carry both physical and spiritual healing to their own people.',
    prayerCount: 2156,
    supportGoal: 78,
    budget: [
      { item: 'Housing', purpose: 'Rent near the regional clinic base', amount: 500 },
      { item: 'Medical supplies & clinic', purpose: 'Medicines and mobile clinic equipment', amount: 900 },
      { item: 'Food & living', purpose: 'Daily needs and groceries', amount: 400 },
      { item: 'Transportation', purpose: 'Travel to remote mountain villages', amount: 450 },
      { item: 'Health insurance', purpose: 'Evacuation and overseas medical coverage', amount: 400 },
      { item: 'Local staff training', purpose: 'Stipends and training for national health workers', amount: 350 },
      { item: 'Visa & travel', purpose: 'Residency renewals and border trips', amount: 200 },
      { item: 'Sending agency & admin', purpose: 'Field oversight and member care', amount: 300 }
    ],
    prayerRequests: [
      { text: 'Physical strength and wisdom for medical decisions', type: 'sticky' },
      { text: 'Open doors in three unreached villages', type: 'auto' }
    ],
    sensitiveCount: 0,
    updates: [
      {
        date: '5 days ago',
        title: '284 patients this week',
        text: 'Conducted a mobile clinic in three villages. Treated 284 patients and shared the Gospel with each family. Many asked for prayer over their sick children.',
        photo: chenClinic,
        photoWidth: 1024,
        photoHeight: 683
      },
      {
        date: '2 weeks ago',
        title: 'A doctor comes to faith',
        text: "A local doctor I've mentored for a year professed faith in Christ. He now wants to reach his own people. Pray for his boldness.",
        photo: chenMentoring,
        photoWidth: 1024,
        photoHeight: 681
      }
    ]
  },
  {
    id: 'rodriguez-peru',
    name: 'Pastor David & Lucia Rodriguez',
    location: 'Ancash Region, Peru',
    lat: -9.5278,
    lng: -77.5278,
    role: 'Leadership Training',
    ministry:
      'David and Lucia equip pastors and church leaders across remote Andean communities. Through intensive training retreats and ongoing mentorship, they multiply healthy, self-governing churches led by well-taught local shepherds. Their vision is a Gospel movement carried by Peruvians to Peruvians.',
    prayerCount: 5234,
    supportGoal: 100,
    budget: [
      { item: 'Housing', purpose: 'Rent and utilities in the regional hub', amount: 600 },
      { item: 'Training retreats', purpose: 'Venues, meals, and lodging for pastor training events', amount: 700 },
      { item: 'Food & living', purpose: 'Daily needs for the family', amount: 500 },
      { item: 'Transportation', purpose: 'Outreach trips across the Andes', amount: 500 },
      { item: 'Medical & insurance', purpose: 'Overseas health coverage', amount: 400 },
      { item: 'Ministry materials', purpose: 'Curriculum and printed training resources', amount: 300 },
      { item: 'Youth ministry', purpose: 'Regional youth camps and discipleship', amount: 300 },
      { item: 'Savings & retirement', purpose: 'Long-term financial stewardship', amount: 300 },
      { item: 'Sending agency & admin', purpose: 'Accounting and member care', amount: 300 }
    ],
    prayerRequests: [
      { text: 'Spiritual maturity for new church leaders', type: 'sticky' },
      { text: 'Transport and resources for outreach trips', type: 'auto' }
    ],
    sensitiveCount: 0,
    updates: [
      {
        date: '1 day ago',
        title: '15 pastors trained',
        text: "Trained 15 pastors from remote mountain communities this month. We're seeing spiritual multiplication happen. Please pray for sustainable discipleship.",
        photo: rodriguezRetreat,
        photoWidth: 1024,
        photoHeight: 768
      },
      {
        date: '10 days ago',
        title: 'New church in Yungay',
        text: 'The believers in Yungay have organized into a self-governing church with their own elders. Our fourth church plant to reach this milestone!',
        photo: rodriguezChurch,
        photoWidth: 819,
        photoHeight: 1024
      },
      {
        date: '1 month ago',
        title: 'Youth camp',
        text: 'Over 80 teenagers attended our first regional youth camp. Twelve made decisions to follow Christ and several sense a call to ministry.',
        photo: rodriguezYouthCamp,
        photoWidth: 1024,
        photoHeight: 683
      }
    ]
  },
  {
    id: 'johnson-ethiopia',
    name: 'Rebecca Johnson',
    location: 'Addis Ababa, Ethiopia',
    lat: 9.03,
    lng: 38.74,
    role: 'Education & Discipleship',
    ministry:
      'Rebecca runs a literacy and discipleship program for vulnerable children in Addis Ababa, teaching them to read through the Scriptures. What began as a classroom has grown into a ministry to whole families, with mothers now gathering for weekly Bible study. She serves children the wider society often overlooks.',
    prayerCount: 1847,
    supportGoal: 64,
    budget: [
      { item: 'Housing', purpose: 'Rent in Addis Ababa', amount: 450 },
      { item: 'School program', purpose: 'Schoolroom rent, teacher stipends, and supplies', amount: 600 },
      { item: 'Food & living', purpose: 'Daily needs and groceries', amount: 350 },
      { item: 'Transportation', purpose: 'Local travel for home visits', amount: 200 },
      { item: 'Medical & insurance', purpose: 'Overseas health coverage', amount: 350 },
      { item: 'Literacy materials', purpose: 'Books and learning resources in Amharic', amount: 250 },
      { item: 'Rebuild & contingency', purpose: 'Emergency fund (currently covering fire repairs)', amount: 150 },
      { item: 'Sending agency & admin', purpose: 'Accounting and member care', amount: 250 }
    ],
    prayerRequests: [
      {
        text: "URGENT: Fire damaged our schoolroom Tuesday night. We need $4,200 to repair the roof and replace supplies before the rainy season. 60 children are out of class until it's fixed.",
        type: 'urgent'
      },
      { text: 'Pray the children and families come to know Christ', type: 'sticky' }
    ],
    // The actual confidential text used to live here as plain bundled data —
    // it now lives only in missionary_sensitive_requests (see
    // supabase/seed_prayer_map_sensitive_requests.sql for the demo content),
    // gated by RLS. See REAL_AUTH_DESIGN.md.
    sensitiveCount: 2,
    updates: [
      {
        date: '8 hours ago',
        title: 'Fire in the schoolroom',
        text: "Please pray. An electrical fire damaged our schoolroom Tuesday night. No one was hurt, praise God, but the roof and most of our books are gone. We're determined to rebuild quickly so the children don't lose momentum.",
        photo: johnsonFire,
        photoWidth: 1024,
        photoHeight: 683
      },
      {
        date: '3 days ago',
        title: '60 children reading',
        text: "Started a literacy program for 60 children. Our prayer is that they'll encounter Jesus through God's Word as they learn to read.",
        photo: johnsonReading,
        photoWidth: 500,
        photoHeight: 332
      },
      {
        date: '2 weeks ago',
        title: "Mothers' discipleship group",
        text: 'The mothers of my students asked to start a weekly Bible study. Fifteen women now gather every Thursday. God is at work in whole families.',
        photo: johnsonMothers,
        photoWidth: 804,
        photoHeight: 1024
      }
    ]
  },
  {
    id: 'torres-png',
    name: 'Mark & Amanda Torres',
    location: 'Eastern Highlands, Papua New Guinea',
    lat: -6.0833,
    lng: 145.3866,
    role: 'Bible Translation',
    ministry:
      'Mark and Amanda are Bible translators bringing God’s Word into the Kamano language for the first time. Beyond translation, they train mother-tongue readers, produce audio Scripture for oral learners, and help establish churches grounded in the Word they can finally understand.',
    prayerCount: 4102,
    supportGoal: 88,
    budget: [
      { item: 'Housing', purpose: 'Rent and utilities in the highlands base', amount: 700 },
      { item: 'Translation & recording', purpose: 'Audio gear, software, and printing', amount: 650 },
      { item: 'Food & living', purpose: 'Daily needs for the family', amount: 550 },
      { item: 'Transportation', purpose: 'Highland travel and small aircraft flights', amount: 500 },
      { item: 'Medical & insurance', purpose: 'Evacuation and overseas coverage', amount: 500 },
      { item: "Children's schooling", purpose: 'Curriculum and boarding costs', amount: 350 },
      { item: 'Language helpers', purpose: 'Stipends for local translation assistants', amount: 300 },
      { item: 'Sending agency & admin', purpose: 'Field oversight and member care', amount: 350 }
    ],
    prayerRequests: [
      { text: 'Pray for effective distribution and study of the translation', type: 'sticky' },
      { text: 'Health and safety through the rainy season', type: 'auto' }
    ],
    sensitiveCount: 0,
    updates: [
      {
        date: '6 hours ago',
        title: 'New Testament complete!',
        text: 'We finished the Kamano New Testament translation today! The community gathered to see God’s Word in their heart language for the very first time. Tears everywhere.',
        photo: torresBible,
        photoWidth: 1024,
        photoHeight: 768
      },
      {
        date: '3 weeks ago',
        title: 'Recording the Gospels',
        text: "We've begun audio recording the Gospels for the many who cannot yet read. Pray for clear recordings and willing local voices.",
        photo: torresRecording,
        photoWidth: 753,
        photoHeight: 1023
      }
    ]
  },
  {
    id: 'creative-access-middle-east',
    // Pseudonyms, per standard creative-access security practice — real names
    // are never published for workers in restricted countries.
    name: 'Karim & Noor',
    nameNote: 'Names changed for security',
    location: 'Middle East',
    // Deliberately a generalized point in a sparsely populated interior area,
    // not tied to any real (fictional) city — see Missionary.locationSensitive.
    // The map renders this as a soft area, never a precise pin.
    lat: 27,
    lng: 44,
    role: 'Business as Mission (Creative Access)',
    ministry:
      'Karim and Noor live and work in a nation where open Christian ministry is restricted by law. Under the cover of a legitimate small business, they build relationships, disciple a handful of new believers in their home, and quietly support a small network of local house churches. Because of the risk to the national believers they serve, we withhold their city, their business, and any detail that could identify the people around them.',
    prayerCount: 612,
    supportGoal: 81,
    budget: [
      { item: 'Housing & utilities', purpose: "Rent for the family's home, which also serves as a meeting space", amount: 700 },
      { item: 'Business operating costs', purpose: 'Covers the small business that provides legal residency and community access', amount: 900 },
      { item: 'Food & living', purpose: 'Daily needs for the family', amount: 500 },
      { item: 'Security & travel', purpose: 'Secure communications, travel, and periodic rest outside the country', amount: 450 },
      { item: 'Local believer support', purpose: 'Discreet support for national believers facing family or economic pressure', amount: 300 },
      { item: "Children's education", purpose: 'International schooling costs', amount: 400 },
      { item: 'Medical & insurance', purpose: 'Overseas health coverage', amount: 350 },
      { item: 'Sending agency & security review', purpose: 'Field oversight, security vetting, and member care', amount: 300 }
    ],
    prayerRequests: [
      { text: 'Wisdom and discernment in day-to-day interactions', type: 'sticky' },
      { text: 'Continued favor for their business and residency status', type: 'auto' },
      {
        text: 'A local believer is currently facing pressure from their family over their new faith. Please pray for courage and protection — details are kept off the public page for their safety.',
        type: 'urgent'
      }
    ],
    // See supabase/seed_prayer_map_sensitive_requests.sql — same as Johnson above.
    sensitiveCount: 1,
    updates: [
      {
        date: '4 days ago',
        title: 'A quiet gathering',
        text: 'Six friends met in our home again this week to talk through the Scriptures together. Please pray for eyes to see and hearts to soften — and for our continued cover as we go about ordinary life.',
        photo: karimGathering,
        photoWidth: 768,
        photoHeight: 1024
      },
      {
        date: '3 weeks ago',
        title: 'Answered prayer on paperwork',
        text: 'A residency renewal that had been stuck for months finally went through this week. Thank you for praying — please continue to pray for favor with local officials.',
        photo: karimPaperwork,
        photoWidth: 682,
        photoHeight: 1024
      },
      {
        date: '2 months ago',
        title: 'New season, same mission',
        text: 'The business is steady, our cover remains solid, and the small group of believers we walk with keeps growing in faith, even amid real risk. Thank you for standing with us in prayer, even without knowing our names.',
        photo: karimSeason,
        photoWidth: 1024,
        photoHeight: 768
      }
    ],
    locationSensitive: true
  }
];
