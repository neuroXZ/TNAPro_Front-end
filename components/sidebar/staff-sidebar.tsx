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
import { useAuth } from "@/lib/auth-context"
import { settingAPI } from "@/lib/api"
import { useIsMobile } from "@/hooks/use-mobile"
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



export function StaffSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const [logoPath, setLogoPath] = React.useState<string | null>(null)
  const isMobile = useIsMobile()

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
                <div>
                  {logoPath ? (
                    <div>
                      <Image
                        src={logoPath}
                        alt="Company Logo"
                        width={24}
                        height={24}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <IconCertificate className={isMobile ? "size-5" : "size-4"} />
                  )}
                </div>
                {/* {isMobile && (
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">TNA Pro</span>
                    <span className="text-xs text-muted-foreground">Staff Portal v2.0</span>
                  </div>
                )} */}
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {isMobile ? (
          /* Mobile: Show system description instead of navigation */
          <div className="flex flex-col gap-4 p-4">
            <div className="space-y-3">
              <div className="border-l-4 border-primary pl-3">
                <h3 className="font-semibold text-sm text-foreground">TNA Pro System</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Training Needs Analysis Professional
                </p>
              </div>
              
              <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                <p>
                  Sistem komprehensif untuk analisis keperluan latihan pekerja yang membantu organisasi mengenal pasti jurang kemahiran dan merancang program latihan yang berkesan.
                </p>
                
                <div className="bg-muted/50 rounded-lg p-3 mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="size-2 bg-primary rounded-full"></div>
                    <span className="font-medium text-xs">Versi 2.0</span>
                  </div>
                  <p className="text-[11px]">
                    Dilengkapi dengan antaramuka mudah alih yang dioptimumkan untuk kemudahan penggunaan.
                  </p>
                </div>

                <div className="space-y-1 mt-3">
                  <p className="font-medium text-xs text-foreground">Ciri-ciri utama:</p>
                  <ul className="text-[11px] space-y-0.5 ml-2">
                    <li>• Penilaian kendiri & atasan</li>
                    <li>• Pelan pembangunan individu (IDP)</li>
                    <li>• Pengurusan latihan</li>
                    <li>• Analisis jurang kemahiran</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Desktop: Show normal navigation menu */
          <NavMain items={navMainItems} />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
