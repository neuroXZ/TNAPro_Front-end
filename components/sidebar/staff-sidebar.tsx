"use client"

import * as React from "react"
import {
  IconDashboard,
  IconClipboardCheck,
  IconUserCheck,
  IconSchool,
  IconFileText,
  IconCertificate,
  IconMenu2,
} from "@tabler/icons-react"
import Image from "next/image"

import { NavMain } from "@/components/nav/nav-main"
import { NavUser } from "@/components/nav/nav-staff"
import { useAuth } from "@/providers/auth-provider"
import { settingAPI } from "@/lib/api"
import { useIsMobile } from "@/hooks/use-mobile"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { useSettings } from "@/hooks/use-settings"
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


export function StaffSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const t = useTranslations('StaffSidebar')
  const [logoPath, setLogoPath] = React.useState<string | null>(null)
  const isMobile = useIsMobile()
  const { flags: featureFlags } = useFeatureFlags()
  const { settings } = useSettings()

  const navMainItems = [
    { title: t('dashboard'), url: "/staff/dashboard", icon: IconDashboard },
    ...(featureFlags.superiorOnlyAssessment ? [] : [
      { title: t('selfAssessment'), url: "/staff/assessments", icon: IconClipboardCheck },
    ]),
    { title: t('superiorAssessment'), url: "/staff/superior-assessments", icon: IconUserCheck },
    { title: t('myCompetencies'), url: "/staff/competencies", icon: IconCertificate },
    ...(settings.hideIdpFromStaff ? [] : [
      { title: t('myIdp'), url: "/staff/idp", icon: IconFileText },
    ]),
    { title: t('myTraining'), url: "/staff/training", icon: IconSchool },
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
    <Sidebar collapsible={isMobile ? "offcanvas" : "icon"} {...props}>
      <SidebarHeader className={isMobile ? "p-3" : undefined}>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/" className={isMobile ? "gap-3" : undefined}>
                <div className="h-10 w-auto max-w-[140px] shrink-0">
                  {logoPath ? (
                    <Image
                      src={logoPath}
                      alt="Company Logo"
                      width={140}
                      height={40}
                      className="h-full w-auto object-contain"
                    />
                  ) : (
                    <IconCertificate className={isMobile ? "size-5" : "size-4"} />
                  )}
                </div>
                {/* {isMobile && (
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">TNAPro</span>
                    <span className="text-xs text-muted-foreground">Staff Portal v2.0</span>
                  </div>
                )} */}
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
