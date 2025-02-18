import React from 'react'
import { useMetrics } from '@/hooks/use-metrics';

export const Storage_Usage = () => {
  const { metrics, error } = useMetrics();

  if (error) return <div>Error: {error}</div>;
  if (!metrics) return <div>Loading...</div>;

  const formatBytes = (bytes) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(2) + ' GB';
  };

  return (
    <div className="p-4 rounded-lg bg-card">
      <h2 className="text-lg font-semibold mb-4">Storage Usage</h2>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Usage</p>
          <div className="text-2xl font-bold">{metrics.disk.percent}%</div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Free Space</p>
          <div className="text-2xl font-bold">{formatBytes(metrics.disk.free)}</div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Space</p>
          <div className="text-2xl font-bold">{formatBytes(metrics.disk.total)}</div>
        </div>
      </div>
    </div>
  );
};
