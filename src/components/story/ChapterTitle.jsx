import React from 'react';
import VariableBloom from './VariableBloom.jsx';

// Shared by every chapter (Command/Abyss/Pattern/Cost) — was a single
// small <div> per chapter ("Chapter I — The Command" as one
// undifferentiated mono line, and Chapter II had no visible title at all).
// A real <h2> here does two things at once: gives the number its own
// quieter rank so the actual title reads as the headline, and puts these
// section titles into the page's real heading hierarchy for the first time
// (they sat outside it entirely before, under a <div>). The title text
// itself gets the same variable-font bloom as ColdOpen's "4.3B" — the
// story's own dynamic-type treatment, not just the homepage hero's.
export default function ChapterTitle({ number, title }) {
  return (
    <div className="chapter-title">
      <span className="chapter-title-number">Chapter {number}</span>
      <h2 className="chapter-title-name">
        <VariableBloom>{title}</VariableBloom>
      </h2>
    </div>
  );
}
