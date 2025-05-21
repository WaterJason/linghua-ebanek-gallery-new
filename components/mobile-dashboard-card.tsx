"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

interface MobileDashboardCardProps {
  title: string
  description?: string
  icon?: React.ReactNode
  iconColor?: string
  value: string | number
  footer?: React.ReactNode
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
  chart?: React.ReactNode
  className?: string
  collapsible?: boolean
  defaultCollapsed?: boolean
}

export function MobileDashboardCard({
  title,
  description,
  icon,
  iconColor,
  value,
  footer,
  trend,
  chart,
  className,
  collapsible = false,
  defaultCollapsed = true,
}: MobileDashboardCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const isMobile = useIsMobile()
  
  // 在非移动设备上或不可折叠时，始终展开
  const shouldCollapse = isMobile && collapsible
  const isContentVisible = !shouldCollapse || !isCollapsed
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className={cn(
        "flex flex-row items-center justify-between space-y-0 pb-2",
        shouldCollapse && "cursor-pointer"
      )}
      onClick={shouldCollapse ? () => setIsCollapsed(!isCollapsed) : undefined}
      >
        <div className="flex flex-col space-y-1">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {icon && (
              <span className={cn("rounded-md p-1", iconColor)}>
                {icon}
              </span>
            )}
            {title}
          </CardTitle>
          {description && (
            <CardDescription>{description}</CardDescription>
          )}
        </div>
        {shouldCollapse && (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            {isCollapsed ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronUpIcon className="h-4 w-4" />
            )}
          </Button>
        )}
      </CardHeader>
      
      <CardContent className={cn(
        "pb-2 transition-all duration-200",
        !isContentVisible && "h-0 p-0 overflow-hidden"
      )}>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold">{value}</div>
          {trend && (
            <div className={cn(
              "text-xs",
              trend.isPositive ? "text-green-500" : "text-red-500"
            )}>
              {trend.isPositive ? "↑" : "↓"} {trend.value}% {trend.label}
            </div>
          )}
        </div>
        
        {chart && (
          <div className={cn(
            "mt-4 h-[80px]",
            !isContentVisible && "h-0 overflow-hidden"
          )}>
            {chart}
          </div>
        )}
      </CardContent>
      
      {footer && isContentVisible && (
        <CardFooter className="pt-0">
          {footer}
        </CardFooter>
      )}
    </Card>
  )
}
