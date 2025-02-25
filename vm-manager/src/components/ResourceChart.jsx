import React, { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { TrendingUp, Loader2 } from "lucide-react";
import { useMetrics } from '@/hooks/use-metrics';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { chartConfig } from '@/lib/chart-config';

export const ResourceChart = ({ 
  resourceType, // 'cpu', 'memory', or 'disk'
  title, 
  chartColor,
  metrics: propMetrics = null, // Optionally pass metrics directly (useful for testing)
}) => {
  const { metrics: hookMetrics, error, isLoading } = useMetrics();
  const metrics = propMetrics || hookMetrics;
  
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

    updateHeight();

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      resizeObserver.disconnect();
    };
  }, []);

  // Determine Y-axis ticks based on container height
  const getYAxisTicks = () => {
    if (containerHeight < 100) return [0, 50, 100];
    if (containerHeight < 150) return [0, 25, 50, 75, 100]; 
    return [0, 20, 40, 60, 80, 100]; // Fewer ticks for better performance
  };

  // Format bytes more efficiently
  const formatBytes = (bytes) => {
    if (bytes === undefined || bytes === null) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(2) + ' GB';
  };

  const getHeaderMetrics = () => {
    if (!metrics) return null;
    
    switch (resourceType) {
      case 'cpu':
        return (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] text-muted-foreground">Usage</p>
              <div className="text-lg font-bold">{metrics.cpu.usage_percent}%</div>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Frequency</p>
              <div className="text-lg font-bold">
                {(metrics.cpu.frequency_mhz / 1000).toFixed(2)} GHz
              </div>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Cores</p>
              <div className="text-lg font-bold">{metrics.cpu.cores}</div>
            </div>
          </div>
        );
      case 'memory':
        return (
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
        );
      case 'disk':
        return (
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
        );
      default:
        return null;
    }
  };

  // Get chart data with safety checks
  const chartData = useMemo(() => {
    if (!metrics) return [];
    
    try {
      let history;
      switch (resourceType) {
        case 'cpu':
          history = metrics.cpu?.history || [];
          break;
        case 'memory':
          history = metrics.memory?.history || [];
          break;
        case 'disk':
          history = metrics.disk?.history || [];
          break;
        default:
          return [];
      }
      
      return history.map(point => ({
        time: new Date(point.timestamp),
        usage: point.usage,
        label: new Date(point.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
      }));
    } catch (e) {
      console.error(`Error processing ${resourceType} chart data:`, e);
      return [];
    }
  }, [metrics, resourceType]);

  const getFooterText = () => {
    switch (resourceType) {
      case 'cpu':
        return 'Real-time CPU usage';
      case 'memory':
        return 'Real-time memory usage';
      case 'disk':
        return 'Real-time storage usage';
      default:
        return 'Resource usage';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="metric-card">
        <CardHeader className="metric-card-header">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="metric-card">
        <CardHeader className="metric-card-header">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }

  // No data state
  if (!metrics) {
    return (
      <Card className="metric-card">
        <CardHeader className="metric-card-header">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  // Simplified rendering with direct ResponsiveContainer usage
  return (
    <Card className="metric-card">
      <CardHeader className="metric-card-header">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {getHeaderMetrics()}
      </CardHeader>
      <CardContent className="metric-card-content">
        <div ref={containerRef} className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
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
              <Area
                dataKey="usage"
                type="natural"
                fill={`hsl(var(${chartColor}))`}
                fillOpacity={0.2}
                stroke={`hsl(var(${chartColor}))`}
                isAnimationActive={false} // Disable animation for performance
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <CardFooter className="metric-card-footer">
        <div className="grid gap-1">
          <div className="flex items-center gap-2 text-xs">
            <TrendingUp className="h-3 w-3" />
            <span className="font-medium">{getFooterText()}</span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            Updated every 15 seconds
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};