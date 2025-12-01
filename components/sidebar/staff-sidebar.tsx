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
import Image from "next/image"

import { NavMain } from "@/components/nav/nav-main"
import { NavSecondary } from "@/components/nav/nav-secondary"
import { NavUser } from "@/components/nav/nav-user"
import { useAuth } from "@/lib/auth-context"
import { settingAPI } from "@/lib/api"
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
  const [logoPath, setLogoPath] = React.useState<string | null>(null)

  // Fetch logo from settings on component mount
  React.useEffect(() => {
    const fetchLogo = async () => {
      try {
        const settings = await settingAPI.getAll();
        if (settings && settings.length > 0 && settings[0].logoPath) {
          setLogoPath(settings[0].logoPath);
        }
      } catch (error) {
        console.warn('Failed to fetch logo, using default');
      }
    };

    fetchLogo();
  }, []);

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
          {logoPath ? (
            <div >
              <Image
                src={logoPath}
                alt="Company Logo"
                width={24}
                height={24}
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <IconCertificate />
          )}
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
