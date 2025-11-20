"use client"

import * as React from "react"
import {
  IconDashboard,
  IconClipboardCheck,
  IconUserCheck,
  IconSchool,
  IconFileText,
  IconSettings,
  IconHelp,
  IconCertificate,
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
    name: "Staff User",
    email: "staff@tnapro.com",
    avatar: "/avatars/staff.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/staff/dashboard",
      icon: IconDashboard,
    },
    {
      title: "My Profile",
      url: "/staff/profile",
      icon: IconUserCheck,
    },
    {
      title: "Self Assessment",
      url: "/staff/assessments",
      icon: IconClipboardCheck,
    },
    {
      title: "Superior Assessment",
      url: "/staff/superior-assessments",
      icon: IconUserCheck,
    },
    {
      title: "My Competencies",
      url: "/staff/competencies",
      icon: IconCertificate,
    },
    {
      title: "My IDP",
      url: "/staff/idp",
      icon: IconFileText,
    },
    {
      title: "My Training",
      url: "/staff/training",
      icon: IconSchool,
    },
  ],
  navSecondary: [
    {
      title: "Profile Settings",
      url: "/staff/profile",
      icon: IconSettings,
    },
  ],
}

export function StaffSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="/staff/dashboard">
                <IconCertificate className="size-5!" />
                <span className="text-base font-semibold">TNA Pro Staff</span>
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
