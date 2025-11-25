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
import { useAuth } from "@/lib/auth-context"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navMainItems = [
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
  ]

const navSecondaryItems = [
    {
      title: "Profile Settings",
      url: "/staff/profile",
      icon: IconSettings,
    },
  ]

export function StaffSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  const getAvatarImage = () => {
    if (user?.image) return user.image
    if (user?.gender?.toLowerCase() === 'female') return '/female-avatar.svg'
    return '/male-avatar.svg'
  }

  const userData = {
    name: user?.name || "Staff User",
    email: user?.email || "staff@tnapro.com",
    avatar: getAvatarImage(),
  }

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
        <NavMain items={navMainItems} />
        <NavSecondary items={navSecondaryItems} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
