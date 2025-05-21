"use client"

import { useState, useEffect, useCallback } from "react"

// 断点定义
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
}

// 设备类型
export type DeviceType = "mobile" | "tablet" | "desktop"

// 响应式钩子返回类型
export interface ResponsiveState {
  width: number
  height: number
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  deviceType: DeviceType
  isPortrait: boolean
  isLandscape: boolean
  breakpoint: keyof typeof breakpoints | null
  isSmaller: (breakpoint: keyof typeof breakpoints) => boolean
  isLarger: (breakpoint: keyof typeof breakpoints) => boolean
  isBetween: (min: keyof typeof breakpoints, max: keyof typeof breakpoints) => boolean
}

/**
 * 响应式布局钩子
 * 提供当前视口尺寸、设备类型和方向等信息
 */
export function useResponsive(): ResponsiveState {
  // 初始状态
  const [state, setState] = useState<ResponsiveState>({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    deviceType: "desktop",
    isPortrait: true,
    isLandscape: false,
    breakpoint: null,
    isSmaller: () => false,
    isLarger: () => false,
    isBetween: () => false,
  })

  // 获取当前断点
  const getBreakpoint = useCallback((width: number): keyof typeof breakpoints | null => {
    if (width < breakpoints.sm) return null
    if (width < breakpoints.md) return "sm"
    if (width < breakpoints.lg) return "md"
    if (width < breakpoints.xl) return "lg"
    if (width < breakpoints["2xl"]) return "xl"
    return "2xl"
  }, [])

  // 获取设备类型
  const getDeviceType = useCallback((width: number): DeviceType => {
    if (width < breakpoints.md) return "mobile"
    if (width < breakpoints.lg) return "tablet"
    return "desktop"
  }, [])

  // 检查是否小于指定断点
  const isSmaller = useCallback(
    (breakpoint: keyof typeof breakpoints): boolean => {
      return state.width < breakpoints[breakpoint]
    },
    [state.width]
  )

  // 检查是否大于指定断点
  const isLarger = useCallback(
    (breakpoint: keyof typeof breakpoints): boolean => {
      return state.width >= breakpoints[breakpoint]
    },
    [state.width]
  )

  // 检查是否在两个断点之间
  const isBetween = useCallback(
    (min: keyof typeof breakpoints, max: keyof typeof breakpoints): boolean => {
      return state.width >= breakpoints[min] && state.width < breakpoints[max]
    },
    [state.width]
  )

  // 更新状态
  const updateState = useCallback(() => {
    if (typeof window === "undefined") return

    const width = window.innerWidth
    const height = window.innerHeight
    const deviceType = getDeviceType(width)
    const breakpoint = getBreakpoint(width)
    const isPortrait = height > width

    setState({
      width,
      height,
      isMobile: deviceType === "mobile",
      isTablet: deviceType === "tablet",
      isDesktop: deviceType === "desktop",
      deviceType,
      isPortrait,
      isLandscape: !isPortrait,
      breakpoint,
      isSmaller,
      isLarger,
      isBetween,
    })
  }, [getBreakpoint, getDeviceType, isBetween, isLarger, isSmaller])

  // 监听窗口大小变化
  useEffect(() => {
    if (typeof window === "undefined") return

    // 初始更新
    updateState()

    // 添加调整大小事件监听器
    const handleResize = () => {
      updateState()
    }

    // 添加设备方向变化事件监听器
    const handleOrientationChange = () => {
      updateState()
    }

    window.addEventListener("resize", handleResize)
    window.addEventListener("orientationchange", handleOrientationChange)

    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("orientationchange", handleOrientationChange)
    }
  }, [updateState])

  return state
}

/**
 * 移动设备检测钩子
 * 简化版的响应式钩子，只返回是否为移动设备
 */
export function useIsMobile(): boolean {
  const { isMobile } = useResponsive()
  return isMobile
}

/**
 * 平板设备检测钩子
 * 简化版的响应式钩子，只返回是否为平板设备
 */
export function useIsTablet(): boolean {
  const { isTablet } = useResponsive()
  return isTablet
}

/**
 * 桌面设备检测钩子
 * 简化版的响应式钩子，只返回是否为桌面设备
 */
export function useIsDesktop(): boolean {
  const { isDesktop } = useResponsive()
  return isDesktop
}

/**
 * 设备方向检测钩子
 * 返回当前设备是否为纵向
 */
export function useIsPortrait(): boolean {
  const { isPortrait } = useResponsive()
  return isPortrait
}

/**
 * 断点检测钩子
 * 检查当前视口是否小于指定断点
 */
export function useBreakpointSmaller(breakpoint: keyof typeof breakpoints): boolean {
  const { isSmaller } = useResponsive()
  return isSmaller(breakpoint)
}

/**
 * 断点检测钩子
 * 检查当前视口是否大于指定断点
 */
export function useBreakpointLarger(breakpoint: keyof typeof breakpoints): boolean {
  const { isLarger } = useResponsive()
  return isLarger(breakpoint)
}
