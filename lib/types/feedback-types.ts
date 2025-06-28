// 阶段4操作反馈增强 - 类型定义
// 撤销重做、反馈系统、进度指示器、微交互动画相关类型

// ==================== 撤销重做系统类型 ====================

export interface UndoRedoAction {
  id: string
  type: string
  timestamp: number
  data: {
    before: any
    after: any
    target: string
    targetId?: string
  }
  description: string
  canUndo: boolean
  canRedo: boolean
  module?: string
  userId?: string
}

export interface UndoRedoStack {
  actions: UndoRedoAction[]
  currentIndex: number
  maxSize: number
}

export interface UndoRedoOptions {
  maxStackSize?: number
  autoCleanup?: boolean
  cleanupInterval?: number
  excludeTypes?: string[]
}

// ==================== 反馈系统类型 ====================

export type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface FeedbackAction {
  label: string
  action: () => void
  variant?: 'default' | 'destructive' | 'outline'
}

export interface FeedbackMessage {
  id: string
  type: FeedbackType
  title: string
  message: string
  duration?: number
  actions?: FeedbackAction[]
  timestamp: number
  persistent?: boolean
  module?: string
  details?: any
}

export interface FeedbackOptions {
  duration?: number
  persistent?: boolean
  actions?: FeedbackAction[]
  details?: any
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center'
  showProgress?: boolean
}

export interface FeedbackConfig {
  defaultDuration: number
  maxMessages: number
  enableSound: boolean
  enableAnimation: boolean
  position: FeedbackOptions['position']
}

// ==================== 进度指示器类型 ====================

export interface ProgressInfo {
  id: string
  title: string
  current: number
  total: number
  percentage: number
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  startTime: number
  estimatedEndTime?: number
  remainingTime?: number
  speed?: number
  message?: string
  details?: any
}

export interface ProgressOptions {
  title: string
  total: number
  showPercentage?: boolean
  showETA?: boolean
  showSpeed?: boolean
  cancellable?: boolean
  autoClose?: boolean
  onCancel?: () => void
}

export interface ProgressUpdate {
  current: number
  message?: string
  details?: any
}

// ==================== 微交互动画类型 ====================

export interface AnimationConfig {
  name: string
  duration: number
  easing: string
  delay?: number
  iterations?: number
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both'
}

export interface MicroAnimationOptions {
  trigger: 'hover' | 'click' | 'focus' | 'load' | 'change' | 'custom'
  animation: string | AnimationConfig
  disabled?: boolean
  once?: boolean
}

export interface AnimationPreset {
  name: string
  config: AnimationConfig
  description: string
  category: 'button' | 'transition' | 'loading' | 'feedback' | 'data'
}

// ==================== 操作跟踪器类型 ====================

export interface OperationContext {
  module: string
  action: string
  target?: string
  targetId?: string
  userId?: string
  sessionId?: string
  metadata?: Record<string, any>
}

export interface OperationResult {
  success: boolean
  data?: any
  error?: Error | string
  duration: number
  timestamp: number
}

export interface TrackedOperation {
  id: string
  context: OperationContext
  startTime: number
  endTime?: number
  result?: OperationResult
  undoAction?: UndoRedoAction
  feedbackMessage?: FeedbackMessage
}

// ==================== 系统配置类型 ====================

export interface FeedbackSystemConfig {
  undo: UndoRedoOptions
  feedback: FeedbackConfig
  animation: {
    enabled: boolean
    reducedMotion: boolean
    globalDuration: number
    presets: AnimationPreset[]
  }
  tracking: {
    enabled: boolean
    maxHistory: number
    autoCleanup: boolean
  }
}

// ==================== 事件类型 ====================

export interface FeedbackEvent {
  type: 'show' | 'hide' | 'action' | 'timeout'
  messageId: string
  timestamp: number
  data?: any
}

export interface UndoRedoEvent {
  type: 'execute' | 'undo' | 'redo' | 'clear'
  actionId?: string
  timestamp: number
  success: boolean
  error?: string
}

export interface ProgressEvent {
  type: 'start' | 'update' | 'complete' | 'cancel' | 'error'
  progressId: string
  data?: ProgressUpdate | string
  timestamp: number
}

export interface AnimationEvent {
  type: 'start' | 'end' | 'cancel'
  element: HTMLElement
  animation: string
  timestamp: number
}

// ==================== Hook 返回类型 ====================

export interface UseFeedbackReturn {
  showSuccess: (message: string, options?: FeedbackOptions) => string
  showError: (message: string, options?: FeedbackOptions) => string
  showWarning: (message: string, options?: FeedbackOptions) => string
  showInfo: (message: string, options?: FeedbackOptions) => string
  showLoading: (message: string, options?: FeedbackOptions) => string
  dismiss: (id: string) => void
  dismissAll: () => void
  messages: FeedbackMessage[]
}

export interface UseUndoRedoReturn {
  canUndo: boolean
  canRedo: boolean
  undo: () => Promise<boolean>
  redo: () => Promise<boolean>
  execute: (action: UndoRedoAction) => Promise<void>
  clear: () => void
  history: UndoRedoAction[]
}

export interface UseProgressReturn {
  start: (options: ProgressOptions) => string
  update: (id: string, update: ProgressUpdate) => void
  complete: (id: string, message?: string) => void
  cancel: (id: string) => void
  getProgress: (id: string) => ProgressInfo | undefined
  activeProgress: ProgressInfo[]
}

export interface UseAnimationReturn {
  play: (element: HTMLElement, animation: string | AnimationConfig) => Promise<void>
  stop: (element: HTMLElement) => void
  isPlaying: (element: HTMLElement) => boolean
  registerPreset: (preset: AnimationPreset) => void
  enabled: boolean
  setEnabled: (enabled: boolean) => void
}
