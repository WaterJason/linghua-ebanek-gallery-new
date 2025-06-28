"use client"

import React from 'react'

/**
 * 音效反馈系统
 *
 * 为用户操作提供音效反馈，增强用户体验
 *
 * @description 该系统提供以下功能：
 * - 多种音效类型支持（成功、错误、警告、信息、点击、通知）
 * - 音效文件预加载和缓存
 * - 合成音效作为后备方案
 * - 音量控制和启用/禁用功能
 * - 本地存储配置持久化
 * - React Hook 集成
 *
 * @example
 * ```typescript
 * import { playSound, useAudioFeedback } from './audio-feedback-system'
 *
 * // 直接播放音效
 * await playSound.success()
 *
 * // 在组件中使用
 * const { isEnabled, setEnabled, play } = useAudioFeedback()
 * ```
 */

/**
 * 音效配置接口
 *
 * @interface AudioConfig
 */
export interface AudioConfig {
  /** 是否启用音效 */
  enabled: boolean
  /** 音量大小 (0-1) */
  volume: number
  /** 音效文件路径配置 */
  sounds: {
    /** 成功操作音效 */
    success: string
    /** 错误操作音效 */
    error: string
    /** 警告操作音效 */
    warning: string
    /** 信息提示音效 */
    info: string
    /** 点击操作音效 */
    click: string
    /** 通知音效 */
    notification: string
  }
}

export interface AudioFeedbackOptions {
  type: 'success' | 'error' | 'warning' | 'info' | 'click' | 'notification'
  volume?: number
  delay?: number
}

class AudioFeedbackManager {
  private config: AudioConfig
  private audioContext: AudioContext | null = null
  private audioBuffers: Map<string, AudioBuffer> = new Map()
  private isInitialized = false

  constructor() {
    this.config = {
      enabled: true,
      volume: 0.5,
      sounds: {
        success: '/sounds/success.mp3',
        error: '/sounds/error.mp3',
        warning: '/sounds/warning.mp3',
        info: '/sounds/info.mp3',
        click: '/sounds/click.mp3',
        notification: '/sounds/notification.mp3'
      }
    }
  }

  /**
   * 初始化音频系统
   */
  async initialize(): Promise<void> {
    if (this.isInitialized || typeof window === 'undefined') {
      return
    }

    try {
      // 创建音频上下文
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // 预加载音效文件
      await this.preloadSounds()

      this.isInitialized = true
      console.log('[AudioFeedback] 音效系统初始化成功')
    } catch (error) {
      console.warn('[AudioFeedback] 音效系统初始化失败:', error)
    }
  }

