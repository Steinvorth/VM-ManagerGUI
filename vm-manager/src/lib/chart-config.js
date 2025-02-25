export const chartConfig = {
  cpu: {
    label: "CPU Usage",
    color: "hsl(var(--chart-1))",
  },
  memory: {
    label: "Memory Usage",
    color: "hsl(var(--chart-2))",
  },
  storage: {
    label: "Storage Usage",
    color: "hsl(var(--chart-3))",
  },
  // New entries for resource distribution
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
}