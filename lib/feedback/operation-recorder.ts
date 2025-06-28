// 阶段4操作反馈增强 - 操作录制回放功能
// 记录用户操作并支持回放，用于培训和调试

import { UndoRedoAction, OperationContext } from '@/lib/types/feedback-types'

interface RecordedOperation {
  id: string
  timestamp: number
  type: 'click' | 'input' | 'navigation' | 'api_call' | 'custom'
  target: string
  data: any
  context: OperationContext
  screenshot?: string
  description: string
}

interface RecordingSession {
  id: string
  name: string
  startTime: number
  endTime?: number
  operations: RecordedOperation[]
  metadata: {
    userAgent: string
    screenResolution: string
    userId?: string
    sessionId?: string
  }
}

interface PlaybackOptions {
  speed: number // 播放速度倍数
  pauseOnError: boolean
  highlightElements: boolean
  showTooltips: boolean
  skipDelay: boolean
}

export class OperationRecorder {
  private isRecording = false
  private currentSession: RecordingSession | null = null
  private operations: RecordedOperation[] = []
  private eventListeners: Array<() => void> = []
  private operationCounter = 0

  /**
   * 开始录制
   */
  startRecording(sessionName: string): string {
    if (this.isRecording) {
      throw new Error('已有录制会话正在进行')
    }

    const sessionId = this.generateId()
    this.currentSession = {
      id: sessionId,
      name: sessionName,
      startTime: Date.now(),
      operations: [],
      metadata: {
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        userId: this.getCurrentUserId(),
        sessionId: this.getCurrentSessionId()
      }
    }

    this.operations = []
    this.isRecording = true
    this.setupEventListeners()

    console.log(`📹 开始录制操作会话: ${sessionName}`)
    return sessionId
  }

  /**
   * 停止录制
   */
  stopRecording(): RecordingSession | null {
    if (!this.isRecording || !this.currentSession) {
      return null
    }

    this.currentSession.endTime = Date.now()
    this.currentSession.operations = [...this.operations]
    
    this.isRecording = false
    this.removeEventListeners()

    const session = this.currentSession
    this.currentSession = null
    this.operations = []

    console.log(`📹 录制完成，共记录 ${session.operations.length} 个操作`)
    return session
  }

  /**
   * 记录操作
   */
  recordOperation(
    type: RecordedOperation['type'],
    target: string,
    data: any,
    context: OperationContext,
    description?: string
  ): void {
    if (!this.isRecording) {
      return
    }

    const operation: RecordedOperation = {
      id: `op_${++this.operationCounter}`,
      timestamp: Date.now(),
      type,
      target,
      data,
      context,
      description: description || this.generateDescription(type, target, data)
    }

    this.operations.push(operation)
    console.log(`📹 记录操作: ${operation.description}`)
  }

