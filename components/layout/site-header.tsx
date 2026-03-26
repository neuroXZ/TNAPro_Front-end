'use client'

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { IconUser, IconChevronDown, IconMoon, IconSun, IconLanguage } from "@tabler/icons-react"
import { useRouter as useIntlRouter, usePathname as useIntlPathname } from '@/navigation'
import { useLocale } from 'next-intl'
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function SiteHeader() {
  const pathname = usePathname()
  const [user, setUser] = useState<{ name: string; userType: string } | null>(null)
  const isMobile = useIsMobile()
  const { theme, setTheme } = useTheme()
  const locale = useLocale()
  const intlRouter = useIntlRouter()
  const intlPathname = useIntlPathname()

  const switchLocale = (newLocale: string) => {
    intlRouter.replace(intlPathname, { locale: newLocale })
  }
  
  useEffect(() => {
    // Get user data from localStorage
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
      } catch (error) {
        console.error('Failed to parse user data:', error)
      }
    }
  }, [])
  
  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean)
    const breadcrumbs = []
    
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i]
      const href = '/' + paths.slice(0, i + 1).join('/')
      const label = path.charAt(0).toUpperCase() + path.slice(1)
      
      breadcrumbs.push({
        label,
        href,
        isLast: i === paths.length - 1
      })
    }
    
    return breadcrumbs
  }
  
  const breadcrumbs = generateBreadcrumbs()

  // Get current page title for mobile
  const getCurrentPageTitle = () => {
    const paths = pathname.split('/').filter(Boolean)
    if (paths.length === 0) return "Home"
    const lastPath = paths[paths.length - 1]
    return lastPath.charAt(0).toUpperCase() + lastPath.slice(1)
  }

  return (
    <header className="flex h-[var(--header-height)] shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-[var(--header-height)]">
      <div className="flex w-full items-center gap-1 px-3 md:gap-2 md:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        
        {/* Mobile: Show current page title only */}
        {isMobile ? (
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-medium truncate">{getCurrentPageTitle()}</h1>
          </div>
        ) : (
          /* Desktop: Show full breadcrumbs */
          <Breadcrumb className="flex-1 min-w-0">
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center gap-2">
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {crumb.isLast ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}
        
        {/* User menu */}
        <div className="ml-auto flex items-center gap-2">
          {/* Language switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 px-2">
                <IconLanguage className="size-4" />
                <span className="hidden sm:inline-block text-xs font-medium uppercase">{locale}</span>
                <IconChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => switchLocale('en')}
                className={locale === 'en' ? 'font-semibold text-primary' : ''}
              >
                🇬🇧 English
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => switchLocale('ms')}
                className={locale === 'ms' ? 'font-semibold text-primary' : ''}
              >
                🇲🇾 Bahasa Melayu
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dark mode toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="gap-2"
          >
            <IconSun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <IconMoon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          
          {user && (
            isMobile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1 px-2">
                    <IconUser className="size-4" />
                    <IconChevronDown className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.userType === 'admin' ? 'Admin' : 'Staff'}</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="sm" className="gap-2">
                <IconUser className="size-4" />
                <span className="hidden sm:inline-flex">
                  {user.name || (user.userType === 'admin' ? 'Admin' : 'Staff')}
                </span>
              </Button>
            )
          )}
        </div>
      </div>
    </header>
  )
}
