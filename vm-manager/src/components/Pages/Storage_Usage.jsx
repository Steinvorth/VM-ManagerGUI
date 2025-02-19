import React from 'react';
import { useMetrics } from '@/hooks/use-metrics';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export const Storage_Usage = () => {
  const { metrics, error } = useMetrics();

  const formatBytes = (bytes) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(2) + ' GB';
  };

  if (error) return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Storage Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-red-500">Error: {error}</div>
      </CardContent>
    </Card>
  );

  if (!metrics) return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Storage Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse">Loading...</div>
      </CardContent>
    </Card>
  );

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Storage Usage</CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
};