  /**
   * 预加载音效文件
   */
  private async preloadSounds(): Promise<void> {
    const loadPromises = Object.entries(this.config.sounds).map(async ([type, url]) => {
      try {
        const response = await fetch(url)
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer()
          const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer)
          this.audioBuffers.set(type, audioBuffer)
        }
      } catch (error) {
        console.warn(`[AudioFeedback] 无法加载音效 ${type}:`, error)
        // 创建简单的合成音效作为后备
        this.createSyntheticSound(type)
      }
    })

    await Promise.allSettled(loadPromises)
  }

  /**
   * 创建合成音效
   */
  private createSyntheticSound(type: string): void {
    if (!this.audioContext) return

    const sampleRate = this.audioContext.sampleRate
    const duration = 0.2
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate)
    const data = buffer.getChannelData(0)

    // 根据类型生成不同的音效
    const frequencies = {
      success: [523, 659, 784], // C-E-G 和弦
      error: [220, 185, 165],   // 下降音调
      warning: [440, 440, 440], // 重复 A 音
      info: [523, 523],         // 重复 C 音
      click: [800],             // 高频点击音
      notification: [523, 659]  // C-E 音程
    }

    const freqs = frequencies[type as keyof typeof frequencies] || [440]

    for (let i = 0; i < data.length; i++) {
      const time = i / sampleRate
      let sample = 0

      freqs.forEach((freq, index) => {
        const segmentDuration = duration / freqs.length
        if (time >= index * segmentDuration && time < (index + 1) * segmentDuration) {
          sample += Math.sin(2 * Math.PI * freq * time) * Math.exp(-time * 3)
        }
      })

      data[i] = sample * 0.3
    }

    this.audioBuffers.set(type, buffer)
  }

  /**
   * 播放音效
   */
  async play(options: AudioFeedbackOptions): Promise<void> {
    if (!this.config.enabled || !this.isInitialized || !this.audioContext) {
      return
    }

    // 如果音频上下文被暂停，尝试恢复
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume()
      } catch (error) {
        console.warn('[AudioFeedback] 无法恢复音频上下文:', error)
        return
      }
    }

    const buffer = this.audioBuffers.get(options.type)
    if (!buffer) {
      console.warn(`[AudioFeedback] 未找到音效: ${options.type}`)
      return
    }

    try {
      // 添加延迟
      if (options.delay) {
        await new Promise(resolve => setTimeout(resolve, options.delay))
      }

      const source = this.audioContext.createBufferSource()
      const gainNode = this.audioContext.createGain()

      source.buffer = buffer
      source.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      // 设置音量
      const volume = (options.volume ?? this.config.volume) * this.config.volume
      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime)

      source.start()
    } catch (error) {
      console.warn('[AudioFeedback] 播放音效失败:', error)
    }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<AudioConfig>): void {
    this.config = { ...this.config, ...newConfig }

    // 保存到本地存储
    if (typeof window !== 'undefined') {
      localStorage.setItem('audioFeedbackConfig', JSON.stringify(this.config))
    }
  }

  /**
   * 从本地存储加载配置
   */
  loadConfig(): void {
    if (typeof window === 'undefined') return

    try {
      const saved = localStorage.getItem('audioFeedbackConfig')
      if (saved) {
        const savedConfig = JSON.parse(saved)
        this.config = { ...this.config, ...savedConfig }
      }
    } catch (error) {
      console.warn('[AudioFeedback] 加载配置失败:', error)
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): AudioConfig {
    return { ...this.config }
  }

  /**
   * 启用/禁用音效
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled
    this.updateConfig({ enabled })
  }

  /**
   * 设置音量
   */
  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume))
    this.updateConfig({ volume: this.config.volume })
  }
}

// 创建全局实例
export const audioFeedbackManager = new AudioFeedbackManager()

/**
 * 便捷的音效播放函数
 */
export const playSound = {
  success: (options?: Omit<AudioFeedbackOptions, 'type'>) =>
    audioFeedbackManager.play({ type: 'success', ...options }),

  error: (options?: Omit<AudioFeedbackOptions, 'type'>) =>
    audioFeedbackManager.play({ type: 'error', ...options }),

  warning: (options?: Omit<AudioFeedbackOptions, 'type'>) =>
    audioFeedbackManager.play({ type: 'warning', ...options }),

  info: (options?: Omit<AudioFeedbackOptions, 'type'>) =>
    audioFeedbackManager.play({ type: 'info', ...options }),

  click: (options?: Omit<AudioFeedbackOptions, 'type'>) =>
    audioFeedbackManager.play({ type: 'click', ...options }),

  notification: (options?: Omit<AudioFeedbackOptions, 'type'>) =>
    audioFeedbackManager.play({ type: 'notification', ...options })
}

/**
 * React Hook for audio feedback
 */
export function useAudioFeedback() {
  const [isEnabled, setIsEnabled] = React.useState(audioFeedbackManager.getConfig().enabled)
  const [volume, setVolume] = React.useState(audioFeedbackManager.getConfig().volume)

  React.useEffect(() => {
    audioFeedbackManager.loadConfig()
    audioFeedbackManager.initialize()

    const config = audioFeedbackManager.getConfig()
    setIsEnabled(config.enabled)
    setVolume(config.volume)
  }, [])

  const updateEnabled = (enabled: boolean) => {
    audioFeedbackManager.setEnabled(enabled)
    setIsEnabled(enabled)
  }

  const updateVolume = (newVolume: number) => {
    audioFeedbackManager.setVolume(newVolume)
    setVolume(newVolume)
  }

  return {
    isEnabled,
    volume,
    setEnabled: updateEnabled,
    setVolume: updateVolume,
    play: audioFeedbackManager.play.bind(audioFeedbackManager),
    playSound
  }
}

// 自动初始化
if (typeof window !== 'undefined') {
  audioFeedbackManager.loadConfig()
  // 延迟初始化，等待用户交互
  document.addEventListener('click', () => {
    audioFeedbackManager.initialize()
  }, { once: true })
}
