import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchBackendHealth } from '../../services/health';
import { Activity, Database, CheckCircle2, AlertCircle } from 'lucide-react';

export const HealthBadge: React.FC = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['backend-health'],
    queryFn: fetchBackendHealth,
    refetchInterval: 15000, // Poll every 15s to verify live state
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-medium">
        <Activity className="w-3.5 h-3.5 animate-spin" />
        <span>Connecting to Backend...</span>
      </div>
    );
  }

  if (isError || !data || data.status !== 'healthy') {
    return (
      <div
        className="flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-full text-xs font-medium"
        title={error ? (error as Error).message : 'Backend offline'}
      >
        <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
        <span>Backend Offline (Run Django Server)</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200/80 text-emerald-800 rounded-full text-xs font-medium shadow-xs">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>API v{data.version} Online</span>
      </div>
      <span className="text-emerald-300">|</span>
      <div className="flex items-center gap-1 text-emerald-700">
        <Database className="w-3 h-3" />
        <span>DB: {data.database}</span>
      </div>
    </div>
  );
};

