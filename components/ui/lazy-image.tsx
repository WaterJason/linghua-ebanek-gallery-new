"use client"

import { useState, useEffect, useRef } from "react"
import { ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackIcon?: React.ReactNode
  loadingPlaceholder?: React.ReactNode
  containerClassName?: string
}

export function LazyImage({
  src,
  alt = "",
  className = "",
  containerClassName = "",
  fallbackIcon = <ImageIcon className="h-6 w-6 text-gray-400" />,
  loadingPlaceholder = <div className="animate-pulse bg-gray-200 w-full h-full" />,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // 使用 IntersectionObserver 检测图片是否在视口中
  useEffect(() => {
    if (!imgRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: "200px", // 提前200px加载
        threshold: 0.01,
      }
    )

    observer.observe(imgRef.current)

    return () => {
      observer.disconnect()
    }
  }, [])

  // 处理图片加载完成
  const handleLoad = () => {
    setIsLoaded(true)
  }

  // 处理图片加载错误
  const handleError = () => {
    setIsError(true)
  }

  return (
    <div
      ref={imgRef}
      className={cn(
        "relative overflow-hidden flex items-center justify-center bg-gray-100",
        containerClassName
      )}
    >
      {isInView && !isError ? (
        <>
          {!isLoaded && loadingPlaceholder}
          <img
            src={src}
            alt={alt}
            className={cn(
              "transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0",
              className
            )}
            onLoad={handleLoad}
            onError={handleError}
            {...props}
          />
        </>
      ) : isError ? (
        <div className="flex items-center justify-center w-full h-full">
          {fallbackIcon}
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-full">
          {loadingPlaceholder}
        </div>
      )}
    </div>
  )
}
