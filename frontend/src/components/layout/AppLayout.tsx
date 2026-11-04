import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-full bg-brand-cream-50 overflow-hidden font-sans">
      {/* Fixed Deep Midnight Navy Sidebar */}
      <Sidebar />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-organic-hero">
        {/* Sticky Glass Navbar */}
        <Navbar />

        {/* Buttery-Smooth Scrollable Page Viewport */}
        <main className="flex-1 overflow-y-auto scroll-smooth overscroll-contain px-8 pb-12 transition-all">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
