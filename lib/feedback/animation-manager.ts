// 阶段4操作反馈增强 - 微交互动画管理器
// 提供丰富的微交互动画，提升用户体验

import {
  AnimationConfig,
  MicroAnimationOptions,
  AnimationPreset,
  AnimationEvent
} from '@/lib/types/feedback-types'

export class AnimationManager {
  private presets: Map<string, AnimationPreset>
  private activeAnimations: Map<HTMLElement, Animation>
  private subscribers: Set<(event: AnimationEvent) => void>
  private globalEnabled: boolean
  private reducedMotion: boolean

  constructor() {
    this.presets = new Map()
    this.activeAnimations = new Map()
    this.subscribers = new Set()
    this.globalEnabled = true
    this.reducedMotion = this.checkReducedMotion()

    this.initializePresets()

    // 只在客户端设置监听器
    if (typeof window !== 'undefined') {
      this.setupReducedMotionListener()
    }
  }

  /**
   * 播放动画
   */
  async playAnimation(
    element: HTMLElement,
    animation: string | AnimationConfig
  ): Promise<void> {
    if (!this.globalEnabled || this.reducedMotion) {
      return Promise.resolve()
    }

    // 停止当前动画
    this.stopAnimation(element)

    let config: AnimationConfig
    if (typeof animation === 'string') {
      const preset = this.presets.get(animation)
      if (!preset) {
        console.warn(`Animation preset '${animation}' not found`)
        return
      }
      config = preset.config
    } else {
      config = animation
    }

    try {
      const webAnimation = element.animate(
        this.getKeyframes(config.name),
        {
          duration: config.duration,
          easing: config.easing,
          delay: config.delay || 0,
          iterations: config.iterations || 1,
          direction: config.direction || 'normal',
          fill: config.fillMode || 'none'
        }
      )

      this.activeAnimations.set(element, webAnimation)

      this.notifySubscribers({
        type: 'start',
        element,
        animation: config.name,
        timestamp: Date.now()
      })

      await webAnimation.finished

      this.activeAnimations.delete(element)

      this.notifySubscribers({
        type: 'end',
        element,
        animation: config.name,
        timestamp: Date.now()
      })

    } catch (error) {
      console.error('Animation error:', error)
      this.activeAnimations.delete(element)
    }
  }

  /**
   * 停止动画
   */
  stopAnimation(element: HTMLElement): void {
    const animation = this.activeAnimations.get(element)
    if (animation) {
      animation.cancel()
      this.activeAnimations.delete(element)

      this.notifySubscribers({
        type: 'cancel',
        element,
        animation: 'unknown',
        timestamp: Date.now()
      })
    }
  }

  /**
   * 检查动画是否正在播放
   */
  isPlaying(element: HTMLElement): boolean {
    return this.activeAnimations.has(element)
  }

  /**
   * 注册动画预设
   */
  registerPreset(preset: AnimationPreset): void {
    this.presets.set(preset.name, preset)
  }

  /**
   * 获取所有预设
   */
  getPresets(): AnimationPreset[] {
    return Array.from(this.presets.values())
  }

  /**
   * 获取预设分类
   */
  getPresetsByCategory(category: string): AnimationPreset[] {
    return Array.from(this.presets.values())
      .filter(preset => preset.category === category)
  }

  /**
   * 设置全局动画开关
   */
  setGlobalAnimationEnabled(enabled: boolean): void {
    this.globalEnabled = enabled

    if (!enabled) {
      // 停止所有正在播放的动画
      this.activeAnimations.forEach((animation, element) => {
        this.stopAnimation(element)
      })
    }
  }

  /**
   * 获取全局动画状态
   */
  isGlobalAnimationEnabled(): boolean {
    return this.globalEnabled && !this.reducedMotion
  }

