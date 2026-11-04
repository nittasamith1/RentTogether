import React from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
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
    <div className="max-w-4xl mx-auto py-8">
      <Card className="text-center py-16 px-6 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <Clock className="w-7 h-7" />
        </div>
        <div className="inline-block px-3 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-full">
          Scheduled for {phase}
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">{description}</p>
        <div className="pt-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};
