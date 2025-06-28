"use client"

import React from 'react'

/**
 * 操作录制和回放系统
 * 
 * 记录用户操作并支持回放，用于演示、培训和调试
 */

export interface OperationStep {
  id: string
  timestamp: number
  type: 'click' | 'input' | 'scroll' | 'navigation' | 'api_call' | 'state_change'
  target: string
  data: any
  description: string
  screenshot?: string
}

export interface OperationRecording {
  id: string
  name: string
  description: string
  startTime: number
  endTime: number
  steps: OperationStep[]
  metadata: {
    userAgent: string
    viewport: { width: number; height: number }
    url: string
  }
}

export interface PlaybackOptions {
  speed: number // 播放速度倍数
  pauseOnError: boolean
  highlightElements: boolean
  showTooltips: boolean
}

class OperationRecordingManager {
  private isRecording = false
  private currentRecording: OperationRecording | null = null
  private recordings: Map<string, OperationRecording> = new Map()
  private stepCounter = 0
  private observers: MutationObserver[] = []
  private eventListeners: Array<{ element: Element | Document; event: string; handler: EventListener }> = []

  /**
   * 开始录制
   */
  startRecording(name: string, description: string = ''): void {
    if (this.isRecording) {
      this.stopRecording()
    }

    this.currentRecording = {
      id: `recording_${Date.now()}`,
      name,
      description,
      startTime: Date.now(),
      endTime: 0,
      steps: [],
      metadata: {
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        url: window.location.href
      }
    }

    this.isRecording = true
    this.stepCounter = 0
    this.setupEventListeners()
    
    console.log(`[OperationRecording] 开始录制: ${name}`)
  }

  /**
   * 停止录制
   */
  stopRecording(): OperationRecording | null {
    if (!this.isRecording || !this.currentRecording) {
      return null
    }

    this.currentRecording.endTime = Date.now()
    this.isRecording = false
    
    this.cleanupEventListeners()
    
    // 保存录制
    this.recordings.set(this.currentRecording.id, this.currentRecording)
    this.saveToStorage()
    
    console.log(`[OperationRecording] 录制完成: ${this.currentRecording.name}`)
    
    const recording = this.currentRecording
    this.currentRecording = null
    return recording
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 点击事件
    const clickHandler = (event: MouseEvent) => {
      this.recordStep({
        type: 'click',
        target: this.getElementSelector(event.target as Element),
        data: {
          x: event.clientX,
          y: event.clientY,
          button: event.button
        },
        description: `点击 ${this.getElementDescription(event.target as Element)}`
      })
    }

    // 输入事件
    const inputHandler = (event: InputEvent) => {
      const target = event.target as HTMLInputElement
      this.recordStep({
        type: 'input',
        target: this.getElementSelector(target),
        data: {
          value: target.value,
          inputType: event.inputType
        },
        description: `输入到 ${this.getElementDescription(target)}: ${target.value}`
      })
    }

    // 滚动事件
    const scrollHandler = (event: Event) => {
      this.recordStep({
        type: 'scroll',
        target: 'window',
        data: {
          scrollX: window.scrollX,
          scrollY: window.scrollY
        },
        description: `滚动到 (${window.scrollX}, ${window.scrollY})`
      })
    }

    // 导航事件
    const navigationHandler = () => {
      this.recordStep({
        type: 'navigation',
        target: 'window',
        data: {
          url: window.location.href
        },
        description: `导航到 ${window.location.href}`
      })
    }

    // 添加事件监听器
    document.addEventListener('click', clickHandler, true)
    document.addEventListener('input', inputHandler, true)
    window.addEventListener('scroll', scrollHandler, { passive: true })
    window.addEventListener('popstate', navigationHandler)

    this.eventListeners = [
      { element: document, event: 'click', handler: clickHandler },
      { element: document, event: 'input', handler: inputHandler },
      { element: window, event: 'scroll', handler: scrollHandler },
      { element: window, event: 'popstate', handler: navigationHandler }
    ]
  }

