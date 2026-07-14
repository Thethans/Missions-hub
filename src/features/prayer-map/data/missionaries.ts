import type { Missionary } from './types';

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
    sensitive: [],
    updates: [
      {
        date: '2 days ago',
        title: '47 at our new gathering',
        text: 'This weekend we had 47 people visit our new worship gathering. Pray for wisdom as we disciple these new believers and help them understand the Gospel.',
        photo:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='240'%3E%3Cdefs%3E%3ClinearGradient id='g1a' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23e67e22'/%3E%3Cstop offset='1' stop-color='%23c0392b'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='240' fill='url(%23g1a)'/%3E%3Ccircle cx='330' cy='55' r='28' fill='%23ffffff' opacity='0.85'/%3E%3Cpath d='M0 190 Q100 150 200 175 T400 165 V240 H0 Z' fill='%23ffffff' opacity='0.15'/%3E%3Cpath d='M0 205 Q120 175 240 195 T400 185 V240 H0 Z' fill='%23000000' opacity='0.12'/%3E%3Ctext x='200' y='125' font-family='sans-serif' font-size='46' text-anchor='middle'%3E⛪%3C/text%3E%3Ctext x='200' y='225' font-family='sans-serif' font-size='13' fill='%23ffffff' text-anchor='middle' opacity='0.9'%3ESunday worship gathering%3C/text%3E%3C/svg%3E"
      },
      {
        date: '1 week ago',
        title: 'Well project complete',
        text: 'The village well is finished! Clean water for 200 families, and every day it opens doors for Gospel conversations with those who come to draw water.',
        photo:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='240'%3E%3Cdefs%3E%3ClinearGradient id='g1b' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%233498db'/%3E%3Cstop offset='1' stop-color='%232980b9'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='240' fill='url(%23g1b)'/%3E%3Ccircle cx='330' cy='55' r='28' fill='%23ffffff' opacity='0.85'/%3E%3Cpath d='M0 190 Q100 150 200 175 T400 165 V240 H0 Z' fill='%23ffffff' opacity='0.15'/%3E%3Cpath d='M0 205 Q120 175 240 195 T400 185 V240 H0 Z' fill='%23000000' opacity='0.12'/%3E%3Ctext x='200' y='125' font-family='sans-serif' font-size='46' text-anchor='middle'%3E💧%3C/text%3E%3Ctext x='200' y='225' font-family='sans-serif' font-size='13' fill='%23ffffff' text-anchor='middle' opacity='0.9'%3EThe new village well%3C/text%3E%3C/svg%3E"
      },
      {
        date: '3 weeks ago',
        title: 'Language milestone',
        text: 'Sarah preached her first full lesson in Moore this week. Two years of study bearing fruit. The women wept to hear Scripture in their heart language.',
        photo:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='240'%3E%3Cdefs%3E%3ClinearGradient id='g1c' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23f39c12'/%3E%3Cstop offset='1' stop-color='%23d35400'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='240' fill='url(%23g1c)'/%3E%3Ccircle cx='330' cy='55' r='28' fill='%23ffffff' opacity='0.85'/%3E%3Cpath d='M0 190 Q100 150 200 175 T400 165 V240 H0 Z' fill='%23ffffff' opacity='0.15'/%3E%3Cpath d='M0 205 Q120 175 240 195 T400 185 V240 H0 Z' fill='%23000000' opacity='0.12'/%3E%3Ctext x='200' y='125' font-family='sans-serif' font-size='46' text-anchor='middle'%3E📖%3C/text%3E%3Ctext x='200' y='225' font-family='sans-serif' font-size='13' fill='%23ffffff' text-anchor='middle' opacity='0.9'%3EWomen's Bible study%3C/text%3E%3C/svg%3E"
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
    sensitive: [],
    updates: [
      {
        date: '5 days ago',
        title: '284 patients this week',
        text: 'Conducted a mobile clinic in three villages. Treated 284 patients and shared the Gospel with each family. Many asked for prayer over their sick children.',
        photo:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='240'%3E%3Cdefs%3E%3ClinearGradient id='g2a' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%2316a085'/%3E%3Cstop offset='1' stop-color='%231abc9c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='240' fill='url(%23g2a)'/%3E%3Ccircle cx='330' cy='55' r='28' fill='%23ffffff' opacity='0.85'/%3E%3Cpath d='M0 190 Q100 150 200 175 T400 165 V240 H0 Z' fill='%23ffffff' opacity='0.15'/%3E%3Cpath d='M0 205 Q120 175 240 195 T400 185 V240 H0 Z' fill='%23000000' opacity='0.12'/%3E%3Ctext x='200' y='125' font-family='sans-serif' font-size='46' text-anchor='middle'%3E🩺%3C/text%3E%3Ctext x='200' y='225' font-family='sans-serif' font-size='13' fill='%23ffffff' text-anchor='middle' opacity='0.9'%3EMobile clinic day%3C/text%3E%3C/svg%3E"
      },
      {
        date: '2 weeks ago',
        title: 'A doctor comes to faith',
        text: "A local doctor I've mentored for a year professed faith in Christ. He now wants to reach his own people. Pray for his boldness.",
        photo:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='240'%3E%3Cdefs%3E%3ClinearGradient id='g2b' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%238e44ad'/%3E%3Cstop offset='1' stop-color='%239b59b6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='240' fill='url(%23g2b)'/%3E%3Ccircle cx='330' cy='55' r='28' fill='%23ffffff' opacity='0.85'/%3E%3Cpath d='M0 190 Q100 150 200 175 T400 165 V240 H0 Z' fill='%23ffffff' opacity='0.15'/%3E%3Cpath d='M0 205 Q120 175 240 195 T400 185 V240 H0 Z' fill='%23000000' opacity='0.12'/%3E%3Ctext x='200' y='125' font-family='sans-serif' font-size='46' text-anchor='middle'%3E🤝%3C/text%3E%3Ctext x='200' y='225' font-family='sans-serif' font-size='13' fill='%23ffffff' text-anchor='middle' opacity='0.9'%3EMentoring local staff%3C/text%3E%3C/svg%3E"
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
    sensitive: [],
    updates: [
      {
        date: '1 day ago',
        title: '15 pastors trained',
        text: "Trained 15 pastors from remote mountain communities this month. We're seeing spiritual multiplication happen. Please pray for sustainable discipleship.",
        photo:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='240'%3E%3Cdefs%3E%3ClinearGradient id='g3a' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%232c3e50'/%3E%3Cstop offset='1' stop-color='%2334495e'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='240' fill='url(%23g3a)'/%3E%3Ccircle cx='330' cy='55' r='28' fill='%23ffffff' opacity='0.85'/%3E%3Cpath d='M0 190 Q100 150 200 175 T400 165 V240 H0 Z' fill='%23ffffff' opacity='0.15'/%3E%3Cpath d='M0 205 Q120 175 240 195 T400 185 V240 H0 Z' fill='%23000000' opacity='0.12'/%3E%3Ctext x='200' y='125' font-family='sans-serif' font-size='46' text-anchor='middle'%3E🏔%3C/text%3E%3Ctext x='200' y='225' font-family='sans-serif' font-size='13' fill='%23ffffff' text-anchor='middle' opacity='0.9'%3EMountain pastors' retreat%3C/text%3E%3C/svg%3E"
      },
      {
        date: '10 days ago',
        title: 'New church in Yungay',
        text: 'The believers in Yungay have organized into a self-governing church with their own elders. Our fourth church plant to reach this milestone!',
        photo:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='240'%3E%3Cdefs%3E%3ClinearGradient id='g3b' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%2327ae60'/%3E%3Cstop offset='1' stop-color='%23229954'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='240' fill='url(%23g3b)'/%3E%3Ccircle cx='330' cy='55' r='28' fill='%23ffffff' opacity='0.85'/%3E%3Cpath d='M0 190 Q100 150 200 175 T400 165 V240 H0 Z' fill='%23ffffff' opacity='0.15'/%3E%3Cpath d='M0 205 Q120 175 240 195 T400 185 V240 H0 Z' fill='%23000000' opacity='0.12'/%3E%3Ctext x='200' y='125' font-family='sans-serif' font-size='46' text-anchor='middle'%3E⛪%3C/text%3E%3Ctext x='200' y='225' font-family='sans-serif' font-size='13' fill='%23ffffff' text-anchor='middle' opacity='0.9'%3EYungay congregation%3C/text%3E%3C/svg%3E"
      },
      {
        date: '1 month ago',
        title: 'Youth camp',
        text: 'Over 80 teenagers attended our first regional youth camp. Twelve made decisions to follow Christ and several sense a call to ministry.',
        photo:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='240'%3E%3Cdefs%3E%3ClinearGradient id='g3c' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23e74c3c'/%3E%3Cstop offset='1' stop-color='%23c0392b'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='240' fill='url(%23g3c)'/%3E%3Ccircle cx='330' cy='55' r='28' fill='%23ffffff' opacity='0.85'/%3E%3Cpath d='M0 190 Q100 150 200 175 T400 165 V240 H0 Z' fill='%23ffffff' opacity='0.15'/%3E%3Cpath d='M0 205 Q120 175 240 195 T400 185 V240 H0 Z' fill='%23000000' opacity='0.12'/%3E%3Ctext x='200' y='125' font-family='sans-serif' font-size='46' text-anchor='middle'%3E🔥%3C/text%3E%3Ctext x='200' y='225' font-family='sans-serif' font-size='13' fill='%23ffffff' text-anchor='middle' opacity='0.9'%3ERegional youth camp%3C/text%3E%3C/svg%3E"
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
    sensitive: [
      {
        text: 'The fire was not accidental. A local official opposed to our work is behind ongoing intimidation. Please pray for protection for our staff, wisdom in dealing with authorities, and that we would respond with the grace of Christ. We are keeping details off the public page for the safety of our Ethiopian team members, whose names we cannot share openly.'
      },
      {
        text: 'One of our teachers, [name withheld], is facing pressure from her family to leave the ministry over her new faith. Pray for her courage and for her family’s hearts to soften.'
      }
    ],
    updates: [
      {
        date: '8 hours ago',
        title: 'Fire in the schoolroom',
        text: "Please pray. An electrical fire damaged our schoolroom Tuesday night. No one was hurt, praise God, but the roof and most of our books are gone. We're determined to rebuild quickly so the children don't lose momentum.",
        photo:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='240'%3E%3Cdefs%3E%3ClinearGradient id='g4c' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23c0392b'/%3E%3Cstop offset='1' stop-color='%237b241c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='240' fill='url(%23g4c)'/%3E%3Ccircle cx='330' cy='55' r='28' fill='%23ffffff' opacity='0.85'/%3E%3Cpath d='M0 190 Q100 150 200 175 T400 165 V240 H0 Z' fill='%23ffffff' opacity='0.15'/%3E%3Cpath d='M0 205 Q120 175 240 195 T400 185 V240 H0 Z' fill='%23000000' opacity='0.12'/%3E%3Ctext x='200' y='125' font-family='sans-serif' font-size='46' text-anchor='middle'%3E🔥%3C/text%3E%3Ctext x='200' y='225' font-family='sans-serif' font-size='13' fill='%23ffffff' text-anchor='middle' opacity='0.9'%3EThe damaged classroom%3C/text%3E%3C/svg%3E"
      },
      {
        date: '3 days ago',
        title: '60 children reading',
        text: "Started a literacy program for 60 children. Our prayer is that they'll encounter Jesus through God's Word as they learn to read.",
        photo:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='240'%3E%3Cdefs%3E%3ClinearGradient id='g4a' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23d35400'/%3E%3Cstop offset='1' stop-color='%23e67e22'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='240' fill='url(%23g4a)'/%3E%3Ccircle cx='330' cy='55' r='28' fill='%23ffffff' opacity='0.85'/%3E%3Cpath d='M0 190 Q100 150 200 175 T400 165 V240 H0 Z' fill='%23ffffff' opacity='0.15'/%3E%3Cpath d='M0 205 Q120 175 240 195 T400 185 V240 H0 Z' fill='%23000000' opacity='0.12'/%3E%3Ctext x='200' y='125' font-family='sans-serif' font-size='46' text-anchor='middle'%3E📚%3C/text%3E%3Ctext x='200' y='225' font-family='sans-serif' font-size='13' fill='%23ffffff' text-anchor='middle' opacity='0.9'%3ELiteracy class%3C/text%3E%3C/svg%3E"
      },
      {
        date: '2 weeks ago',
        title: "Mothers' discipleship group",
        text: 'The mothers of my students asked to start a weekly Bible study. Fifteen women now gather every Thursday. God is at work in whole families.',
        photo:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='240'%3E%3Cdefs%3E%3ClinearGradient id='g4b' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23c0392b'/%3E%3Cstop offset='1' stop-color='%23a93226'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='240' fill='url(%23g4b)'/%3E%3Ccircle cx='330' cy='55' r='28' fill='%23ffffff' opacity='0.85'/%3E%3Cpath d='M0 190 Q100 150 200 175 T400 165 V240 H0 Z' fill='%23ffffff' opacity='0.15'/%3E%3Cpath d='M0 205 Q120 175 240 195 T400 185 V240 H0 Z' fill='%23000000' opacity='0.12'/%3E%3Ctext x='200' y='125' font-family='sans-serif' font-size='46' text-anchor='middle'%3E🤝%3C/text%3E%3Ctext x='200' y='225' font-family='sans-serif' font-size='13' fill='%23ffffff' text-anchor='middle' opacity='0.9'%3EThursday women's group%3C/text%3E%3C/svg%3E"
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
    sensitive: [],
    updates: [
      {
        date: '6 hours ago',
        title: 'New Testament complete!',
        text: 'We finished the Kamano New Testament translation today! The community gathered to see God’s Word in their heart language for the very first time. Tears everywhere.',
        photo:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='240'%3E%3Cdefs%3E%3ClinearGradient id='g5a' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%232980b9'/%3E%3Cstop offset='1' stop-color='%231f618d'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='240' fill='url(%23g5a)'/%3E%3Ccircle cx='330' cy='55' r='28' fill='%23ffffff' opacity='0.85'/%3E%3Cpath d='M0 190 Q100 150 200 175 T400 165 V240 H0 Z' fill='%23ffffff' opacity='0.15'/%3E%3Cpath d='M0 205 Q120 175 240 195 T400 185 V240 H0 Z' fill='%23000000' opacity='0.12'/%3E%3Ctext x='200' y='125' font-family='sans-serif' font-size='46' text-anchor='middle'%3E📖%3C/text%3E%3Ctext x='200' y='225' font-family='sans-serif' font-size='13' fill='%23ffffff' text-anchor='middle' opacity='0.9'%3ENT dedication celebration%3C/text%3E%3C/svg%3E"
      },
      {
        date: '3 weeks ago',
        title: 'Recording the Gospels',
        text: "We've begun audio recording the Gospels for the many who cannot yet read. Pray for clear recordings and willing local voices.",
        photo:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='240'%3E%3Cdefs%3E%3ClinearGradient id='g5b' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%2316a085'/%3E%3Cstop offset='1' stop-color='%23138d75'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='240' fill='url(%23g5b)'/%3E%3Ccircle cx='330' cy='55' r='28' fill='%23ffffff' opacity='0.85'/%3E%3Cpath d='M0 190 Q100 150 200 175 T400 165 V240 H0 Z' fill='%23ffffff' opacity='0.15'/%3E%3Cpath d='M0 205 Q120 175 240 195 T400 185 V240 H0 Z' fill='%23000000' opacity='0.12'/%3E%3Ctext x='200' y='125' font-family='sans-serif' font-size='46' text-anchor='middle'%3E🎙%3C/text%3E%3Ctext x='200' y='225' font-family='sans-serif' font-size='13' fill='%23ffffff' text-anchor='middle' opacity='0.9'%3EAudio recording session%3C/text%3E%3C/svg%3E"
      }
    ]
  }
];
