"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

interface MobileGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  cols?: {
    mobile?: 1 | 2 | 3
    tablet?: 1 | 2 | 3 | 4
    desktop?: 1 | 2 | 3 | 4 | 5 | 6
  }
  gap?: "sm" | "md" | "lg"
}

export function MobileGrid({ 
  children, 
  className, 
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = "md",
  ...props 
}: MobileGridProps) {
  const isMobile = useIsMobile()
  
  const getGridCols = () => {
    if (isMobile) {
      return `grid-cols-${cols.mobile || 1}`
    }
    
    return cn(
      `md:grid-cols-${cols.tablet || 2}`,
      `lg:grid-cols-${cols.desktop || 3}`
    )
  }
  
  const getGap = () => {
    switch (gap) {
      case "sm":
        return isMobile ? "mobile-gap-2" : "gap-2"
      case "lg":
        return isMobile ? "mobile-gap-3" : "gap-6"
      default:
        return isMobile ? "mobile-gap-3" : "gap-4"
    }
  }
  
  return (
    <div 
      className={cn(
        "grid",
        getGridCols(),
        getGap(),
        className
      )} 
      {...props}
    >
      {children}
    </div>
  )
}

interface MobileContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl" | "full"
}

export function MobileContainer({ 
  children, 
  className, 
  size = "full",
  ...props 
}: MobileContainerProps) {
  const isMobile = useIsMobile()
  
  const getContainerSize = () => {
    if (isMobile) {
      return "w-full px-3"
    }
    
    switch (size) {
      case "sm":
        return "max-w-sm mx-auto"
      case "md":
        return "max-w-md mx-auto"
      case "lg":
        return "max-w-lg mx-auto"
      case "xl":
        return "max-w-xl mx-auto"
      default:
        return "w-full"
    }
  }
  
  return (
    <div 
      className={cn(
        getContainerSize(),
        className
      )} 
      {...props}
    >
      {children}
    </div>
  )
}