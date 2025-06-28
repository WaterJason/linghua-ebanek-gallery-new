// 阶段4操作反馈增强 - 反馈系统提供者
// 统一管理所有反馈功能的Provider组件

'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { FeedbackToastContainer } from '@/components/ui/feedback-toast'
import { ProgressIndicatorContainer } from '@/components/ui/progress-indicator'
import { UndoRedoKeyboardShortcuts, FloatingUndoRedoControls } from '@/components/ui/undo-redo-controls'
import { FeedbackSystemConfig } from '@/lib/types/feedback-types'
import { feedbackSystem } from '@/lib/feedback/feedback-system'
import { undoRedoManager } from '@/lib/feedback/undo-redo-manager'
import { progressMonitor } from '@/lib/feedback/progress-monitor'
import { animationManager } from '@/lib/feedback/animation-manager'

interface FeedbackContextType {
  config: FeedbackSystemConfig
  updateConfig: (newConfig: Partial<FeedbackSystemConfig>) => void
  isEnabled: boolean
  setEnabled: (enabled: boolean) => void
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined)

export function useFeedbackContext() {
  const context = useContext(FeedbackContext)
  if (!context) {
    throw new Error('useFeedbackContext must be used within a FeedbackProvider')
  }
  return context
}

interface FeedbackProviderProps {
  children: React.ReactNode
  config?: Partial<FeedbackSystemConfig>
  enableKeyboardShortcuts?: boolean
  enableFloatingControls?: boolean
  enableProgressIndicators?: boolean
  enableToasts?: boolean
}

export function FeedbackProvider({
  children,
  config: initialConfig,
  enableKeyboardShortcuts = true,
  enableFloatingControls = true,
  enableProgressIndicators = true,
  enableToasts = true
}: FeedbackProviderProps) {
  const [config, setConfig] = useState<FeedbackSystemConfig>(() => ({
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
    },
    ...initialConfig
  }))

  const [isEnabled, setIsEnabled] = useState(true)

  // 初始化系统配置
  useEffect(() => {
    // 更新反馈系统配置
    feedbackSystem.updateConfig(config.feedback)

    // 更新动画系统配置
    animationManager.setGlobalAnimationEnabled(config.animation.enabled && isEnabled)

    // 检查用户偏好的减少动画设置
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setConfig(prev => ({
        ...prev,
        animation: {
          ...prev.animation,
          reducedMotion: e.matches
        }
      }))

      if (e.matches) {
        animationManager.setGlobalAnimationEnabled(false)
      }
    }

    mediaQuery.addEventListener('change', handleReducedMotionChange)

    // 初始检查
    if (mediaQuery.matches) {
      setConfig(prev => ({
        ...prev,
        animation: {
          ...prev.animation,
          reducedMotion: true
        }
      }))
      animationManager.setGlobalAnimationEnabled(false)
    }

    return () => {
      mediaQuery.removeEventListener('change', handleReducedMotionChange)
    }
  }, [config, isEnabled])

  const updateConfig = (newConfig: Partial<FeedbackSystemConfig>) => {
    setConfig(prev => ({
      ...prev,
      ...newConfig,
      undo: { ...prev.undo, ...newConfig.undo },
      feedback: { ...prev.feedback, ...newConfig.feedback },
      animation: { ...prev.animation, ...newConfig.animation },
      tracking: { ...prev.tracking, ...newConfig.tracking }
    }))
  }

  const contextValue: FeedbackContextType = {
    config,
    updateConfig,
    isEnabled,
    setEnabled: setIsEnabled
  }

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}

      {/* 反馈Toast容器 */}
      {enableToasts && isEnabled && <FeedbackToastContainer />}

      {/* 进度指示器容器 */}
      {enableProgressIndicators && isEnabled && <ProgressIndicatorContainer />}

      {/* 键盘快捷键支持 */}
      {enableKeyboardShortcuts && isEnabled && <UndoRedoKeyboardShortcuts />}

      {/* 浮动撤销重做控制 */}
      {enableFloatingControls && isEnabled && <FloatingUndoRedoControls />}

      {/* 全局样式 */}
      <FeedbackGlobalStyles />
    </FeedbackContext.Provider>
  )
}

