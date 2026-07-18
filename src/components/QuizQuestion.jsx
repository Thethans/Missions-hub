import React from 'react';
import { Question } from '@phosphor-icons/react';
import { NEUTRAL_VALUES, TERM_DEFINITIONS } from '../data/quizQuestions.js';

// Display only — capitalize the first letter of the option's first word.
// The raw `opt` string is still what's stored and scored against the agency
// data, so this never affects matching.
const displayLabel = (opt) => opt.charAt(0).toUpperCase() + opt.slice(1);

// The native `title` attribute this used to rely on has no visual cue that
// a term is hoverable and needs a ~1s hover to appear — invisible in
// practice (real user report: definitions "don't show" even for terms that
// have one, e.g. "faith-support model" and "business as mission"). A
// visible trigger + CSS-only hover/focus-revealed bubble works on desktop
// hover, mobile tap, and keyboard focus without extra JS state.
function TermTooltip({ term, definition }) {
  if (!definition) return null;
  return (
    <span className="term-tooltip">
      <button
        type="button"
        className="term-tooltip-trigger"
        aria-label={`What does "${term}" mean?`}
        onClick={(e) => {
          // Nested inside the option's <label> — without this, tapping the
          // trigger would also toggle the checkbox/radio it sits next to.
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Question size={14} weight="bold" />
      </button>
      <span className="term-tooltip-bubble" role="tooltip">{definition}</span>
    </span>
  );
}

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
              {' '}<span className="option-label">{displayLabel(opt)}</span>
              <TermTooltip term={displayLabel(opt)} definition={TERM_DEFINITIONS[opt]} />
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
            {' '}<span className="option-label">{displayLabel(opt)}</span>
            <TermTooltip term={displayLabel(opt)} definition={TERM_DEFINITIONS[opt]} />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
