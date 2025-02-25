import React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import { useMetrics } from '@/hooks/use-metrics';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { chartConfig } from '@/lib/chart-config';

export const Ram_Usage = () => {
  const { metrics, error } = useMetrics();

  const formatBytes = (bytes) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(2) + ' GB';
  };

  const chartData = React.useMemo(() => {
    if (!metrics?.memory?.history) return [];
    return metrics.memory.history.map(point => ({
      time: new Date(point.timestamp).toLocaleTimeString(),
      usage: point.usage
    }));
  }, [metrics]);

  if (error) return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Memory Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-red-500">Error: {error}</div>
      </CardContent>
    </Card>
  );

  if (!metrics) return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Memory Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse">Loading...</div>
      </CardContent>
    </Card>
  );

  return (
    <Card className="col-span-1">
      <CardHeader className="space-y-1">
        <CardTitle>Memory Usage</CardTitle>
        <div className="grid grid-cols-3 gap-4">
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
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            data={chartData}
            height={200}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 5)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="usage"
              stroke={chartConfig.memory.color}
              fill={chartConfig.memory.color}
              fillOpacity={0.2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          <span>Real-time memory usage</span>
        </div>
      </CardFooter>
    </Card>
  );
};