/**
 * 全局样式组件
 */
function FeedbackGlobalStyles() {
  return (
    <style jsx global>{`
      /* 反馈系统全局动画样式 */
      @keyframes feedback-slide-in-right {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes feedback-slide-out-right {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }

      @keyframes feedback-bounce-in {
        0% {
          transform: scale(0.3);
          opacity: 0;
        }
        50% {
          transform: scale(1.05);
        }
        70% {
          transform: scale(0.9);
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }

      @keyframes feedback-shake {
        0%, 100% {
          transform: translateX(0);
        }
        10%, 30%, 50%, 70%, 90% {
          transform: translateX(-10px);
        }
        20%, 40%, 60%, 80% {
          transform: translateX(10px);
        }
      }

      @keyframes feedback-pulse-success {
        0% {
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
        }
        70% {
          box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
        }
      }

      @keyframes feedback-pulse-error {
        0% {
          box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
        }
        70% {
          box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
        }
      }

      /* 进度条动画 */
      @keyframes feedback-progress-indeterminate {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(100%);
        }
      }

      /* 微交互动画类 */
      .feedback-animate-bounce-in {
        animation: feedback-bounce-in 0.6s ease-out;
      }

      .feedback-animate-shake {
        animation: feedback-shake 0.5s ease-in-out;
      }

      .feedback-animate-pulse-success {
        animation: feedback-pulse-success 2s infinite;
      }

      .feedback-animate-pulse-error {
        animation: feedback-pulse-error 2s infinite;
      }

      /* 减少动画偏好支持 */
      @media (prefers-reduced-motion: reduce) {
        .feedback-animate-bounce-in,
        .feedback-animate-shake,
        .feedback-animate-pulse-success,
        .feedback-animate-pulse-error {
          animation: none;
        }

        * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }

      /* 高对比度模式支持 */
      @media (prefers-contrast: high) {
        .feedback-toast {
          border-width: 2px;
        }

        .feedback-progress {
          border: 1px solid currentColor;
        }
      }

      /* 暗色模式优化 */
      @media (prefers-color-scheme: dark) {
        .feedback-toast {
          backdrop-filter: blur(8px);
        }
      }
    `}</style>
  )
}


/**
 * 反馈系统设置面板组件
 */
export function FeedbackSettingsPanel() {
  const { config, updateConfig, isEnabled, setEnabled } = useFeedbackContext()

  return (
    <div className="space-y-6 p-4 border rounded-lg">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">反馈系统设置</h3>

        {/* 全局开关 */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">启用反馈系统</label>
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="rounded"
          />
        </div>

        {/* 动画设置 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">动画设置</label>
          <div className="flex items-center justify-between">
            <span className="text-sm">启用动画</span>
            <input
              type="checkbox"
              checked={config.animation.enabled}
              onChange={(e) => updateConfig({
                animation: { ...config.animation, enabled: e.target.checked }
              })}
              className="rounded"
            />
          </div>
        </div>

        {/* 反馈设置 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">反馈设置</label>
          <div className="flex items-center justify-between">
            <span className="text-sm">启用声音</span>
            <input
              type="checkbox"
              checked={config.feedback.enableSound}
              onChange={(e) => updateConfig({
                feedback: { ...config.feedback, enableSound: e.target.checked }
              })}
              className="rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">默认显示时长 (ms)</span>
            <input
              type="number"
              value={config.feedback.defaultDuration}
              onChange={(e) => updateConfig({
                feedback: { ...config.feedback, defaultDuration: Number(e.target.value) }
              })}
              className="w-20 px-2 py-1 border rounded text-sm"
              min="1000"
              max="10000"
              step="1000"
            />
          </div>
        </div>

        {/* 撤销重做设置 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">撤销重做设置</label>
          <div className="flex items-center justify-between">
            <span className="text-sm">最大历史记录</span>
            <input
              type="number"
              value={config.undo.maxStackSize}
              onChange={(e) => updateConfig({
                undo: { ...config.undo, maxStackSize: Number(e.target.value) }
              })}
              className="w-20 px-2 py-1 border rounded text-sm"
              min="10"
              max="100"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
