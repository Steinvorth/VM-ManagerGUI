import { AppSidebar } from "@/components/app-sidebar"
import { ResourceChart } from "@/components/ResourceChart"
import { ResourceDistribution } from "@/components/ResourceDistribution"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

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
            <ResourceDistribution />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
