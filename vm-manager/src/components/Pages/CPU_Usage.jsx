import React from 'react'
import { useMetrics } from '@/hooks/use-metrics';

export const CPU_Usage = () => {
  const { metrics, error } = useMetrics();

  if (error) return <div>Error: {error}</div>;
  if (!metrics) return <div>Loading...</div>;

  return (
    <div className="p-4 rounded-lg bg-card">
      <h2 className="text-lg font-semibold mb-4">CPU Usage</h2>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Usage</p>
          <div className="text-2xl font-bold">{metrics.cpu.usage_percent}%</div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Frequency</p>
          <div className="text-2xl font-bold">{(metrics.cpu.frequency_mhz / 1000).toFixed(2)} GHz</div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Cores</p>
          <div className="text-2xl font-bold">{metrics.cpu.cores}</div>
        </div>
      </div>
    </div>
  );
};
