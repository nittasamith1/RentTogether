import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-full bg-brand-cream overflow-hidden">
      {/* Fixed Deep Navy Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <Navbar />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto px-8 pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

