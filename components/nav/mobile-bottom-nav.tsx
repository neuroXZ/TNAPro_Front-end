"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import Image from "next/image"
import {
  IconDashboard,
  IconClipboardCheck,
  IconUserCheck,
  IconSchool,
  IconFileText,
  IconCertificate,
  IconUser,
  IconChevronUp,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/providers/auth-provider"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { useSettings } from "@/hooks/use-settings"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface MobileBottomNavProps {
  className?: string
}

export function MobileBottomNav({ className }: MobileBottomNavProps) {
  const t = useTranslations('MobileBottomNav')
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useIsMobile()
  const { user } = useAuth()
  const { flags: featureFlags } = useFeatureFlags()
  const { settings } = useSettings()

  const navItems = React.useMemo(() => {
    const assessmentDropdownItems = [
      ...(featureFlags.superiorOnlyAssessment ? [] : [{
        title: t('selfAssessment'),
        url: "/staff/assessments",
        icon: IconClipboardCheck,
      }]),
      {
        title: t('superiorAssessment'),
        url: "/staff/superior-assessments",
        icon: IconUserCheck,
      },
    ]

    return [
      {
        title: t('dashboard'),
        url: "/staff/dashboard",
        icon: IconDashboard,
      },
      {
        title: t('assessment'),
        url: assessmentDropdownItems.length > 1 ? "/staff/assessments" : assessmentDropdownItems[0].url,
        icon: IconClipboardCheck,
        hasDropdown: assessmentDropdownItems.length > 1,
        dropdownItems: assessmentDropdownItems,
      },
      {
        title: t('training'),
        url: "/staff/training",
        icon: IconSchool,
      },
      ...(settings.hideIdpFromStaff ? [] : [{
        title: t('idp'),
        url: "/staff/idp",
        icon: IconFileText,
      }]),
      {
        title: t('profile'),
        url: "/staff/profile",
        icon: IconCertificate,
      },
    ]
  }, [t, featureFlags.superiorOnlyAssessment, settings.hideIdpFromStaff])

  // Get user avatar image
  const getAvatarImage = () => {
    if (user?.image) return user.image
    if (user?.gender?.toLowerCase() === 'female') return '/female-avatar.svg'
    return '/male-avatar.svg'
  }

  // Don't show on non-mobile or non-staff pages
  if (!isMobile || !pathname.startsWith('/staff')) {
    return null
  }

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t",
      "safe-area-inset-bottom", // For devices with home indicator
      className
    )}>
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.url) || 
            (item.dropdownItems && item.dropdownItems.some(dropItem => pathname.startsWith(dropItem.url)))
          const Icon = item.icon
          const isProfile = item.url === "/staff/profile"
          const hasDropdown = item.hasDropdown
          
          if (hasDropdown) {
            return (
              <DropdownMenu key={item.url}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 rounded-md transition-colors",
                      "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <div className="relative mb-1">
                      <Icon 
                        className={cn(
                          "size-5",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )} 
                      />
                      <IconChevronUp 
                        className={cn(
                          "size-2 absolute -top-1 -right-1",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )} 
                      />
                    </div>
                    <span className={cn(
                      "text-[10px] font-medium leading-none truncate max-w-full",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}>
                      {item.title}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="center" className="mb-2">
                  {item.dropdownItems?.map((dropItem) => (
                    <DropdownMenuItem 
                      key={dropItem.url}
                      onClick={() => router.push(dropItem.url)}
                      className="flex items-center gap-2 py-2"
                    >
                      <dropItem.icon className="size-4" />
                      <span className="text-sm">{dropItem.title}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          }
          
          return (
            <button
              key={item.url}
              onClick={() => router.push(item.url)}
              className={cn(
                "flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 rounded-md transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {isProfile ? (
                <div className="relative mb-1">
                  <div className={cn(
                    "size-5 rounded-full overflow-hidden border-2 transition-colors",
                    isActive 
                      ? "border-primary" 
                      : "border-muted-foreground"
                  )}>
                    <Image
                      src={getAvatarImage()}
                      alt={t('profile')}
                      width={20}
                      height={20}
                      className="size-full object-cover"
                    />
                  </div>
                </div>
              ) : (
                <Icon 
                  className={cn(
                    "size-5 mb-1",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} 
                />
              )}
              <span className={cn(
                "text-[10px] font-medium leading-none truncate max-w-full",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.title}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}