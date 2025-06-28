// 阶段4操作反馈增强 - 微交互动画组件
// 提供各种微交互动画效果

'use client'

import React, { useRef, useEffect, forwardRef } from 'react'
import { useAnimation } from '@/hooks/use-feedback'
import { MicroAnimationOptions, AnimationConfig } from '@/lib/types/feedback-types'
import { cn } from '@/lib/utils'

interface AnimatedElementProps extends React.HTMLAttributes<HTMLDivElement> {
  animation?: string | AnimationConfig
  trigger?: MicroAnimationOptions['trigger']
  disabled?: boolean
  once?: boolean
  children: React.ReactNode
}

/**
 * 通用动画包装组件
 */
export const AnimatedElement = forwardRef<HTMLDivElement, AnimatedElementProps>(
  ({ 
    animation = 'fade-in', 
    trigger = 'load', 
    disabled = false, 
    once = false,
    children, 
    className,
    ...props 
  }, ref) => {
    const elementRef = useRef<HTMLDivElement>(null)
    const { play, enabled } = useAnimation()
    const hasPlayedRef = useRef(false)

    const combinedRef = (node: HTMLDivElement) => {
      elementRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    }

    const playAnimation = async () => {
      if (!elementRef.current || disabled || !enabled) return
      if (once && hasPlayedRef.current) return

      try {
        await play(elementRef.current, animation)
        hasPlayedRef.current = true
      } catch (error) {
        console.warn('Animation failed:', error)
      }
    }

    useEffect(() => {
      if (trigger === 'load') {
        playAnimation()
      }
    }, [])

    const handleMouseEnter = () => {
      if (trigger === 'hover') playAnimation()
    }

    const handleClick = () => {
      if (trigger === 'click') playAnimation()
    }

    const handleFocus = () => {
      if (trigger === 'focus') playAnimation()
    }

    return (
      <div
        ref={combinedRef}
        className={className}
        onMouseEnter={handleMouseEnter}
        onClick={handleClick}
        onFocus={handleFocus}
        {...props}
      >
        {children}
      </div>
    )
  }
)

AnimatedElement.displayName = 'AnimatedElement'

/**
 * 动画按钮组件
 */
interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  loading?: boolean
  children: React.ReactNode
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, variant = 'default', size = 'default', loading, children, ...props }, ref) => {
    const buttonRef = useRef<HTMLButtonElement>(null)
    const { play } = useAnimation()

    const combinedRef = (node: HTMLButtonElement) => {
      buttonRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    }

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (buttonRef.current) {
        await play(buttonRef.current, 'button-click')
      }
      props.onClick?.(e)
    }

    const handleMouseEnter = async () => {
      if (buttonRef.current && !props.disabled) {
        await play(buttonRef.current, 'button-hover')
      }
    }

    const baseClasses = cn(
      'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      {
        'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
        'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
        'border border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'outline',
        'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
        'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
        'text-primary underline-offset-4 hover:underline': variant === 'link',
      },
      {
        'h-10 px-4 py-2': size === 'default',
        'h-9 rounded-md px-3': size === 'sm',
        'h-11 rounded-md px-8': size === 'lg',
        'h-10 w-10': size === 'icon',
      },
      className
    )

    return (
      <button
        ref={combinedRef}
        className={baseClasses}
        onMouseEnter={handleMouseEnter}
        onClick={handleClick}
        disabled={loading}
        {...props}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
        ) : (
          children
        )}
      </button>
    )
  }
)

AnimatedButton.displayName = 'AnimatedButton'

/**
 * 数字变化动画组件
 */
interface AnimatedNumberProps {
  value: number
  duration?: number
  format?: (value: number) => string
  className?: string
}

