"use client"

import * as React from "react"
import {
  IconDashboard,
  IconClipboardCheck,
  IconUserCheck,
  IconSchool,
  IconFileText,
  IconCertificate,
  IconAppWindow,
  IconUserCog,
  IconMessages,
  IconMessagePlus,
} from "@tabler/icons-react"
import Image from "next/image"
import { useTranslations } from "next-intl"

import { NavMain } from "@/components/nav/nav-main"
import { NavUser } from "@/components/nav/nav-staff"
import { useAuth } from "@/providers/auth-provider"
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


export function CustomerServiceSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations('CustomerServiceSidebar')
  const { user } = useAuth()

  const navMainItems = React.useMemo(() => [
    {
      title: t('mainPage'),
      url: "/",
      icon: IconAppWindow,
    },
    {
      title: t('customerService'),
      url: "/customer-service",
      icon: IconUserCog,
    },
    {
      title: t('faq'),
      url: "/customer-service/faq",
      icon: IconMessages,
    },
    {
      title: t('contactSupport'),
      url: "/customer-service/contact-us",
      icon: IconMessagePlus,
    },
    {
      title: t('termsAndConditions'),
      url: "/customer-service/terms-conditions",
      icon: IconFileText,
    },
    {
      title: t('development'),
      url: "/customer-service/development",
      icon: IconDashboard,
    },
  ], [t])

  const getAvatarImage = () => {
    if (user?.image) return user.image
    if (user?.gender?.toLowerCase() === 'female') return '/female-avatar.svg'
    return '/male-avatar.svg'
  }

  const userData = {
    name: user?.name || t('staffUser'),
    email: user?.email || "staff@tnapro.com",
    avatar: getAvatarImage(),
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <div className="h-12 w-auto max-w-[180px] shrink-0 mx-auto">
            <Image
              src="/uploads/logos/tnapro-vertical-transparent.png"
              alt={t('companyLogo')}
              width={180}
              height={48}
              className="h-full w-auto object-contain"
            />
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} />
 
      </SidebarContent>

    </Sidebar>
  )
}
