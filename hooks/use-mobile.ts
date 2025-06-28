"use client"

import { useState, useEffect } from "react"

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // 检查是否在浏览器环境中
    if (typeof window === 'undefined') {
      return
    }

    // 初始检测
    checkIfMobile()

    // 监听窗口大小变化
    window.addEventListener("resize", checkIfMobile)

    // 清理函数
    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  function checkIfMobile() {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < 768)
    }
  }

  return isMobile
}
