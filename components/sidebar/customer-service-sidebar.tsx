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

import { NavMain } from "@/components/nav/nav-main"
import { NavUser } from "@/components/nav/nav-staff"
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
    title: "Main Page",
    url: "/",
    icon: IconAppWindow,
  },
  {
    title: "Customer Service",
    url: "/customer-service",
    icon: IconUserCog,
  },
  {
    title: "FAQ",
    url: "/customer-service/faq",
    icon: IconMessages,
  },
  {
    title: "Contact Support",
    url: "/customer-service/contact-us",
    icon: IconMessagePlus,
  },
  
]



export function CustomerServiceSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
          <div>
            <Image
              src="/uploads/logos/tnapro-vertical-transparent.png"
              alt="Company Logo"
              width={24}
              height={24}
              className="h-full w-full object-contain"
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
