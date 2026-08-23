import React from 'react';

// Shared by every chapter (Command/Abyss/Pattern/Cost/Ending) — was a
// single small <div> per chapter ("Chapter I — The Command" as one
// undifferentiated mono line, and Chapter II had no visible title at all).
// A real <h2> here does two things at once: gives the number its own
// quieter rank so the actual title reads as the headline, and puts these
// section titles into the page's real heading hierarchy for the first time
// (they sat outside it entirely before, under a <div>).
export default function ChapterTitle({ number, title }) {
  return (
    <div className="chapter-title">
      <span className="chapter-title-number">Chapter {number}</span>
      <h2 className="chapter-title-name">{title}</h2>
    </div>
  );
}
