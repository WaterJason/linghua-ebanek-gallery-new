"use client"

import { useState, useEffect, useCallback } from "react"

interface HelpContent {
  id: string
  title: string
  content: string
  type: 'tip' | 'warning' | 'info' | 'tutorial'
  triggers: {
    path?: string
    element?: string
    event?: 'idle' | 'error' | 'first-visit'
    delay?: number
  }
  priority: number
  conditions?: {
    userRole?: string[]
    feature?: string
    timeSpent?: number
  }
}

interface ContextualHelpState {
  activeHelp: HelpContent | null
  dismissedHelps: Set<string>
  userInteractions: Map<string, number>
  lastActivity: number
}

// 预定义的帮助内容
const defaultHelpContent: HelpContent[] = [
  {
    id: 'dashboard-first-visit',
    title: '欢迎使用聆花ERP系统',
    content: '这是您的仪表盘，您可以在这里查看关键业务指标和快速执行常用操作。点击左侧导航栏可以访问不同的功能模块。',
    type: 'tutorial',
    triggers: {
      path: '/',
      event: 'first-visit',
      delay: 2000
    },
    priority: 1
  },
  {
    id: 'products-search-help',
    title: '产品搜索技巧',
    content: '您可以通过产品名称、编码或分类来搜索产品。支持模糊搜索，输入关键词即可快速找到相关产品。',
    type: 'tip',
    triggers: {
      path: '/products',
      element: '[data-search-input]',
      event: 'idle',
      delay: 5000
    },
    priority: 2
  },
  {
    id: 'inventory-low-stock',
    title: '库存预警',
    content: '当产品库存低于安全库存时，系统会自动显示预警。建议及时补充库存以避免缺货。',
    type: 'warning',
    triggers: {
      path: '/inventory',
      event: 'idle',
      delay: 3000
    },
    priority: 3,
    conditions: {
      userRole: ['admin', 'inventory_manager']
    }
  },
  {
    id: 'sales-pos-quick-tip',
    title: 'POS销售快捷操作',
    content: '在POS销售页面，您可以使用快捷键快速操作：F1-搜索产品，F2-结算，ESC-取消当前操作。',
    type: 'tip',
    triggers: {
      path: '/sales/pos',
      event: 'idle',
      delay: 10000
    },
    priority: 2
  },
  {
    id: 'finance-reconciliation',
    title: '财务对账提醒',
    content: '建议每月进行一次财务对账，确保账目准确。您可以在财务管理模块中查看详细的收支记录。',
    type: 'info',
    triggers: {
      path: '/finance',
      event: 'idle',
      delay: 8000
    },
    priority: 2,
    conditions: {
      userRole: ['admin', 'finance_manager']
    }
  }
]

export const useContextualHelp = (userRole?: string) => {
  const [state, setState] = useState<ContextualHelpState>({
    activeHelp: null,
    dismissedHelps: new Set(),
    userInteractions: new Map(),
    lastActivity: Date.now()
  })

  // 更新用户活动时间
  const updateActivity = useCallback(() => {
    setState(prev => ({ ...prev, lastActivity: Date.now() }))
  }, [])

  // 检查是否满足显示条件
  const checkConditions = useCallback((help: HelpContent): boolean => {
    if (!help.conditions) return true

    // 检查用户角色
    if (help.conditions.userRole && userRole) {
      if (!help.conditions.userRole.includes(userRole)) {
        return false
      }
    }

    // 检查页面停留时间
    if (help.conditions.timeSpent) {
      const timeSpent = Date.now() - state.lastActivity
      if (timeSpent < help.conditions.timeSpent) {
        return false
      }
    }

    return true
  }, [userRole, state.lastActivity])

  // 查找适用的帮助内容
  const findApplicableHelp = useCallback((currentPath: string): HelpContent | null => {
    const applicableHelps = defaultHelpContent.filter(help => {
      // 检查是否已被忽略
      if (state.dismissedHelps.has(help.id)) return false

      // 检查路径匹配
      if (help.triggers.path && !currentPath.startsWith(help.triggers.path)) return false

      // 检查条件
      if (!checkConditions(help)) return false

      // 检查事件类型
      if (help.triggers.event === 'first-visit') {
        const visitCount = state.userInteractions.get(currentPath) || 0
        return visitCount === 0
      }

      return true
    })

    // 按优先级排序，返回最高优先级的帮助
    return applicableHelps.sort((a, b) => a.priority - b.priority)[0] || null
  }, [state.dismissedHelps, state.userInteractions, checkConditions])

  // 显示帮助
  const showHelp = useCallback((help: HelpContent) => {
    setState(prev => ({ ...prev, activeHelp: help }))
  }, [])

  // 隐藏帮助
  const hideHelp = useCallback(() => {
    setState(prev => ({ ...prev, activeHelp: null }))
  }, [])

  // 忽略帮助（不再显示）
  const dismissHelp = useCallback((helpId: string) => {
    setState(prev => ({
      ...prev,
      activeHelp: prev.activeHelp?.id === helpId ? null : prev.activeHelp,
      dismissedHelps: new Set([...prev.dismissedHelps, helpId])
    }))
  }, [])

  // 记录页面访问
  const recordPageVisit = useCallback((path: string) => {
    setState(prev => {
      const newInteractions = new Map(prev.userInteractions)
      newInteractions.set(path, (newInteractions.get(path) || 0) + 1)
      return { ...prev, userInteractions: newInteractions }
    })
  }, [])

  // 检查空闲状态
  const checkIdleState = useCallback((currentPath: string) => {
    const idleTime = Date.now() - state.lastActivity
    const help = findApplicableHelp(currentPath)

    if (help && help.triggers.event === 'idle' && help.triggers.delay) {
      if (idleTime >= help.triggers.delay && !state.activeHelp) {
        showHelp(help)
      }
    }
  }, [state.lastActivity, state.activeHelp, findApplicableHelp, showHelp])

  // 监听用户活动
  useEffect(() => {
    const handleActivity = () => updateActivity()

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
    }
  }, [updateActivity])

  // 定期检查空闲状态
  useEffect(() => {
    const interval = setInterval(() => {
      const currentPath = window.location.pathname
      checkIdleState(currentPath)
    }, 1000)

    return () => clearInterval(interval)
  }, []) // 移除 checkIdleState 依赖，避免定时器重复创建

  // 页面变化时的处理
  const handlePageChange = useCallback((path: string) => {
    recordPageVisit(path)
    hideHelp() // 切换页面时隐藏当前帮助

    // 检查新页面的帮助内容
    const help = findApplicableHelp(path)
    if (help && help.triggers.event === 'first-visit') {
      setTimeout(() => showHelp(help), help.triggers.delay || 0)
    }
  }, [recordPageVisit, hideHelp, findApplicableHelp, showHelp])

  // 手动触发帮助
  const triggerHelp = useCallback((helpId: string) => {
    const help = defaultHelpContent.find(h => h.id === helpId)
    if (help && checkConditions(help)) {
      showHelp(help)
    }
  }, [checkConditions, showHelp])

  // 获取页面相关的帮助列表
  const getPageHelps = useCallback((path: string): HelpContent[] => {
    return defaultHelpContent.filter(help =>
      help.triggers.path?.startsWith(path) &&
      checkConditions(help) &&
      !state.dismissedHelps.has(help.id)
    )
  }, [checkConditions, state.dismissedHelps])

  return {
    activeHelp: state.activeHelp,
    showHelp,
    hideHelp,
    dismissHelp,
    triggerHelp,
    handlePageChange,
    getPageHelps,
    updateActivity
  }
}