  /**
   * 回放操作会话
   */
  async playbackSession(
    session: RecordingSession,
    options: Partial<PlaybackOptions> = {}
  ): Promise<void> {
    const playbackOptions: PlaybackOptions = {
      speed: options.speed ?? 1,
      pauseOnError: options.pauseOnError ?? true,
      highlightElements: options.highlightElements ?? true,
      showTooltips: options.showTooltips ?? true,
      skipDelay: options.skipDelay ?? false
    }

    console.log(`🎬 开始回放会话: ${session.name}`)

    for (let i = 0; i < session.operations.length; i++) {
      const operation = session.operations[i]
      const nextOperation = session.operations[i + 1]

      try {
        // 执行操作
        await this.executeOperation(operation, playbackOptions)

        // 计算延迟
        if (nextOperation && !playbackOptions.skipDelay) {
          const delay = (nextOperation.timestamp - operation.timestamp) / playbackOptions.speed
          if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, Math.min(delay, 5000)))
          }
        }

      } catch (error) {
        console.error(`回放操作失败: ${operation.description}`, error)
        
        if (playbackOptions.pauseOnError) {
          const shouldContinue = confirm(`操作回放失败: ${operation.description}\n是否继续回放？`)
          if (!shouldContinue) {
            break
          }
        }
      }
    }

    console.log(`🎬 回放完成: ${session.name}`)
  }

  /**
   * 执行单个操作
   */
  private async executeOperation(
    operation: RecordedOperation,
    options: PlaybackOptions
  ): Promise<void> {
    if (options.showTooltips) {
      this.showOperationTooltip(operation)
    }

    switch (operation.type) {
      case 'click':
        await this.executeClick(operation, options)
        break

      case 'input':
        await this.executeInput(operation, options)
        break

      case 'navigation':
        await this.executeNavigation(operation, options)
        break

      case 'api_call':
        await this.executeApiCall(operation, options)
        break

      case 'custom':
        await this.executeCustom(operation, options)
        break

      default:
        console.warn(`未知操作类型: ${operation.type}`)
    }
  }

  /**
   * 执行点击操作
   */
  private async executeClick(operation: RecordedOperation, options: PlaybackOptions): Promise<void> {
    const element = this.findElement(operation.target)
    if (!element) {
      throw new Error(`未找到目标元素: ${operation.target}`)
    }

    if (options.highlightElements) {
      this.highlightElement(element)
    }

    // 模拟点击
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    await new Promise(resolve => setTimeout(resolve, 500))
    
    element.click()
  }

  /**
   * 执行输入操作
   */
  private async executeInput(operation: RecordedOperation, options: PlaybackOptions): Promise<void> {
    const element = this.findElement(operation.target) as HTMLInputElement
    if (!element) {
      throw new Error(`未找到输入元素: ${operation.target}`)
    }

    if (options.highlightElements) {
      this.highlightElement(element)
    }

    element.focus()
    element.value = ''

    // 模拟逐字输入
    const text = operation.data.value || ''
    for (const char of text) {
      element.value += char
      element.dispatchEvent(new Event('input', { bubbles: true }))
      await new Promise(resolve => setTimeout(resolve, 50 / options.speed))
    }

    element.dispatchEvent(new Event('change', { bubbles: true }))
  }

  /**
   * 执行导航操作
   */
  private async executeNavigation(operation: RecordedOperation, options: PlaybackOptions): Promise<void> {
    const url = operation.data.url
    if (url) {
      window.location.href = url
      await new Promise(resolve => setTimeout(resolve, 2000 / options.speed))
    }
  }

  /**
   * 执行API调用
   */
  private async executeApiCall(operation: RecordedOperation, options: PlaybackOptions): Promise<void> {
    const { url, method, data } = operation.data
    
    try {
      const response = await fetch(url, {
        method: method || 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        body: data ? JSON.stringify(data) : undefined
      })

      if (!response.ok) {
        throw new Error(`API调用失败: ${response.status}`)
      }
    } catch (error) {
      console.error('API调用回放失败:', error)
      throw error
    }
  }

  /**
   * 执行自定义操作
   */
  private async executeCustom(operation: RecordedOperation, options: PlaybackOptions): Promise<void> {
    // 自定义操作的回放逻辑
    console.log(`执行自定义操作: ${operation.description}`)
  }

  /**
   * 查找元素
   */
  private findElement(selector: string): Element | null {
    try {
      return document.querySelector(selector)
    } catch (error) {
      console.warn(`元素选择器无效: ${selector}`)
      return null
    }
  }

  /**
   * 高亮元素
   */
  private highlightElement(element: Element): void {
    const originalStyle = element.getAttribute('style') || ''
    element.setAttribute('style', originalStyle + '; outline: 3px solid #ff6b6b; outline-offset: 2px;')
    
    setTimeout(() => {
      element.setAttribute('style', originalStyle)
    }, 1000)
  }

  /**
   * 显示操作提示
   */
  private showOperationTooltip(operation: RecordedOperation): void {
    const tooltip = document.createElement('div')
    tooltip.className = 'operation-tooltip'
    tooltip.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      font-size: 14px;
      z-index: 10000;
      max-width: 300px;
    `
    tooltip.textContent = operation.description

    document.body.appendChild(tooltip)

    setTimeout(() => {
      document.body.removeChild(tooltip)
    }, 2000)
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 点击事件
    const clickListener = (event: MouseEvent) => {
      const target = event.target as Element
      const selector = this.generateSelector(target)
      
      this.recordOperation('click', selector, {
        x: event.clientX,
        y: event.clientY,
        button: event.button
      }, {
        module: '用户界面',
        action: '点击',
        target: target.tagName.toLowerCase()
      })
    }

    // 输入事件
    const inputListener = (event: Event) => {
      const target = event.target as HTMLInputElement
      const selector = this.generateSelector(target)
      
      this.recordOperation('input', selector, {
        value: target.value,
        type: target.type
      }, {
        module: '用户界面',
        action: '输入',
        target: 'input'
      })
    }

    document.addEventListener('click', clickListener, true)
    document.addEventListener('change', inputListener, true)

    this.eventListeners.push(
      () => document.removeEventListener('click', clickListener, true),
      () => document.removeEventListener('change', inputListener, true)
    )
  }

  /**
   * 移除事件监听器
   */
  private removeEventListeners(): void {
    this.eventListeners.forEach(removeListener => removeListener())
    this.eventListeners = []
  }

  /**
   * 生成元素选择器
   */
  private generateSelector(element: Element): string {
    if (element.id) {
      return `#${element.id}`
    }

    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim())
      if (classes.length > 0) {
        return `.${classes.join('.')}`
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
   * 生成操作描述
   */
  private generateDescription(type: string, target: string, data: any): string {
    switch (type) {
      case 'click':
        return `点击 ${target}`
      case 'input':
        return `在 ${target} 中输入 "${data.value}"`
      case 'navigation':
        return `导航到 ${data.url}`
      case 'api_call':
        return `调用API ${data.method} ${data.url}`
      default:
        return `执行 ${type} 操作`
    }
  }

  /**
   * 获取当前用户ID
   */
  private getCurrentUserId(): string {
    return 'current-user'
  }

  /**
   * 获取当前会话ID
   */
  private getCurrentSessionId(): string {
    return 'current-session'
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取录制状态
   */
  getRecordingStatus() {
    return {
      isRecording: this.isRecording,
      currentSession: this.currentSession?.name,
      operationCount: this.operations.length
    }
  }

  /**
   * 导出会话
   */
  exportSession(session: RecordingSession): string {
    return JSON.stringify(session, null, 2)
  }

  /**
   * 导入会话
   */
  importSession(sessionData: string): RecordingSession {
    return JSON.parse(sessionData)
  }
}

// 全局实例
export const operationRecorder = new OperationRecorder()
