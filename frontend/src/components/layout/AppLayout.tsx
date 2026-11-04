import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-full bg-[#FDFBF9] overflow-hidden font-sans text-[#061C3D]">
      {/* Fixed Deep Midnight Navy Sidebar */}
      <Sidebar />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FDFBF9]">
        {/* Transparent Top Navbar */}
        <Navbar />

        {/* Buttery-Smooth Scrollable Page Viewport */}
        <main className="flex-1 overflow-y-auto scroll-smooth overscroll-contain px-8 pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
