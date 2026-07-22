import React, { useState } from 'react';
import { NEUTRAL_VALUES } from '../data/quizQuestions.js';

// Display only — capitalize the first letter of the option's first word.
// The raw `opt` string is still what's stored and scored against the agency
// data, so this never affects matching.
const displayLabel = (opt) => opt.charAt(0).toUpperCase() + opt.slice(1);

export default function QuizQuestion({ question, value, onChange }) {
  // Only the multi-select branch below needs this — the neutral/exclusive
  // toggle silently unchecks sibling checkboxes as a side effect, which a
  // sighted user sees happen but a screen-reader user gets no signal of at
  // all (checking one box doesn't otherwise announce unrelated boxes
  // changing state). This textual announcement is that signal.
  const [announcement, setAnnouncement] = useState('');

  if (question.multi) {
    const selected = value || [];
    const toggle = (opt) => {
      if (NEUTRAL_VALUES.has(opt)) {
        // Neutral option ("no strong preference"/"not sure yet") is exclusive —
        // picking it clears everything else, and it's cleared by picking anything else.
        const selecting = !selected.includes(opt);
        setAnnouncement(
          selecting && selected.length > 0
            ? `Selecting "${displayLabel(opt)}" cleared your other selections for this question.`
            : ''
        );
        onChange(selecting ? [opt] : []);
        return;
      }
      const hadNeutral = selected.some((v) => NEUTRAL_VALUES.has(v));
      setAnnouncement(hadNeutral ? `Selecting "${displayLabel(opt)}" cleared "no strong preference."` : '');
      const withoutNeutral = selected.filter((v) => !NEUTRAL_VALUES.has(v));
      onChange(
        withoutNeutral.includes(opt)
          ? withoutNeutral.filter((v) => v !== opt)
          : [...withoutNeutral, opt]
      );
    };

    return (
      <fieldset className="question">
        {/* Native <legend> always renders straddling the fieldset's own
            top edge (outside the box its background paints), so it can't
            double as the visible card heading — keep it for the group's
            accessible name only, and show a real heading inside the card. */}
        <legend className="visually-hidden">{question.text}</legend>
        <div className="question-card">
          <p className="question-heading" aria-hidden="true">{question.text}</p>
          {question.options.map((opt) => (
            <label key={opt}>
              <input
                type="checkbox"
                name={question.key}
                value={opt}
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
              />
              {' '}<span className="option-label">{displayLabel(opt)}</span>
            </label>
          ))}
          <p className="visually-hidden" role="status" aria-live="polite">{announcement}</p>
        </div>
      </fieldset>
    );
  }

  return (
    <fieldset className="question">
      <legend className="visually-hidden">{question.text}</legend>
      <div className="question-card">
        <p className="question-heading" aria-hidden="true">{question.text}</p>
        {question.options.map((opt) => (
          <label key={opt}>
            <input
              type="radio"
              name={question.key}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(opt)}
            />
            {' '}<span className="option-label">{displayLabel(opt)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
