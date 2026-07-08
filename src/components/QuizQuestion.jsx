import React from 'react';

export default function QuizQuestion({ question, value, onChange }) {
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
          {' '}{opt}
        </label>
      ))}
    </div>
  );
}
