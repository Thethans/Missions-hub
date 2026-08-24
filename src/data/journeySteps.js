// The stops in the site's core journey — reused by the scrollytelling
// JourneySection (full copy) and anywhere else that needs the short list.
// A "Prepare without dropping things" step (the pre-field checklist) is
// temporarily removed — see TopNav.jsx's own comment: the checklist page
// and route are still live, just pulled from the nav tabs for now, so
// promoting it as a journey step would point somewhere the primary nav no
// longer surfaces. Re-add between "Find agencies..." and "Get to the
// field" (renumbering) once the nav link comes back.
export const JOURNEY_STEPS = [
  {
    n: '01',
    title: 'See where the need is',
    desc: 'Start on the map. Every point is a real people group from Joshua Project — red means little to no access to the gospel in their own language and culture.'
  },
  {
    n: '02',
    title: 'Find agencies worth a conversation',
    desc: 'Answer seven questions and get matched against 14 real sending agencies — with an honest breakdown of what matched and what to ask them directly.'
  },
  {
    n: '03',
    title: 'Get to the field',
    desc: 'The goal was never the website. Talk to real people at the agencies that fit, and go.'
  }
];
