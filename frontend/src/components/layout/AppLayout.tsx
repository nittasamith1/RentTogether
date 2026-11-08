import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden font-sans" style={{ backgroundColor: '#FFF8ED' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ backgroundColor: '#FFF8ED' }}>
        <Navbar />
        <main className="flex-1 overflow-y-auto scroll-smooth overscroll-contain px-8 pb-12 pt-2">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
