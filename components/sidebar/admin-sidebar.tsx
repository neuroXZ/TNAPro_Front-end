"use client"

import * as React from "react"
import {
  IconUsers,
  IconDashboard,
  IconTarget,
  IconSchool,
  IconClipboardList,
  IconChartBar,
  IconBuilding,
  IconCertificate,
} from "@tabler/icons-react"
import Image from "next/image"
import { NavMain } from "@/components/nav/nav-main"
import { NavUser } from "@/components/nav/nav-admin"
import { useAuth } from "@/providers/auth-provider"
import { settingAPI } from "@/lib/api"
import { useTranslations } from "next-intl"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const t = useTranslations('AdminSidebar')
  const [logoPath, setLogoPath] = React.useState<string | null>(null)

  const navMainItems = [
    {
      title: t('dashboard'),
      url: "/admin/dashboard",
      icon: IconDashboard,
    },
    {
      title: t('organization'),
      url: "#",
      icon: IconBuilding,
      items: [
        { title: t('unitTypes'), url: "/admin/unittype" },
        { title: t('units'), url: "/admin/units" },
        { title: t('grades'), url: "/admin/grades" },
        { title: t('positionCategories'), url: "/admin/position-category" },
        { title: t('positions'), url: "/admin/positions" },
      ],
    },
    {
      title: t('staffDevelopment'),
      url: "#",
      icon: IconUsers,
      items: [
        { title: t('staffManagement'), url: "/admin/staff" },
        { title: t('assessors'), url: "/admin/assessors" },
      ],
    },
    {
      title: t('competency'),
      url: "#",
      icon: IconTarget,
      items: [
        { title: t('levels'), url: "/admin/levels" },
        { title: t('clusters'), url: "/admin/clusters" },
        { title: t('competencies'), url: "/admin/competencies" },
        { title: t('competencyMapping'), url: "/admin/position-competencies" },
      ],
    },
    {
      title: t('training'),
      url: "#",
      icon: IconSchool,
      items: [
        { title: t('trainingPrograms'), url: "/admin/trainings" },
        { title: t('trainingMapping'), url: "/admin/training-competencies" },
      ],
    },
    {
      title: t('assessment'),
      url: "#",
      icon: IconClipboardList,
      items: [
        { title: t('assessments'), url: "/admin/assessments" },
      ],
    },
    {
      title: t('reportsAnalytics'),
      url: "#",
      icon: IconChartBar,
      items: [
        { title: t('idp'), url: "/admin/idp" },
        { title: t('reportAnalytics'), url: "/admin/analytics" },
        { title: t('competencyGapByGrade'), url: "/admin/analytics/competency-gap-by-grade" },
        { title: t('trainingDemand'), url: "/admin/analytics/training-demand" },
        { title: t('comparisons'), url: "/admin/analytics/comparisons" },
      ],
    },
  ]

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
        
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
