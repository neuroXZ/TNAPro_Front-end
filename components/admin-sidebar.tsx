"use client"

import * as React from "react"
import {
  IconUsers,
  IconDashboard,
  IconBriefcase,
  IconTarget,
  IconSchool,
  IconClipboardList,
  IconChartBar,
  IconSettings,
  IconMail,
  IconBuilding,
  IconHierarchy,
  IconCertificate,
  IconStairs,
  IconUserCheck,
  IconFileText,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Admin User",
    email: "admin@tnapro.com",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Staff Management",
      url: "/admin/staff",
      icon: IconUsers,
    },
    {
      title: "Organization",
      url: "#",
      icon: IconBuilding,
      items: [
        {
          title: "Unit Types",
          url: "/admin/unit-types",
        },
        {
          title: "Units",
          url: "/admin/units",
        },
        {
          title: "Positions",
          url: "/admin/positions",
        },
        {
          title: "Grades",
          url: "/admin/grades",
        },
        {
          title: "Clusters",
          url: "/admin/clusters",
        },
      ],
    },
    {
      title: "Competency",
      url: "#",
      icon: IconTarget,
      items: [
        {
          title: "Competencies",
          url: "/admin/competencies",
        },
        {
          title: "Position Competencies",
          url: "/admin/position-competencies",
        },
        {
          title: "Levels",
          url: "/admin/levels",
        },
      ],
    },
    {
      title: "Training",
      url: "#",
      icon: IconSchool,
      items: [
        {
          title: "Training Programs",
          url: "/admin/training",
        },
        {
          title: "Training Competencies",
          url: "/admin/training-competencies",
        },
        {
          title: "IDP",
          url: "/admin/idp",
        },
      ],
    },
    {
      title: "Assessment",
      url: "#",
      icon: IconClipboardList,
      items: [
        {
          title: "Assessments",
          url: "/admin/assessments",
        },
        {
          title: "Assessment Results",
          url: "/admin/assessment-results",
        },
        {
          title: "Assessors",
          url: "/admin/assessors",
        },
      ],
    },
    {
      title: "Reports",
      url: "#",
      icon: IconChartBar,
      items: [
        {
          title: "Submissions",
          url: "/admin/reports/submissions",
        },
        {
          title: "IDP Reports",
          url: "/admin/reports/idp",
        },
        {
          title: "Analytics",
          url: "/admin/analytics",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/admin/settings",
      icon: IconSettings,
    },
    {
      title: "Mail Templates",
      url: "/admin/mails",
      icon: IconMail,
    },
  ],
}

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="/admin/dashboard">
                <IconCertificate className="size-5!" />
                <span className="text-base font-semibold">TNA Pro Admin</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
