import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Ultra-smooth, non-intrusive top-edge navigation progress bar
 * Similar to YouTube, GitHub, Linear, and Vercel.
 * Provides immediate visual feedback during route changes without shifting the HTML layout.
 */
export const TopProgressBar: React.FC = () => {
  const location = useLocation();
  const [progress, setProgress] = useState<number>(0);
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    // Start fast progress on route change
    setVisible(true);
    setProgress(35);

    const timer1 = setTimeout(() => {
      setProgress(75);
    }, 70);

    const timer2 = setTimeout(() => {
      setProgress(100);
    }, 180);

    const timer3 = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 380);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [location.pathname, location.search]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 pointer-events-none h-[2.5px] transition-opacity duration-200"
      style={{ opacity: visible ? 1 : 0 }}
      aria-hidden="true"
    >
      <div
        className="h-full transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #F5A623 0%, #7563D9 50%, #F28B82 100%)',
          boxShadow: '0 0 8px rgba(117, 99, 217, 0.4)',
        }}
      />
    </div>
  );
};
