"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { HelpCircle, Info, AlertTriangle, CheckCircle } from "lucide-react"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

// 智能提示组件类型
type SmartTooltipType = 'help' | 'info' | 'warning' | 'success'

interface SmartTooltipProps {
  children: React.ReactNode
  content: string
  type?: SmartTooltipType
  title?: string
  showIcon?: boolean
  delay?: number
  side?: "top" | "right" | "bottom" | "left"
  className?: string
}

// 智能提示组件
const SmartTooltip = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  SmartTooltipProps
>(({
  children,
  content,
  type = 'info',
  title,
  showIcon = true,
  delay = 300,
  side = "top",
  className,
  ...props
}, ref) => {
  const getIcon = () => {
    switch (type) {
      case 'help':
        return <HelpCircle className="w-4 h-4 text-blue-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return <Info className="w-4 h-4 text-blue-500" />
    }
  }

  const getTypeStyles = () => {
    switch (type) {
      case 'help':
        return "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100"
      case 'warning':
        return "border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100"
      case 'success':
        return "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100"
      default:
        return "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100"
    }
  }

  return (
    <Tooltip delayDuration={delay}>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent
        ref={ref}
        side={side}
        className={cn(
          "max-w-xs p-3 text-sm",
          getTypeStyles(),
          className
        )}
        {...props}
      >
        <div className="space-y-2">
          {title && (
            <div className="flex items-center gap-2 font-medium">
              {showIcon && getIcon()}
              {title}
            </div>
          )}
          <div className={cn(
            "text-sm",
            title ? "text-muted-foreground" : "flex items-center gap-2"
          )}>
            {!title && showIcon && getIcon()}
            {content}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
})
SmartTooltip.displayName = "SmartTooltip"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, SmartTooltip }
