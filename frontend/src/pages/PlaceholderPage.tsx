import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';

interface PlaceholderProps {
  title: string;
  description: string;
  phase: string;
}

export const PlaceholderPage: React.FC<PlaceholderProps> = ({ title, description, phase }) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto py-12">
      <div
        className="text-center py-16 px-6 space-y-4 rounded-3xl border shadow-sm"
        style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
          style={{ backgroundColor: '#FFE5D6', color: '#E8A447' }}
        >
          <Clock className="w-7 h-7" />
        </div>
        <div
          className="inline-block px-3 py-1 text-xs font-bold rounded-full border"
          style={{ backgroundColor: '#FFF8ED', borderColor: '#F5CDB8', color: '#E8A447' }}
        >
          Scheduled for {phase}
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: '#303653' }}>
          {title}
        </h1>
        <p className="text-sm max-w-md mx-auto" style={{ color: '#85899B' }}>
          {description}
        </p>
        <div className="pt-4">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs"
            style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1', color: '#303653' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FFF8ED')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFCF7')}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