  /**
   * 订阅动画事件
   */
  subscribe(callback: (event: AnimationEvent) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  /**
   * 便捷方法：按钮点击动画
   */
  animateButtonClick(button: HTMLElement): Promise<void> {
    return this.playAnimation(button, 'button-click')
  }

  /**
   * 便捷方法：成功反馈动画
   */
  animateSuccess(element: HTMLElement): Promise<void> {
    return this.playAnimation(element, 'success-pulse')
  }

  /**
   * 便捷方法：错误反馈动画
   */
  animateError(element: HTMLElement): Promise<void> {
    return this.playAnimation(element, 'error-shake')
  }

  /**
   * 便捷方法：加载动画
   */
  animateLoading(element: HTMLElement): Promise<void> {
    return this.playAnimation(element, 'loading-spin')
  }

  /**
   * 便捷方法：淡入动画
   */
  animateFadeIn(element: HTMLElement): Promise<void> {
    return this.playAnimation(element, 'fade-in')
  }

  /**
   * 便捷方法：淡出动画
   */
  animateFadeOut(element: HTMLElement): Promise<void> {
    return this.playAnimation(element, 'fade-out')
  }

  /**
   * 便捷方法：滑入动画
   */
  animateSlideIn(element: HTMLElement, direction: 'up' | 'down' | 'left' | 'right' = 'up'): Promise<void> {
    return this.playAnimation(element, `slide-in-${direction}`)
  }

  /**
   * 便捷方法：缩放动画
   */
  animateScale(element: HTMLElement, scale: number = 1.1): Promise<void> {
    return this.playAnimation(element, {
      name: 'scale',
      duration: 200,
      easing: 'ease-out'
    })
  }

  /**
   * 初始化预设动画
   */
  private initializePresets(): void {
    const presets: AnimationPreset[] = [
      // 按钮动画
      {
        name: 'button-click',
        config: { name: 'scale-down', duration: 150, easing: 'ease-out' },
        description: '按钮点击缩放效果',
        category: 'button'
      },
      {
        name: 'button-hover',
        config: { name: 'scale-up', duration: 200, easing: 'ease-out' },
        description: '按钮悬停放大效果',
        category: 'button'
      },

      // 反馈动画
      {
        name: 'success-pulse',
        config: { name: 'pulse-green', duration: 600, easing: 'ease-in-out' },
        description: '成功脉冲效果',
        category: 'feedback'
      },
      {
        name: 'error-shake',
        config: { name: 'shake', duration: 500, easing: 'ease-in-out' },
        description: '错误摇摆效果',
        category: 'feedback'
      },

      // 加载动画
      {
        name: 'loading-spin',
        config: { name: 'spin', duration: 1000, easing: 'linear', iterations: Infinity },
        description: '旋转加载效果',
        category: 'loading'
      },
      {
        name: 'loading-pulse',
        config: { name: 'pulse', duration: 1500, easing: 'ease-in-out', iterations: Infinity },
        description: '脉冲加载效果',
        category: 'loading'
      },

      // 转场动画
      {
        name: 'fade-in',
        config: { name: 'fade-in', duration: 300, easing: 'ease-out' },
        description: '淡入效果',
        category: 'transition'
      },
      {
        name: 'fade-out',
        config: { name: 'fade-out', duration: 300, easing: 'ease-in' },
        description: '淡出效果',
        category: 'transition'
      },
      {
        name: 'slide-in-up',
        config: { name: 'slide-in-up', duration: 400, easing: 'ease-out' },
        description: '从下方滑入',
        category: 'transition'
      },
      {
        name: 'slide-in-down',
        config: { name: 'slide-in-down', duration: 400, easing: 'ease-out' },
        description: '从上方滑入',
        category: 'transition'
      },

      // 数据变化动画
      {
        name: 'number-change',
        config: { name: 'scale-pulse', duration: 400, easing: 'ease-out' },
        description: '数字变化效果',
        category: 'data'
      },
      {
        name: 'chart-update',
        config: { name: 'fade-scale', duration: 500, easing: 'ease-out' },
        description: '图表更新效果',
        category: 'data'
      }
    ]

    presets.forEach(preset => this.registerPreset(preset))
  }

  /**
   * 获取关键帧
   */
  private getKeyframes(animationName: string): Keyframe[] {
    const keyframes: Record<string, Keyframe[]> = {
      'scale-down': [
        { transform: 'scale(1)' },
        { transform: 'scale(0.95)' },
        { transform: 'scale(1)' }
      ],
      'scale-up': [
        { transform: 'scale(1)' },
        { transform: 'scale(1.05)' }
      ],
      'pulse-green': [
        { transform: 'scale(1)', backgroundColor: 'currentColor' },
        { transform: 'scale(1.05)', backgroundColor: '#10b981' },
        { transform: 'scale(1)', backgroundColor: 'currentColor' }
      ],
      'shake': [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(10px)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(10px)' },
        { transform: 'translateX(0)' }
      ],
      'spin': [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(360deg)' }
      ],
      'pulse': [
        { opacity: '1' },
        { opacity: '0.5' },
        { opacity: '1' }
      ],
      'fade-in': [
        { opacity: '0' },
        { opacity: '1' }
      ],
      'fade-out': [
        { opacity: '1' },
        { opacity: '0' }
      ],
      'slide-in-up': [
        { transform: 'translateY(20px)', opacity: '0' },
        { transform: 'translateY(0)', opacity: '1' }
      ],
      'slide-in-down': [
        { transform: 'translateY(-20px)', opacity: '0' },
        { transform: 'translateY(0)', opacity: '1' }
      ],
      'scale-pulse': [
        { transform: 'scale(1)' },
        { transform: 'scale(1.1)' },
        { transform: 'scale(1)' }
      ],
      'fade-scale': [
        { transform: 'scale(0.9)', opacity: '0.5' },
        { transform: 'scale(1)', opacity: '1' }
      ]
    }

    return keyframes[animationName] || []
  }

  /**
   * 检查用户是否偏好减少动画
   */
  private checkReducedMotion(): boolean {
    // 在服务端环境中返回默认值
    if (typeof window === 'undefined') {
      return false
    }

    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch (error) {
      console.warn('检查减少动画偏好失败:', error)
      return false
    }
  }

  /**
   * 设置减少动画监听器
   */
  private setupReducedMotionListener(): void {
    // 确保在客户端环境中运行
    if (typeof window === 'undefined') {
      console.warn('减少动画监听器设置跳过: 服务端环境')
      return
    }

    try {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      mediaQuery.addEventListener('change', (e) => {
        this.reducedMotion = e.matches
        if (this.reducedMotion) {
          // 停止所有动画
          this.activeAnimations.forEach((animation, element) => {
            this.stopAnimation(element)
          })
        }
      })
    } catch (error) {
      console.warn('设置减少动画监听器失败:', error)
    }
  }

  /**
   * 通知订阅者
   */
  private notifySubscribers(event: AnimationEvent): void {
    this.subscribers.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('Error in animation subscriber:', error)
      }
    })
  }
}

// 全局实例
export const animationManager = new AnimationManager()

// CSS 动画工具函数
export function addCSSAnimation(element: HTMLElement, className: string, duration: number = 300): Promise<void> {
  return new Promise((resolve) => {
    element.classList.add(className)

    const handleAnimationEnd = () => {
      element.classList.remove(className)
      element.removeEventListener('animationend', handleAnimationEnd)
      resolve()
    }

    element.addEventListener('animationend', handleAnimationEnd)

    // 备用超时
    setTimeout(() => {
      element.classList.remove(className)
      element.removeEventListener('animationend', handleAnimationEnd)
      resolve()
    }, duration + 100)
  })
}
