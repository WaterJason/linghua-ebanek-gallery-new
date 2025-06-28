// 阶段4操作反馈增强 - 声音反馈管理器
// 提供各种操作的声音反馈

import { FeedbackType } from '@/lib/types/feedback-types'

interface SoundConfig {
  enabled: boolean
  volume: number
  sounds: Record<string, string>
}

interface SoundPreset {
  name: string
  url: string
  volume?: number
  description: string
}

export class SoundManager {
  private config: SoundConfig
  private audioContext: AudioContext | null = null
  private audioBuffers: Map<string, AudioBuffer> = new Map()
  private loadingPromises: Map<string, Promise<AudioBuffer>> = new Map()
  private presets: Map<string, SoundPreset> = new Map()

  constructor(config: Partial<SoundConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      volume: config.volume ?? 0.5,
      sounds: config.sounds ?? {}
    }

    // 只在客户端初始化音频上下文
    if (typeof window !== 'undefined') {
      this.initializeAudioContext()
    }
    this.initializePresets()
  }

  /**
   * 初始化音频上下文
   */
  private async initializeAudioContext(): Promise<void> {
    // 确保在客户端环境中运行
    if (typeof window === 'undefined') {
      console.warn('音频上下文初始化跳过: 服务端环境')
      return
    }

    try {
      // 检查浏览器是否支持 AudioContext
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) {
        console.warn('音频上下文初始化失败: 浏览器不支持 AudioContext')
        return
      }

      this.audioContext = new AudioContextClass()

      // 处理浏览器的自动播放策略
      if (this.audioContext.state === 'suspended') {
        const resumeAudio = () => {
          this.audioContext?.resume()
          if (typeof document !== 'undefined') {
            document.removeEventListener('click', resumeAudio)
            document.removeEventListener('keydown', resumeAudio)
          }
        }

        if (typeof document !== 'undefined') {
          document.addEventListener('click', resumeAudio)
          document.addEventListener('keydown', resumeAudio)
        }
      }
    } catch (error) {
      console.warn('音频上下文初始化失败:', error)
    }
  }

  /**
   * 初始化声音预设
   */
  private initializePresets(): void {
    const presets: SoundPreset[] = [
      {
        name: 'success',
        url: '/sounds/success.mp3',
        volume: 0.6,
        description: '成功操作提示音'
      },
      {
        name: 'error',
        url: '/sounds/error.mp3',
        volume: 0.7,
        description: '错误操作提示音'
      },
      {
        name: 'warning',
        url: '/sounds/warning.mp3',
        volume: 0.5,
        description: '警告提示音'
      },
      {
        name: 'info',
        url: '/sounds/info.mp3',
        volume: 0.4,
        description: '信息提示音'
      },
      {
        name: 'notification',
        url: '/sounds/notification.mp3',
        volume: 0.5,
        description: '通知提示音'
      },
      {
        name: 'click',
        url: '/sounds/click.mp3',
        volume: 0.3,
        description: '点击音效'
      },
      {
        name: 'complete',
        url: '/sounds/complete.mp3',
        volume: 0.6,
        description: '完成提示音'
      }
    ]

    presets.forEach(preset => this.presets.set(preset.name, preset))
  }

  /**
   * 确保音频上下文已初始化（客户端调用）
   */
  async ensureAudioContext(): Promise<void> {
    if (!this.audioContext && typeof window !== 'undefined') {
      await this.initializeAudioContext()
    }
  }

  /**
   * 播放反馈声音
   */
  async playFeedbackSound(type: FeedbackType): Promise<void> {
    if (!this.config.enabled) {
      return
    }

    // 确保音频上下文已初始化
    await this.ensureAudioContext()

    if (!this.audioContext) {
      return
    }

    const soundName = this.mapFeedbackTypeToSound(type)
    await this.playSound(soundName)
  }

  /**
   * 播放指定声音
   */
  async playSound(soundName: string, volume?: number): Promise<void> {
    if (!this.config.enabled) {
      return
    }

    // 确保音频上下文已初始化
    await this.ensureAudioContext()

    if (!this.audioContext) {
      return
    }

    try {
      const buffer = await this.getAudioBuffer(soundName)
      if (!buffer) {
        return
      }

      const source = this.audioContext.createBufferSource()
      const gainNode = this.audioContext.createGain()

      source.buffer = buffer
      source.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      // 设置音量
      const preset = this.presets.get(soundName)
      const finalVolume = volume ?? preset?.volume ?? this.config.volume
      gainNode.gain.setValueAtTime(finalVolume, this.audioContext.currentTime)

      source.start(0)
    } catch (error) {
      console.warn(`播放声音失败 (${soundName}):`, error)
    }
  }

  /**
   * 获取音频缓冲区
   */
  private async getAudioBuffer(soundName: string): Promise<AudioBuffer | null> {
    // 检查缓存
    if (this.audioBuffers.has(soundName)) {
      return this.audioBuffers.get(soundName)!
    }

    // 检查是否正在加载
    if (this.loadingPromises.has(soundName)) {
      return await this.loadingPromises.get(soundName)!
    }

    // 开始加载
    const loadPromise = this.loadAudioBuffer(soundName)
    this.loadingPromises.set(soundName, loadPromise)

    try {
      const buffer = await loadPromise
      this.audioBuffers.set(soundName, buffer)
      this.loadingPromises.delete(soundName)
      return buffer
    } catch (error) {
      this.loadingPromises.delete(soundName)
      throw error
    }
  }

  /**
   * 加载音频缓冲区
   */
  private async loadAudioBuffer(soundName: string): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('音频上下文未初始化')
    }

    const preset = this.presets.get(soundName)
    if (!preset) {
      throw new Error(`未找到声音预设: ${soundName}`)
    }

    try {
      const response = await fetch(preset.url)
      if (!response.ok) {
        throw new Error(`加载音频文件失败: ${response.status}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
      return audioBuffer
    } catch (error) {
      // 如果加载失败，尝试生成合成音效
      console.warn(`加载音频文件失败，使用合成音效: ${soundName}`, error)
      return this.generateSyntheticSound(soundName)
    }
  }

  /**
   * 生成合成音效
   */
  private generateSyntheticSound(soundName: string): AudioBuffer {
    if (!this.audioContext) {
      throw new Error('音频上下文未初始化')
    }

    const sampleRate = this.audioContext.sampleRate
    const duration = 0.2 // 200ms
    const length = sampleRate * duration
    const buffer = this.audioContext.createBuffer(1, length, sampleRate)
    const data = buffer.getChannelData(0)

    // 根据声音类型生成不同的音效
    switch (soundName) {
      case 'success':
        this.generateSuccessSound(data, sampleRate)
        break
      case 'error':
        this.generateErrorSound(data, sampleRate)
        break
      case 'warning':
        this.generateWarningSound(data, sampleRate)
        break
      case 'info':
        this.generateInfoSound(data, sampleRate)
        break
      case 'click':
        this.generateClickSound(data, sampleRate)
        break
      default:
        this.generateDefaultSound(data, sampleRate)
    }

    return buffer
  }

  /**
   * 生成成功音效
   */
  private generateSuccessSound(data: Float32Array, sampleRate: number): void {
    const frequencies = [523.25, 659.25, 783.99] // C5, E5, G5
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate
      let sample = 0
      frequencies.forEach((freq, index) => {
        const envelope = Math.exp(-t * 3) * (1 - index * 0.2)
        sample += Math.sin(2 * Math.PI * freq * t) * envelope * 0.3
      })
      data[i] = sample
    }
  }

  /**
   * 生成错误音效
   */
  private generateErrorSound(data: Float32Array, sampleRate: number): void {
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate
      const envelope = Math.exp(-t * 2)
      const frequency = 200 + Math.sin(t * 20) * 50 // 频率调制
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.4
    }
  }

  /**
   * 生成警告音效
   */
  private generateWarningSound(data: Float32Array, sampleRate: number): void {
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate
      const envelope = Math.exp(-t * 1.5)
      const frequency = 440 // A4
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3
    }
  }

  /**
   * 生成信息音效
   */
  private generateInfoSound(data: Float32Array, sampleRate: number): void {
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate
      const envelope = Math.exp(-t * 2)
      const frequency = 800
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.2
    }
  }

  /**
   * 生成点击音效
   */
  private generateClickSound(data: Float32Array, sampleRate: number): void {
    for (let i = 0; i < data.length * 0.1; i++) {
      const t = i / sampleRate
      const envelope = Math.exp(-t * 20)
      const frequency = 1000
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.1
    }
  }

  /**
   * 生成默认音效
   */
  private generateDefaultSound(data: Float32Array, sampleRate: number): void {
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate
      const envelope = Math.exp(-t * 3)
      const frequency = 600
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.2
    }
  }

  /**
   * 映射反馈类型到声音
   */
  private mapFeedbackTypeToSound(type: FeedbackType): string {
    const mapping: Record<FeedbackType, string> = {
      success: 'success',
      error: 'error',
      warning: 'warning',
      info: 'info',
      loading: 'notification'
    }
    return mapping[type] || 'info'
  }

  /**
   * 设置全局音量
   */
  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume))
  }

  /**
   * 启用/禁用声音
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled
  }

  /**
   * 预加载所有声音
   */
  async preloadSounds(): Promise<void> {
    const loadPromises = Array.from(this.presets.keys()).map(soundName =>
      this.getAudioBuffer(soundName).catch(error => {
        console.warn(`预加载声音失败 (${soundName}):`, error)
        return null
      })
    )

    await Promise.all(loadPromises)
    console.log('声音预加载完成')
  }

  /**
   * 获取配置
   */
  getConfig(): SoundConfig {
    return { ...this.config }
  }

  /**
   * 获取所有预设
   */
  getPresets(): SoundPreset[] {
    return Array.from(this.presets.values())
  }

  /**
   * 添加自定义声音预设
   */
  addPreset(preset: SoundPreset): void {
    this.presets.set(preset.name, preset)
  }

  /**
   * 测试声音
   */
  async testSound(soundName: string): Promise<void> {
    console.log(`测试声音: ${soundName}`)
    await this.playSound(soundName)
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.audioBuffers.clear()
    this.loadingPromises.clear()
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}

// 全局实例
export const soundManager = new SoundManager()
