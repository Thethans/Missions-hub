import React from 'react';
import { NEUTRAL_VALUES } from '../data/quizQuestions.js';

export default function QuizQuestion({ question, value, onChange }) {
  if (question.multi) {
    const selected = value || [];
    const toggle = (opt) => {
      if (NEUTRAL_VALUES.has(opt)) {
        // Neutral option ("no strong preference"/"not sure yet") is exclusive —
        // picking it clears everything else, and it's cleared by picking anything else.
        onChange(selected.includes(opt) ? [] : [opt]);
        return;
      }
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
              {' '}<span className="option-label">{opt}</span>
            </label>
          ))}
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
            {' '}<span className="option-label">{opt}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
