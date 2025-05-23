"use client"

import { ReactNode, useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface ResponsiveContainerProps {
  children: ReactNode
  className?: string
  mobileBreakpoint?: number
  tabletBreakpoint?: number
  desktopBreakpoint?: number
}

/**
 * 响应式容器组件
 * 
 * 根据屏幕尺寸自动调整布局
 */
export function ResponsiveContainer({
  children,
  className,
  mobileBreakpoint = 640,
  tabletBreakpoint = 768,
  desktopBreakpoint = 1024,
}: ResponsiveContainerProps) {
  const [screenSize, setScreenSize] = useState<"mobile" | "tablet" | "desktop" | "large">("desktop")
  
  useEffect(() => {
    // 初始化屏幕尺寸
    updateScreenSize()
    
    // 监听窗口大小变化
    const handleResize = () => {
      updateScreenSize()
    }
    
    window.addEventListener("resize", handleResize)
    
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [mobileBreakpoint, tabletBreakpoint, desktopBreakpoint])
  
  // 更新屏幕尺寸
  const updateScreenSize = () => {
    const width = window.innerWidth
    
    if (width < mobileBreakpoint) {
      setScreenSize("mobile")
    } else if (width < tabletBreakpoint) {
      setScreenSize("tablet")
    } else if (width < desktopBreakpoint) {
      setScreenSize("desktop")
    } else {
      setScreenSize("large")
    }
  }
  
  return (
    <div 
      className={cn(
        "w-full transition-all duration-200",
        {
          "px-4 py-2": screenSize === "mobile",
          "px-6 py-3": screenSize === "tablet",
          "px-8 py-4": screenSize === "desktop",
          "px-10 py-5": screenSize === "large",
        },
        className
      )}
      data-screen-size={screenSize}
    >
      {children}
    </div>
  )
}
