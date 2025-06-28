// 阶段4操作反馈增强 - 统一导出文件
// 提供所有反馈功能的统一入口

// 核心管理器
export { undoRedoManager, UndoRedoManager } from './undo-redo-manager'
export { feedbackSystem, FeedbackSystem } from './feedback-system'
export { progressMonitor, ProgressMonitor, formatTime, formatSpeed, formatFileSize } from './progress-monitor'
export { animationManager, AnimationManager, addCSSAnimation } from './animation-manager'
export { operationTracker, OperationTracker } from './operation-tracker'
export { wsProgressManager, WebSocketProgressManager } from './websocket-progress'
export { soundManager, SoundManager } from './sound-manager'
export { operationRecorder, OperationRecorder } from './operation-recorder'

// 类型定义
export type {
  // 撤销重做类型
  UndoRedoAction,
  UndoRedoStack,
  UndoRedoOptions,
  UndoRedoEvent,

  // 反馈系统类型
  FeedbackType,
  FeedbackAction,
  FeedbackMessage,
  FeedbackOptions,
  FeedbackConfig,
  FeedbackEvent,

  // 进度监控类型
  ProgressInfo,
  ProgressOptions,
  ProgressUpdate,
  ProgressEvent,

  // 动画系统类型
  AnimationConfig,
  MicroAnimationOptions,
  AnimationPreset,
  AnimationEvent,

  // 操作跟踪类型
  OperationContext,
  OperationResult,
  TrackedOperation,

  // 系统配置类型
  FeedbackSystemConfig,

  // Hook 返回类型
  UseFeedbackReturn,
  UseUndoRedoReturn,
  UseProgressReturn,
  UseAnimationReturn
} from '../types/feedback-types'

// React Hooks
export {
  useFeedback,
  useUndoRedo,
  useProgress,
  useAnimation,
  useOperationTracker,
  useSmartOperation
} from '../../hooks/use-feedback'

// UI 组件
export { FeedbackToast, FeedbackToastContainer, showToast, useToast } from '../../components/ui/feedback-toast'
export { UndoRedoControls, UndoRedoKeyboardShortcuts, FloatingUndoRedoControls } from '../../components/ui/undo-redo-controls'
export {
  ProgressIndicator,
  ProgressIndicatorContainer,
  LinearProgress,
  CircularProgress,
  StepProgress
} from '../../components/ui/progress-indicator'
export {
  AnimatedElement,
  AnimatedButton,
  AnimatedNumber,
  FadeTransition,
  SlideTransition,
  PulseAnimation,
  Skeleton,
  BounceLoader,
  SpinLoader
} from '../../components/ui/micro-animations'

// Provider 组件
export { FeedbackProvider, useFeedbackContext, FeedbackSettingsPanel } from '../../components/providers/feedback-provider'

// 便捷函数
export const createFeedbackSystem = (config?: Partial<FeedbackSystemConfig>) => {
  return new FeedbackSystem(config?.feedback)
}

export const createUndoRedoManager = (options?: UndoRedoOptions) => {
  return new UndoRedoManager(options)
}

export const createProgressMonitor = () => {
  return new ProgressMonitor()
}

export const createAnimationManager = () => {
  return new AnimationManager()
}

export const createOperationTracker = (maxHistory?: number, autoCleanup?: boolean) => {
  return new OperationTracker(maxHistory, autoCleanup)
}

// 预设配置
export const defaultFeedbackConfig: FeedbackSystemConfig = {
  undo: {
    maxStackSize: 50,
    autoCleanup: true,
    cleanupInterval: 300000,
    excludeTypes: []
  },
  feedback: {
    defaultDuration: 5000,
    maxMessages: 5,
    enableSound: false,
    enableAnimation: true,
    position: 'top-right'
  },
  animation: {
    enabled: true,
    reducedMotion: false,
    globalDuration: 300,
    presets: []
  },
  tracking: {
    enabled: true,
    maxHistory: 1000,
    autoCleanup: true
  }
}

// 快速初始化函数
export const initializeFeedbackSystem = (config?: Partial<FeedbackSystemConfig>) => {
  const finalConfig = { ...defaultFeedbackConfig, ...config }

  // 更新各个系统的配置
  feedbackSystem.updateConfig(finalConfig.feedback)
  animationManager.setGlobalAnimationEnabled(finalConfig.animation.enabled)

  return {
    feedbackSystem,
    undoRedoManager,
    progressMonitor,
    animationManager,
    operationTracker,
    config: finalConfig
  }
}

// 全局实例（已在各个模块中创建）
export const globalFeedbackSystem = {
  feedback: feedbackSystem,
  undoRedo: undoRedoManager,
  progress: progressMonitor,
  animation: animationManager,
  operation: operationTracker
}

// 版本信息
export const FEEDBACK_SYSTEM_VERSION = '1.0.0'
export const FEEDBACK_SYSTEM_NAME = '聆花ERP反馈系统'

// 调试工具
export const debugFeedbackSystem = () => {
  console.group('🎯 聆花ERP反馈系统调试信息')
  console.log('版本:', FEEDBACK_SYSTEM_VERSION)
  console.log('反馈系统状态:', {
    messages: feedbackSystem.getMessages().length,
    config: feedbackSystem.getConfig()
  })
  console.log('撤销重做状态:', undoRedoManager.getState())
  console.log('进度监控状态:', {
    active: progressMonitor.getActiveProgress().length,
    all: progressMonitor.getAllProgress().length
  })
  console.log('动画系统状态:', {
    enabled: animationManager.isGlobalAnimationEnabled(),
    presets: animationManager.getPresets().length
  })
  console.log('操作跟踪状态:', operationTracker.getOperationStats())
  console.groupEnd()
}

// 性能监控
export const getFeedbackSystemPerformance = () => {
  return {
    feedback: {
      messageCount: feedbackSystem.getMessages().length,
      config: feedbackSystem.getConfig()
    },
    undoRedo: {
      ...undoRedoManager.getState(),
      historySize: undoRedoManager.getHistory().length
    },
    progress: {
      activeCount: progressMonitor.getActiveProgress().length,
      totalCount: progressMonitor.getAllProgress().length
    },
    animation: {
      enabled: animationManager.isGlobalAnimationEnabled(),
      presetCount: animationManager.getPresets().length
    },
    operation: operationTracker.getOperationStats()
  }
}

// 清理函数
export const cleanupFeedbackSystem = () => {
  feedbackSystem.dismissAll()
  undoRedoManager.clear()
  progressMonitor.clearAll()
  operationTracker.cleanup()
}

// 重置函数
export const resetFeedbackSystem = () => {
  cleanupFeedbackSystem()
  feedbackSystem.updateConfig(defaultFeedbackConfig.feedback)
  animationManager.setGlobalAnimationEnabled(defaultFeedbackConfig.animation.enabled)
}
