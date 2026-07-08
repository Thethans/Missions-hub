import React, { useState } from 'react';
import agencies from '../data/agencies.json';

const QUESTIONS = [
  {
    key: 'focus',
    text: 'What kind of ministry pulls you most?',
    options: ['church planting', 'unreached peoples', 'medical', 'Bible translation', 'creative access']
  },
  {
    key: 'tradition',
    text: 'What theological tradition fits you best?',
    options: ['broadly evangelical', 'Baptist / conservative evangelical']
  },
  {
    key: 'supportRaising',
    text: 'How do you feel about support raising?',
    options: ['full personal support raising', 'faith-support model']
  }
];

function scoreAgency(agency, answers) {
  let score = 0;
  if (answers.focus && agency.focus.includes(answers.focus)) score += 2;
  if (answers.tradition && agency.tradition === answers.tradition) score += 1;
  if (answers.supportRaising && agency.supportRaising === answers.supportRaising) score += 1;
  return score;
}

export default function MatchQuiz() {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const results = [...agencies]
    .map((a) => ({ ...a, score: scoreAgency(a, answers) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <div className="matcher">
      <h2>Find your mission board</h2>
      <p>This is a starting point, not a final answer — always talk to a real person at each agency.</p>

      {QUESTIONS.map((q) => (
        <div className="question" key={q.key}>
          <strong>{q.text}</strong>
          {q.options.map((opt) => (
            <label key={opt}>
              <input
                type="radio"
                name={q.key}
                value={opt}
                checked={answers[q.key] === opt}
                onChange={() => setAnswers({ ...answers, [q.key]: opt })}
              />
              {' '}{opt}
            </label>
          ))}
        </div>
      ))}

      <button onClick={() => setSubmitted(true)}>See my matches</button>

      {submitted && (
        <div className="results">
          <h3>Closest matches</h3>
          {results.map((r) => (
            <div className="board-card" key={r.name}>
              <h4>{r.name}</h4>
              <p>{r.tradition} — {r.focus.join(', ')}</p>
              <p><em>{r.supportRaising}</em></p>
              <a href={r.url} target="_blank" rel="noreferrer">Visit site →</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