  /**
   * 清理事件监听器
   */
  private cleanupEventListeners(): void {
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler)
    })
    this.eventListeners = []

    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }

  /**
   * 记录操作步骤
   */
  private recordStep(step: Omit<OperationStep, 'id' | 'timestamp'>): void {
    if (!this.isRecording || !this.currentRecording) {
      return
    }

    const operationStep: OperationStep = {
      id: `step_${++this.stepCounter}`,
      timestamp: Date.now(),
      ...step
    }

    this.currentRecording.steps.push(operationStep)
  }

  /**
   * 获取元素选择器
   */
  private getElementSelector(element: Element): string {
    if (!element) return ''

    // 优先使用 ID
    if (element.id) {
      return `#${element.id}`
    }

    // 使用 data-testid
    const testId = element.getAttribute('data-testid')
    if (testId) {
      return `[data-testid="${testId}"]`
    }

    // 使用类名
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim())
      if (classes.length > 0) {
        return `.${classes[0]}`
      }
    }

    // 使用标签名和位置
    const tagName = element.tagName.toLowerCase()
    const parent = element.parentElement
    if (parent) {
      const siblings = Array.from(parent.children).filter(child => child.tagName === element.tagName)
      const index = siblings.indexOf(element)
      return `${tagName}:nth-of-type(${index + 1})`
    }

    return tagName
  }

  /**
   * 获取元素描述
   */
  private getElementDescription(element: Element): string {
    if (!element) return '未知元素'

    const tagName = element.tagName.toLowerCase()
    const text = element.textContent?.trim().substring(0, 50) || ''
    const id = element.id
    const className = element.className

    if (id) return `${tagName}#${id}`
    if (text) return `${tagName}(${text})`
    if (className) return `${tagName}.${className.split(' ')[0]}`
    
    return tagName
  }

  /**
   * 回放录制
   */
  async playback(recordingId: string, options: Partial<PlaybackOptions> = {}): Promise<void> {
    const recording = this.recordings.get(recordingId)
    if (!recording) {
      throw new Error(`录制不存在: ${recordingId}`)
    }

    const playbackOptions: PlaybackOptions = {
      speed: 1,
      pauseOnError: true,
      highlightElements: true,
      showTooltips: true,
      ...options
    }

    console.log(`[OperationRecording] 开始回放: ${recording.name}`)

    for (let i = 0; i < recording.steps.length; i++) {
      const step = recording.steps[i]
      const nextStep = recording.steps[i + 1]

      try {
        await this.executeStep(step, playbackOptions)

        // 计算延迟
        if (nextStep) {
          const delay = (nextStep.timestamp - step.timestamp) / playbackOptions.speed
          await new Promise(resolve => setTimeout(resolve, Math.min(delay, 5000))) // 最大延迟5秒
        }
      } catch (error) {
        console.error(`[OperationRecording] 执行步骤失败:`, step, error)
        if (playbackOptions.pauseOnError) {
          throw error
        }
      }
    }

    console.log(`[OperationRecording] 回放完成: ${recording.name}`)
  }

  /**
   * 执行单个步骤
   */
  private async executeStep(step: OperationStep, options: PlaybackOptions): Promise<void> {
    const element = document.querySelector(step.target) as HTMLElement

    if (options.highlightElements && element) {
      this.highlightElement(element)
    }

    if (options.showTooltips) {
      this.showTooltip(step.description, element)
    }

    switch (step.type) {
      case 'click':
        if (element) {
          element.click()
        }
        break

      case 'input':
        if (element && 'value' in element) {
          (element as HTMLInputElement).value = step.data.value
          element.dispatchEvent(new Event('input', { bubbles: true }))
        }
        break

      case 'scroll':
        window.scrollTo(step.data.scrollX, step.data.scrollY)
        break

      case 'navigation':
        // 注意：实际导航可能会中断回放
        console.log(`[OperationRecording] 模拟导航到: ${step.data.url}`)
        break
    }
  }

  /**
   * 高亮元素
   */
  private highlightElement(element: HTMLElement): void {
    const originalStyle = element.style.cssText
    element.style.cssText += '; outline: 3px solid #ff6b6b; outline-offset: 2px;'
    
    setTimeout(() => {
      element.style.cssText = originalStyle
    }, 1000)
  }

  /**
   * 显示提示
   */
  private showTooltip(text: string, element?: HTMLElement): void {
    const tooltip = document.createElement('div')
    tooltip.textContent = text
    tooltip.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #333;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 14px;
      z-index: 10000;
      max-width: 300px;
    `

    document.body.appendChild(tooltip)
    
    setTimeout(() => {
      document.body.removeChild(tooltip)
    }, 2000)
  }

  /**
   * 保存到本地存储
   */
  private saveToStorage(): void {
    try {
      const data = Array.from(this.recordings.entries())
      localStorage.setItem('operationRecordings', JSON.stringify(data))
    } catch (error) {
      console.warn('[OperationRecording] 保存录制失败:', error)
    }
  }

  /**
   * 从本地存储加载
   */
  loadFromStorage(): void {
    try {
      const data = localStorage.getItem('operationRecordings')
      if (data) {
        const recordings = JSON.parse(data)
        this.recordings = new Map(recordings)
      }
    } catch (error) {
      console.warn('[OperationRecording] 加载录制失败:', error)
    }
  }

  /**
   * 获取所有录制
   */
  getRecordings(): OperationRecording[] {
    return Array.from(this.recordings.values())
  }

  /**
   * 删除录制
   */
  deleteRecording(id: string): boolean {
    const deleted = this.recordings.delete(id)
    if (deleted) {
      this.saveToStorage()
    }
    return deleted
  }

  /**
   * 导出录制
   */
  exportRecording(id: string): string {
    const recording = this.recordings.get(id)
    if (!recording) {
      throw new Error(`录制不存在: ${id}`)
    }
    return JSON.stringify(recording, null, 2)
  }

  /**
   * 导入录制
   */
  importRecording(data: string): void {
    try {
      const recording: OperationRecording = JSON.parse(data)
      this.recordings.set(recording.id, recording)
      this.saveToStorage()
    } catch (error) {
      throw new Error('无效的录制数据')
    }
  }

  /**
   * 获取录制状态
   */
  getRecordingStatus(): { isRecording: boolean; currentRecording: OperationRecording | null } {
    return {
      isRecording: this.isRecording,
      currentRecording: this.currentRecording
    }
  }
}

// 创建全局实例
export const operationRecordingManager = new OperationRecordingManager()

/**
 * React Hook for operation recording
 */
export function useOperationRecording() {
  const [isRecording, setIsRecording] = React.useState(false)
  const [recordings, setRecordings] = React.useState<OperationRecording[]>([])

  React.useEffect(() => {
    operationRecordingManager.loadFromStorage()
    setRecordings(operationRecordingManager.getRecordings())
  }, [])

  const startRecording = (name: string, description?: string) => {
    operationRecordingManager.startRecording(name, description)
    setIsRecording(true)
  }

  const stopRecording = () => {
    const recording = operationRecordingManager.stopRecording()
    setIsRecording(false)
    if (recording) {
      setRecordings(operationRecordingManager.getRecordings())
    }
    return recording
  }

  const playback = async (recordingId: string, options?: Partial<PlaybackOptions>) => {
    await operationRecordingManager.playback(recordingId, options)
  }

  const deleteRecording = (id: string) => {
    operationRecordingManager.deleteRecording(id)
    setRecordings(operationRecordingManager.getRecordings())
  }

  return {
    isRecording,
    recordings,
    startRecording,
    stopRecording,
    playback,
    deleteRecording,
    exportRecording: operationRecordingManager.exportRecording.bind(operationRecordingManager),
    importRecording: (data: string) => {
      operationRecordingManager.importRecording(data)
      setRecordings(operationRecordingManager.getRecordings())
    }
  }
}

// 自动加载
if (typeof window !== 'undefined') {
  operationRecordingManager.loadFromStorage()
}
