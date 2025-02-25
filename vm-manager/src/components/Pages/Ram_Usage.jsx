import React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
      time: new Date(point.timestamp),
      usage: point.usage,
      label: new Date(point.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    }));
  }, [metrics]);

  if (error) return (
    <Card className="w-full h-[280px]">
      <CardHeader className="p-3">
        <CardTitle className="text-base">Memory Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-red-500">Error: {error}</div>
      </CardContent>
    </Card>
  );

  if (!metrics) return (
    <Card className="w-full h-[280px]">
      <CardHeader className="p-3">
        <CardTitle className="text-base">Memory Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse">Loading...</div>
      </CardContent>
    </Card>
  );

  return (
    <Card className="metric-card">
      <CardHeader className="metric-card-header">
        <CardTitle className="text-base font-semibold">Memory Usage</CardTitle>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground">Usage</p>
            <div className="text-lg font-bold">{metrics.memory.percent}%</div>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Available</p>
            <div className="text-lg font-bold">{formatBytes(metrics.memory.available)}</div>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Total</p>
            <div className="text-lg font-bold">{formatBytes(metrics.memory.total)}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="metric-card-content">
        <div className="chart-container">
          <ChartContainer config={chartConfig}>
            <AreaChart
              data={chartData}
              width="100%"
              height="100%"
              margin={{ top: 5, right: 25, left: 35, bottom: 5 }}
              accessibilityLayer
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                height={24}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={35}
                tick={{ fontSize: 11 }}
                ticks={[0, 20, 40, 60, 80, 100]}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Area
                dataKey="usage"
                type="natural"
                fill={`hsl(var(--chart-2))`}
                fillOpacity={0.2}
                stroke={`hsl(var(--chart-2))`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
      <CardFooter className="metric-card-footer">
        <div className="grid gap-2">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4" />
            <span className="font-medium">Real-time memory usage</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Updated every 15 seconds
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};
