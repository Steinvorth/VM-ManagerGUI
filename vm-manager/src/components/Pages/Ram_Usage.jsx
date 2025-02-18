import React from 'react'
import { useMetrics } from '@/hooks/use-metrics';

export const Ram_Usage = () => {
  const { metrics, error } = useMetrics();

  if (error) return <div>Error: {error}</div>;
  if (!metrics) return <div>Loading...</div>;

  const formatBytes = (bytes) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(2) + ' GB';
  };

  return (
    <div className="p-4 rounded-lg bg-card">
      <h2 className="text-lg font-semibold mb-4">Memory Usage</h2>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Usage</p>
          <div className="text-2xl font-bold">{metrics.memory.percent}%</div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Available</p>
          <div className="text-2xl font-bold">{formatBytes(metrics.memory.available)}</div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total</p>
          <div className="text-2xl font-bold">{formatBytes(metrics.memory.total)}</div>
        </div>
      </div>
    </div>
  );
};
