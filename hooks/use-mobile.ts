"use client"

import { useState, useEffect } from "react"

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
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
    setIsMobile(window.innerWidth < 768)
  }

  return isMobile
}
