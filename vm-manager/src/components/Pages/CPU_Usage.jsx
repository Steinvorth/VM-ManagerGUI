import React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import { useMetrics } from '@/hooks/use-metrics';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { chartConfig } from '@/lib/chart-config';

export const CPU_Usage = () => {
  const { metrics, error } = useMetrics();

  const chartData = React.useMemo(() => {
    if (!metrics?.cpu?.history) return [];
    return metrics.cpu.history.map(point => ({
      time: new Date(point.timestamp),
      usage: point.usage,
      label: new Date(point.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    }));
  }, [metrics]);

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
      <CardHeader className="space-y-1 p-4">
        <CardTitle className="text-lg font-semibold">CPU Usage</CardTitle>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Usage</p>
            <div className="text-xl font-bold">{metrics.cpu.usage_percent}%</div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Frequency</p>
            <div className="text-xl font-bold">
              {(metrics.cpu.frequency_mhz / 1000).toFixed(2)} GHz
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cores</p>
            <div className="text-xl font-bold">{metrics.cpu.cores}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <ChartContainer config={chartConfig}>
          <AreaChart
            data={chartData}
            height={200}
            margin={{ top: 5, right: 30, left: 35, bottom: 5 }}
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
              fill={`hsl(var(--chart-1))`}
              fillOpacity={0.2}
              stroke={`hsl(var(--chart-1))`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="p-4">
        <div className="grid gap-2">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4" />
            <span className="font-medium">Real-time CPU usage</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Updated every 15 seconds
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};
