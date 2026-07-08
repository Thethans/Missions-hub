import React from 'react';
import { Outlet } from 'react-router-dom';
import TopNav from '../components/TopNav.jsx';

export default function RootLayout() {
  return (
    <div className="app-shell">
      <TopNav />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
