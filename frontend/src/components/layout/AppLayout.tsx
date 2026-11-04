import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-full bg-[#F7F8FA] overflow-hidden font-sans text-slate-800">
      {/* Clean White Sidebar */}
      <Sidebar />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F7F8FA]">
        {/* Top Navbar */}
        <Navbar />

        {/* Smooth Scrollable Page Viewport */}
        <main className="flex-1 overflow-y-auto scroll-smooth overscroll-contain px-8 pb-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
