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
      <div className="question">
        <strong>{question.text}</strong>
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
    );
  }

  return (
    <div className="question">
      <strong>{question.text}</strong>
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
  );
}
