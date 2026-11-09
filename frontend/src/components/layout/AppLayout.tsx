import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const AppLayout: React.FC = () => {
  // 1. Default State: CLOSED whenever the user opens or refreshes the application
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Close / collapse sidebar whenever route changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Support keyboard accessibility: Close sidebar with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans" style={{ backgroundColor: '#FFF8ED' }}>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0" style={{ backgroundColor: '#FFF8ED' }}>
        <Navbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />
        <main
          onClick={() => {
            // Clicking outside the sidebar in main content closes the expanded sidebar
            if (isSidebarOpen) setIsSidebarOpen(false);
          }}
          className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-6 lg:px-8 pb-12 pt-2"
        >
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
