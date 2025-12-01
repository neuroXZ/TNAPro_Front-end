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
    url: "/admin/dashboard",
    icon: IconDashboard,
  },
  {
    title: "Organization",
    url: "#",
    icon: IconBuilding,
    items: [
      {
        title: "Unit Types",
        url: "/admin/unittype",
      },
      {
        title: "Units",
        url: "/admin/units",
      },
      {
        title: "Grades",
        url: "/admin/grades",
      },
      {
        title: "Positions",
        url: "/admin/positions",
      },



    ],
  },
  {
    title: "Staff Development",
    url: "#",
    icon: IconUsers,
    items: [
      {
        title: "Staff Management",
        url: "/admin/staff",
      },
      {
        title: "Assessors",
        url: "/admin/assessors",
      },
    ],
  },
  {
    title: "Competency",
    url: "#",
    icon: IconTarget,
    items: [
      {
        title: "Levels",
        url: "/admin/levels",
      },
      {
        title: "Clusters",
        url: "/admin/clusters",
      },
      {
        title: "Competencies",
        url: "/admin/competencies",
      },
      {
        title: "Position Competencies",
        url: "/admin/position-competencies",
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
        url: "/admin/trainings",
      },
      {
        title: "Training Competencies",
        url: "/admin/training-competencies",
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

    ],
  },
  {
    title: "Reports & Analytics",
    url: "#",
    icon: IconChartBar,
    items: [
      {
        title: "IDP",
        url: "/admin/idp",
      },
      {
        title: "Reports",
        url: "/admin/reports",
      },
      {
        title: "Analytics",
        url: "/admin/analytics",
      },
    ],
  },
]

const navSecondaryItems = [
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
]

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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

  const userData = {
    name: user?.name || "Admin User",
    email: user?.email || "admin@tnapro.com",
    avatar: user?.image || '/male-avatar.svg',
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
