import React, { useState } from 'react';
import WorldMap from './components/WorldMap.jsx';
import MatchQuiz from './components/MatchQuiz.jsx';
import Checklist from './components/Checklist.jsx';

export default function App() {
  const [view, setView] = useState('map'); // 'map' | 'matcher' | 'checklist'

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>Fielded</h1>
        <nav>
          <button className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}>
            World Map
          </button>
          <button className={view === 'matcher' ? 'active' : ''} onClick={() => setView('matcher')}>
            Find My Board
          </button>
          <button className={view === 'checklist' ? 'active' : ''} onClick={() => setView('checklist')}>
            Pre-Field Checklist
          </button>
        </nav>
      </header>

      <main>
        {view === 'map' && <WorldMap />}
        {view === 'matcher' && <MatchQuiz />}
        {view === 'checklist' && <Checklist />}
      </main>
    </div>
  );
}
