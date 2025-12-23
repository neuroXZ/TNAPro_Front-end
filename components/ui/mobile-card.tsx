"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

interface MobileCardProps extends React.ComponentProps<typeof Card> {
  children: React.ReactNode
}

interface MobileCardHeaderProps extends React.ComponentProps<typeof CardHeader> {
  children: React.ReactNode
}

interface MobileCardTitleProps extends React.ComponentProps<typeof CardTitle> {
  children: React.ReactNode
}

interface MobileCardDescriptionProps extends React.ComponentProps<typeof CardDescription> {
  children: React.ReactNode
}

interface MobileCardContentProps extends React.ComponentProps<typeof CardContent> {
  children: React.ReactNode
}

export function MobileCard({ className, children, ...props }: MobileCardProps) {
  const isMobile = useIsMobile()
  
  return (
    <Card 
      className={cn(
        isMobile && "mobile-card",
        className
      )} 
      {...props}
    >
      {children}
    </Card>
  )
}

export function MobileCardHeader({ className, children, ...props }: MobileCardHeaderProps) {
  const isMobile = useIsMobile()
  
  return (
    <CardHeader 
      className={cn(
        isMobile && "mobile-card-header",
        className
      )} 
      {...props}
    >
      {children}
    </CardHeader>
  )
}

export function MobileCardTitle({ className, children, ...props }: MobileCardTitleProps) {
  const isMobile = useIsMobile()
  
  return (
    <CardTitle 
      className={cn(
        isMobile && "mobile-text-sm font-medium",
        className
      )} 
      {...props}
    >
      {children}
    </CardTitle>
  )
}

export function MobileCardDescription({ className, children, ...props }: MobileCardDescriptionProps) {
  const isMobile = useIsMobile()
  
  return (
    <CardDescription 
      className={cn(
        isMobile && "mobile-text-xs",
        className
      )} 
      {...props}
    >
      {children}
    </CardDescription>
  )
}

export function MobileCardContent({ className, children, ...props }: MobileCardContentProps) {
  const isMobile = useIsMobile()
  
  return (
    <CardContent 
      className={cn(
        isMobile && "mobile-card-content",
        className
      )} 
      {...props}
    >
      {children}
    </CardContent>
  )
}