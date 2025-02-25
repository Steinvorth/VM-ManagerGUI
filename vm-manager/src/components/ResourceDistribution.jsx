import React, { useMemo } from 'react';
import { Pie, PieChart, Cell, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Loader2 } from "lucide-react";
import { useMetrics } from '@/hooks/use-metrics';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart";

export const ResourceDistribution = () => {
  const { metrics, error, isLoading } = useMetrics();
  
  // Chart configuration
  const chartConfig = {
    usage: { label: "Usage" },
    virtualMachines: {
      label: "Virtual Machines",
      color: "hsl(var(--chart-1))",
    },
    dockerContainers: {
      label: "Docker Containers",
      color: "hsl(var(--chart-2))",
    },
    system: {
      label: "System Processes",
      color: "hsl(var(--chart-3))",
    },
    other: {
      label: "Other",
      color: "hsl(var(--chart-4))",
    },
  };

  // Generate chart data from API response - simpler calculation with proper null checks
  const chartData = useMemo(() => {
    if (!metrics || !metrics.distribution) return [];

    try {
      const { virtualMachines, dockerContainers, system, other } = metrics.distribution;
      
      return [
        { 
          name: 'virtualMachines', 
          usage: Math.max(0, (virtualMachines.cpu + virtualMachines.memory + virtualMachines.storage) / 3),
          fill: "hsl(var(--chart-1))" 
        },
        { 
          name: 'dockerContainers', 
          usage: Math.max(0, (dockerContainers.cpu + dockerContainers.memory + dockerContainers.storage) / 3),
          fill: "hsl(var(--chart-2))" 
        },
        { 
          name: 'system', 
          usage: Math.max(0, (system.cpu + system.memory + system.storage) / 3),
          fill: "hsl(var(--chart-3))" 
        },
        { 
          name: 'other', 
          usage: Math.max(0, (other.cpu + other.memory + other.storage) / 3),
          fill: "hsl(var(--chart-4))" 
        }
      ].filter(item => item.usage > 0.1); // Only show items with some usage
    } catch (e) {
      console.error("Error processing chart data:", e);
      return [];
    }
  }, [metrics]);

  if (isLoading) return (
    <Card className="metric-card">
      <CardHeader className="metric-card-header">
        <CardTitle className="text-base">Resource Distribution</CardTitle>
      </CardHeader>
      <CardContent className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </CardContent>
    </Card>
  );

  if (error) return (
    <Card className="metric-card">
      <CardHeader className="metric-card-header">
        <CardTitle className="text-base">Resource Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-red-500">Error: {error}</div>
      </CardContent>
    </Card>
  );

  if (!metrics) return (
    <Card className="metric-card">
      <CardHeader className="metric-card-header">
        <CardTitle className="text-base">Resource Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse">Loading...</div>
      </CardContent>
    </Card>
  );

  // Calculate the total resource usage for the footer text - with safe checks
  const totalCpuUsage = metrics.cpu?.usage_percent || 0;
  const totalMemoryUsage = metrics.memory?.percent || 0;
  const totalDiskUsage = metrics.disk?.percent || 0;
  const avgResourceUsage = ((totalCpuUsage + totalMemoryUsage + totalDiskUsage) / 3).toFixed(1);

  return (
    <Card className="metric-card flex flex-col">
      <CardHeader className="metric-card-header items-center pb-0">
        <CardTitle className="text-base font-semibold">Resource Distribution</CardTitle>
        <CardDescription>Usage by service type</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {chartData.length > 0 ? (
          <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={chartData}
                  dataKey="usage"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={60}
                  paddingAngle={2}
                  label={(entry) => `${Math.round(entry.value)}%`}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Legend 
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">No distribution data available</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="metric-card-footer flex-col gap-1 mt-auto">
        <div className="flex items-center gap-2 text-xs">
          <TrendingUp className="h-3 w-3" />
          <span className="font-medium">Overall resource usage: {avgResourceUsage}%</span>
        </div>
        <div className="text-[10px] text-muted-foreground">
          CPU: {totalCpuUsage.toFixed(1)}% | Memory: {totalMemoryUsage.toFixed(1)}% | Storage: {totalDiskUsage.toFixed(1)}%
        </div>
      </CardFooter>
    </Card>
  );
};