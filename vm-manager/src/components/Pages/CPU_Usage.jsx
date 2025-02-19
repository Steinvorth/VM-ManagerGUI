import React from 'react';
import { useMetrics } from '@/hooks/use-metrics';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export const CPU_Usage = () => {
  const { metrics, error } = useMetrics();

  if (error) return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>CPU Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-red-500">Error: {error}</div>
      </CardContent>
    </Card>
  );

  if (!metrics) return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>CPU Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse">Loading...</div>
      </CardContent>
    </Card>
  );

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>CPU Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Usage</p>
            <div className="text-2xl font-bold">{metrics.cpu.usage_percent}%</div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Frequency</p>
            <div className="text-2xl font-bold">
              {(metrics.cpu.frequency_mhz / 1000).toFixed(2)} GHz
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Cores</p>
            <div className="text-2xl font-bold">{metrics.cpu.cores}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