export function AnimatedNumber({ 
  value, 
  duration = 1000, 
  format = (n) => n.toString(),
  className 
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = React.useState(value)
  const elementRef = useRef<HTMLSpanElement>(null)
  const { play } = useAnimation()

  useEffect(() => {
    const startValue = displayValue
    const endValue = value
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // 使用缓动函数
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentValue = startValue + (endValue - startValue) * easeOutQuart
      
      setDisplayValue(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setDisplayValue(endValue)
        // 播放完成动画
        if (elementRef.current) {
          play(elementRef.current, 'number-change')
        }
      }
    }

    if (startValue !== endValue) {
      animate()
    }
  }, [value, duration, displayValue, play])

  return (
    <span ref={elementRef} className={className}>
      {format(displayValue)}
    </span>
  )
}

/**
 * 淡入淡出组件
 */
interface FadeTransitionProps {
  show: boolean
  children: React.ReactNode
  className?: string
  duration?: number
}

export function FadeTransition({ 
  show, 
  children, 
  className, 
  duration = 300 
}: FadeTransitionProps) {
  const [shouldRender, setShouldRender] = React.useState(show)
  const elementRef = useRef<HTMLDivElement>(null)
  const { play } = useAnimation()

  useEffect(() => {
    if (show) {
      setShouldRender(true)
      if (elementRef.current) {
        play(elementRef.current, {
          name: 'fade-in',
          duration,
          easing: 'ease-out'
        })
      }
    } else {
      if (elementRef.current) {
        play(elementRef.current, {
          name: 'fade-out',
          duration,
          easing: 'ease-in'
        }).then(() => {
          setShouldRender(false)
        })
      } else {
        setShouldRender(false)
      }
    }
  }, [show, duration, play])

  if (!shouldRender) return null

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  )
}

/**
 * 滑动过渡组件
 */
interface SlideTransitionProps {
  show: boolean
  direction?: 'up' | 'down' | 'left' | 'right'
  children: React.ReactNode
  className?: string
  duration?: number
}

export function SlideTransition({ 
  show, 
  direction = 'up', 
  children, 
  className, 
  duration = 400 
}: SlideTransitionProps) {
  const [shouldRender, setShouldRender] = React.useState(show)
  const elementRef = useRef<HTMLDivElement>(null)
  const { play } = useAnimation()

  useEffect(() => {
    if (show) {
      setShouldRender(true)
      if (elementRef.current) {
        play(elementRef.current, {
          name: `slide-in-${direction}`,
          duration,
          easing: 'ease-out'
        })
      }
    } else {
      if (elementRef.current) {
        play(elementRef.current, {
          name: `slide-out-${direction}`,
          duration,
          easing: 'ease-in'
        }).then(() => {
          setShouldRender(false)
        })
      } else {
        setShouldRender(false)
      }
    }
  }, [show, direction, duration, play])

  if (!shouldRender) return null

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  )
}

/**
 * 脉冲动画组件
 */
interface PulseAnimationProps {
  active?: boolean
  children: React.ReactNode
  className?: string
  intensity?: 'low' | 'medium' | 'high'
}

export function PulseAnimation({ 
  active = true, 
  children, 
  className, 
  intensity = 'medium' 
}: PulseAnimationProps) {
  const intensityClasses = {
    low: 'animate-pulse',
    medium: 'animate-pulse',
    high: 'animate-pulse'
  }

  return (
    <div className={cn(active && intensityClasses[intensity], className)}>
      {children}
    </div>
  )
}

/**
 * 加载骨架屏组件
 */
interface SkeletonProps {
  className?: string
  lines?: number
  avatar?: boolean
}

export function Skeleton({ className, lines = 1, avatar = false }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse', className)}>
      {avatar && (
        <div className="rounded-full bg-muted h-10 w-10 mb-2" />
      )}
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 bg-muted rounded',
            i < lines - 1 && 'mb-2',
            i === lines - 1 && lines > 1 && 'w-3/4' // 最后一行稍短
          )}
        />
      ))}
    </div>
  )
}

/**
 * 弹跳加载动画
 */
export function BounceLoader({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-1 h-1',
    default: 'w-2 h-2',
    lg: 'w-3 h-3'
  }

  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'bg-current rounded-full animate-bounce',
            sizeClasses[size]
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </div>
  )
}

/**
 * 旋转加载动画
 */
export function SpinLoader({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        sizeClasses[size]
      )}
    />
  )
}
