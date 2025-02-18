import * as React from "react"
import {
  Box,
  Container,
  MonitorPlay,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { NavDashboard } from "./nav-dashboard"

// Updated sample data
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Home Lab",
      logo: MonitorPlay,
      plan: "Personal",
    },
  ],
  navMain: [
    {
      title: "Docker Containers",
      url: "#",
      icon: Container,
      items: [
        {
          title: "nginx-proxy",
          url: "#",
        },
        {
          title: "postgres-db",
          url: "#",
        },
        {
          title: "redis-cache",
          url: "#",
        },
      ],
    },
    {
      title: "Virtual Machines",
      url: "#",
      icon: Box,
      items: [
        {
          title: "Ubuntu-Server",
          url: "#",
        },
        {
          title: "Windows-10-Pro",
          url: "#",
        },
        {
          title: "Debian-11",
          url: "#",
        },
      ],
    },
  ],
}

export function AppSidebar({
  ...props
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavDashboard projects={data.projects} />
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
