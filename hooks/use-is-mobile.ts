"use client"

import { useState, useEffect } from "react"

/**
 * 检测当前设备是否为移动设备的钩子
 * @param breakpoint 断点宽度，默认为768px
 * @returns 是否为移动设备
 */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // 初始检查
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }
    
    // 首次运行
    checkIsMobile()
    
    // 监听窗口大小变化
    window.addEventListener("resize", checkIsMobile)
    
    // 清理函数
    return () => {
      window.removeEventListener("resize", checkIsMobile)
    }
  }, [breakpoint])

  return isMobile
}
