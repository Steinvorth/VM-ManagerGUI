import { AppSidebar } from "@/components/app-sidebar"
import { ResourceChart } from "@/components/ResourceChart"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function App() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="metrics-container">
          <div className="metrics-row">
            <ResourceChart 
              resourceType="cpu" 
              title="CPU Usage" 
              chartColor="--chart-1" 
            />
            <ResourceChart 
              resourceType="memory" 
              title="Memory Usage" 
              chartColor="--chart-2" 
            />
          </div>
          <div className="metrics-row">
            <ResourceChart 
              resourceType="disk" 
              title="Storage Usage" 
              chartColor="--chart-3" 
            />
            <Card className="metric-card">
              <CardHeader className="metric-card-header">
                <CardTitle className="text-base font-semibold">Network Usage</CardTitle>
              </CardHeader>
              <CardContent className="metric-card-content">
                {/* Future network metrics */}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
