import React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { useMetrics } from '@/hooks/use-metrics';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { chartConfig } from '@/lib/chart-config';

export const Storage_Usage = () => {
  const { metrics, error } = useMetrics();
  const containerRef = React.useRef(null);
  const [containerHeight, setContainerHeight] = React.useState(0);

  React.useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    // Create ResizeObserver for more accurate size tracking
    const resizeObserver = new ResizeObserver(updateHeight);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Initial measurement
    updateHeight();

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      resizeObserver.disconnect();
    };
  }, []);

  const getYAxisTicks = () => {
    if (containerHeight < 100) {
      return [0, 50, 100];
    } else if (containerHeight < 150) {
      return [0, 20, 40, 60, 80, 100];
    }
    return [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  };

  const formatBytes = (bytes) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(2) + ' GB';
  };

  const chartData = React.useMemo(() => {
    if (!metrics?.disk?.history) return [];
    return metrics.disk.history.map(point => ({
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
        <CardTitle className="text-base">Storage Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-red-500">Error: {error}</div>
      </CardContent>
    </Card>
  );

  if (!metrics) return (
    <Card className="w-full h-[280px]">
      <CardHeader className="p-3">
        <CardTitle className="text-base">Storage Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse">Loading...</div>
      </CardContent>
    </Card>
  );

  return (
    <Card className="metric-card">
      <CardHeader className="metric-card-header">
        <CardTitle className="text-base font-semibold">Storage Usage</CardTitle>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground">Usage</p>
            <div className="text-lg font-bold">{metrics.disk.percent}%</div>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Free Space</p>
            <div className="text-lg font-bold">{formatBytes(metrics.disk.free)}</div>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Total Space</p>
            <div className="text-lg font-bold">{formatBytes(metrics.disk.total)}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="metric-card-content">
        <div ref={containerRef} className="chart-container">
          <ChartContainer config={chartConfig} className="w-full aspect-auto">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 30, bottom: 5 }}
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
                  tickMargin={5}
                  width={25}
                  tick={{ fontSize: 10 }}
                  ticks={getYAxisTicks()}
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
                  fill={`hsl(var(--chart-3))`}
                  fillOpacity={0.2}
                  stroke={`hsl(var(--chart-3))`}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
      <CardFooter className="metric-card-footer">
        <div className="grid gap-2">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4" />
            <span className="font-medium">Real-time storage usage</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Updated every 15 seconds
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};
