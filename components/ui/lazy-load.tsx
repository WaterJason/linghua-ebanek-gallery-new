"use client"

import { ReactNode, useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface LazyLoadProps {
  children: ReactNode
  className?: string
  placeholder?: ReactNode
  threshold?: number
  rootMargin?: string
  delay?: number
  once?: boolean
}

/**
 * 懒加载组件
 * 
 * 当组件进入视口时才加载内容，优化页面加载性能
 */
export function LazyLoad({
  children,
  className,
  placeholder,
  threshold = 0.1,
  rootMargin = "0px",
  delay = 0,
  once = true,
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const currentRef = ref.current
    
    if (!currentRef) return
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // 如果组件进入视口
          if (delay > 0) {
            // 如果设置了延迟，等待指定时间后再显示
            setTimeout(() => {
              setIsVisible(true)
              setHasLoaded(true)
            }, delay)
          } else {
            setIsVisible(true)
            setHasLoaded(true)
          }
          
          // 如果只需要加载一次，取消观察
          if (once) {
            observer.unobserve(currentRef)
          }
        } else if (!once) {
          // 如果不是只加载一次，且组件离开视口，隐藏组件
          setIsVisible(false)
        }
      },
      {
        threshold,
        rootMargin,
      }
    )
    
    observer.observe(currentRef)
    
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [threshold, rootMargin, delay, once])
  
  return (
    <div
      ref={ref}
      className={cn(
        "transition-opacity duration-300",
        {
          "opacity-0": !isVisible,
          "opacity-100": isVisible,
        },
        className
      )}
    >
      {hasLoaded ? children : placeholder || <div className="animate-pulse bg-muted h-32 rounded-md" />}
    </div>
  )
}
