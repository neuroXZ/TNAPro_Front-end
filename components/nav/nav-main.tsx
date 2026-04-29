"use client"

import { IconCirclePlusFilled, IconMessages, IconChevronRight, IconBooks, type Icon } from "@tabler/icons-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

type NavItem = {
  title: string
  url: string
  icon?: Icon
  items?: NavItem[]
}

export function NavMain({
  items,
}: {
  items: NavItem[]
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)

  const normalizedPath = useMemo(() => {
    if (!pathname) return ""
    return pathname.replace(/^\/(en|ms)(?=\/|$)/, "")
  }, [pathname])

  const isRouteActive = (url: string) => {
    if (!url || url === "#") return false
    const targetPath = url.replace(/^\/+/, "")
    const currentPath = normalizedPath.replace(/^\/+/, "")

    return (
      currentPath === targetPath ||
      currentPath.startsWith(`${targetPath}/`)
    )
  }

  const isRouteExactActive = (url: string) => {
    if (!url || url === "#") return false
    const targetPath = url.replace(/^\/+/, "")
    const currentPath = normalizedPath.replace(/^\/+/, "")

    return currentPath === targetPath
  }

  const isAnyChildActive = (item: NavItem): boolean => {
    return !!item.items?.some(
      (child) => isRouteActive(child.url) || isAnyChildActive(child)
    )
  }

  const renderItems = (navItems: NavItem[], isSubmenu = false) =>
    navItems.map((item) => {
      const childActive = isAnyChildActive(item)
      const itemActive = isRouteExactActive(item.url)

      if (item.items && item.items.length > 0) {
        return (
          <Collapsible key={item.title} asChild defaultOpen={childActive}>
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                {isSubmenu ? (
                  <SidebarMenuSubButton isActive={itemActive}>
                    <span>{item.title}</span>
                    <IconChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuSubButton>
                ) : (
                  <SidebarMenuButton tooltip={item.title} isActive={itemActive}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <IconChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {renderItems(item.items, true)}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        )
      }

      return isSubmenu ? (
        <SidebarMenuSubItem key={item.title}>
          <SidebarMenuSubButton asChild isActive={itemActive}>
            <Link href={item.url}>
              <span>{item.title}</span>
            </Link>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      ) : (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild tooltip={item.title} isActive={itemActive}>
            <Link href={item.url}>
              {item.icon && <item.icon />}
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )
    })

  const handleDocumentationClick = () => {
    // Navigate to appropriate documentation page based on user role
    console.log('Current userRole:', userRole) // Debug: check what role is detected
    if (userRole === 'admin' || userRole === 'Admin' || userRole === 'ADMIN') {
      console.log('Navigating to admin documentation') // Debug
      router.push('/admin/documentation')
    } else {
      console.log('Navigating to staff documentation') // Debug
      router.push('/staff/documentation')
    }
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Documentation"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear cursor-pointer"
              onClick={handleDocumentationClick}
            >
              <IconBooks />
              <span>Documentation</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
              onClick={() => router.push('/customer-service')}
            >
              <IconMessages />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>{renderItems(items)}</SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
