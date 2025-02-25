import { AppSidebar } from "@/components/app-sidebar"
import { CPU_Usage } from "@/components/Pages/CPU_Usage"
import { Ram_Usage } from "@/components/Pages/Ram_Usage"
import { Storage_Usage } from "@/components/Pages/Storage_Usage"
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
            <CPU_Usage />
            <Ram_Usage />
          </div>
          <div className="metrics-row">
            <Storage_Usage />
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
