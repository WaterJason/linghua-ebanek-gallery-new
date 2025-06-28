"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

// 个性化数据类型定义
export interface DashboardCard {
  id: string
  type: string
  title: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  config: any
  isVisible: boolean
}

export interface DashboardLayout {
  id: string
  name: string
  isDefault: boolean
  cards: DashboardCard[]
}

export interface UserFavorite {
  id: string
  type: 'page' | 'report' | 'search' | 'operation'
  title: string
  url?: string
  icon?: string
  category?: string
  description?: string
  config?: any
  sortOrder: number
  accessCount: number
  lastAccess?: Date
}

export interface ReportConfig {
  id: string
  reportType: string
  name: string
  description?: string
  config: {
    fields: string[]
    filters: any[]
    sorting: any[]
    chartType?: string
    groupBy?: string[]
  }
  isDefault: boolean
}

export interface UserPreference {
  id: string
  category: string
  key: string
  value: any
}

// 个性化状态接口
interface PersonalizationState {
  // 仪表盘相关
  dashboardLayouts: DashboardLayout[]
  currentLayout: DashboardLayout | null

  // 收藏功能
  favorites: UserFavorite[]

  // 报表配置
  reportConfigs: ReportConfig[]

  // 用户偏好
  preferences: UserPreference[]

  // 加载状态
  isLoading: boolean
  error: string | null
}

// 个性化操作接口
interface PersonalizationActions {
  // 仪表盘操作
  saveDashboardLayout: (layout: Omit<DashboardLayout, 'id'>) => Promise<void>
  updateDashboardLayout: (id: string, layout: Partial<DashboardLayout>) => Promise<void>
  deleteDashboardLayout: (id: string) => Promise<void>
  setCurrentLayout: (layout: DashboardLayout) => void

  // 收藏操作
  addFavorite: (favorite: Omit<UserFavorite, 'id' | 'accessCount' | 'lastAccess'>) => Promise<void>
  removeFavorite: (id: string) => Promise<void>
  updateFavorite: (id: string, updates: Partial<UserFavorite>) => Promise<void>
  accessFavorite: (id: string) => Promise<void>

  // 报表配置操作
  saveReportConfig: (config: Omit<ReportConfig, 'id'>) => Promise<void>
  updateReportConfig: (id: string, config: Partial<ReportConfig>) => Promise<void>
  deleteReportConfig: (id: string) => Promise<void>

  // 用户偏好操作
  setPreference: (category: string, key: string, value: any) => Promise<void>
  getPreference: (category: string, key: string, defaultValue?: any) => any

  // 数据刷新
  refreshData: () => Promise<void>
}

type PersonalizationContextType = PersonalizationState & PersonalizationActions

const PersonalizationContext = createContext<PersonalizationContextType | null>(null)

// 个性化提供者组件
export function PersonalizationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [state, setState] = useState<PersonalizationState>({
    dashboardLayouts: [],
    currentLayout: null,
    favorites: [],
    reportConfigs: [],
    preferences: [],
    isLoading: true,
    error: null
  })

  // 初始化数据加载
  useEffect(() => {
    if (session?.user?.id) {
      loadPersonalizationData()
    }
  }, [session?.user?.id])

  // 加载个性化数据
  const loadPersonalizationData = async () => {
    if (!session?.user?.id) return

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      // 并行加载所有个性化数据
      const [layoutsRes, favoritesRes, reportsRes, preferencesRes] = await Promise.all([
        fetch('/api/personalization/dashboard-layouts').catch(() => ({ ok: false, json: () => Promise.resolve([]) })),
        fetch('/api/personalization/favorites').catch(() => ({ ok: false, json: () => Promise.resolve([]) })),
        fetch('/api/personalization/report-configs').catch(() => ({ ok: false, json: () => Promise.resolve([]) })),
        fetch('/api/personalization/preferences').catch(() => ({ ok: false, json: () => Promise.resolve([]) }))
      ])

      const [layouts, favorites, reportConfigs, preferences] = await Promise.all([
        layoutsRes.json(),
        favoritesRes.json(),
        reportsRes.json(),
        preferencesRes.json()
      ])

      setState(prev => ({
        ...prev,
        dashboardLayouts: layouts.data || [],
        favorites: favorites.data || [],
        reportConfigs: reportConfigs.data || [],
        preferences: preferences.data || [],
        currentLayout: layouts.data?.find((l: DashboardLayout) => l.isDefault) || null,
        isLoading: false
      }))
    } catch (error) {
      console.error('加载个性化数据失败:', error)
      setState(prev => ({
        ...prev,
        error: '加载个性化数据失败',
        isLoading: false
      }))
    }
  }

  // 仪表盘布局操作
  const saveDashboardLayout = async (layout: Omit<DashboardLayout, 'id'>) => {
    try {
      const response = await fetch('/api/personalization/dashboard-layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(layout)
      })

      if (!response.ok) throw new Error('保存布局失败')

      const newLayout = await response.json()
      setState(prev => ({
        ...prev,
        dashboardLayouts: [...prev.dashboardLayouts, newLayout.data]
      }))
    } catch (error) {
      console.error('保存仪表盘布局失败:', error)
      throw error
    }
  }

  const updateDashboardLayout = async (id: string, updates: Partial<DashboardLayout>) => {
    try {
      const response = await fetch(`/api/personalization/dashboard-layouts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) throw new Error('更新布局失败')

      const updatedLayout = await response.json()
      setState(prev => ({
        ...prev,
        dashboardLayouts: prev.dashboardLayouts.map(layout =>
          layout.id === id ? updatedLayout.data : layout
        ),
        currentLayout: prev.currentLayout?.id === id ? updatedLayout.data : prev.currentLayout
      }))
    } catch (error) {
      console.error('更新仪表盘布局失败:', error)
      throw error
    }
  }

  const deleteDashboardLayout = async (id: string) => {
    try {
      const response = await fetch(`/api/personalization/dashboard-layouts/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('删除布局失败')

      setState(prev => ({
        ...prev,
        dashboardLayouts: prev.dashboardLayouts.filter(layout => layout.id !== id),
        currentLayout: prev.currentLayout?.id === id ? null : prev.currentLayout
      }))
    } catch (error) {
      console.error('删除仪表盘布局失败:', error)
      throw error
    }
  }

  const setCurrentLayout = (layout: DashboardLayout) => {
    setState(prev => ({ ...prev, currentLayout: layout }))
  }

  // 收藏功能操作
  const addFavorite = async (favorite: Omit<UserFavorite, 'id' | 'accessCount' | 'lastAccess'>) => {
    try {
      const response = await fetch('/api/personalization/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(favorite)
      })

      if (!response.ok) throw new Error('添加收藏失败')

      const newFavorite = await response.json()
      setState(prev => ({
        ...prev,
        favorites: [...prev.favorites, newFavorite.data]
      }))
    } catch (error) {
      console.error('添加收藏失败:', error)
      throw error
    }
  }

  const removeFavorite = async (id: string) => {
    try {
      const response = await fetch(`/api/personalization/favorites/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('删除收藏失败')

      setState(prev => ({
        ...prev,
        favorites: prev.favorites.filter(fav => fav.id !== id)
      }))
    } catch (error) {
      console.error('删除收藏失败:', error)
      throw error
    }
  }

  const updateFavorite = async (id: string, updates: Partial<UserFavorite>) => {
    try {
      const response = await fetch(`/api/personalization/favorites/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) throw new Error('更新收藏失败')

      const updatedFavorite = await response.json()
      setState(prev => ({
        ...prev,
        favorites: prev.favorites.map(fav =>
          fav.id === id ? updatedFavorite.data : fav
        )
      }))
    } catch (error) {
      console.error('更新收藏失败:', error)
      throw error
    }
  }

  const accessFavorite = async (id: string) => {
    try {
      await fetch(`/api/personalization/favorites/${id}/access`, {
        method: 'POST'
      })

      // 更新本地状态
      setState(prev => ({
        ...prev,
        favorites: prev.favorites.map(fav =>
          fav.id === id
            ? { ...fav, accessCount: fav.accessCount + 1, lastAccess: new Date() }
            : fav
        )
      }))
    } catch (error) {
      console.error('记录收藏访问失败:', error)
    }
  }

  // 报表配置操作
  const saveReportConfig = async (config: Omit<ReportConfig, 'id'>) => {
    try {
      const response = await fetch('/api/personalization/report-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (!response.ok) throw new Error('保存报表配置失败')

      const newConfig = await response.json()
      setState(prev => ({
        ...prev,
        reportConfigs: [...prev.reportConfigs, newConfig.data]
      }))
    } catch (error) {
      console.error('保存报表配置失败:', error)
      throw error
    }
  }

  const updateReportConfig = async (id: string, config: Partial<ReportConfig>) => {
    try {
      const response = await fetch(`/api/personalization/report-configs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (!response.ok) throw new Error('更新报表配置失败')

      const updatedConfig = await response.json()
      setState(prev => ({
        ...prev,
        reportConfigs: prev.reportConfigs.map(cfg =>
          cfg.id === id ? updatedConfig.data : cfg
        )
      }))
    } catch (error) {
      console.error('更新报表配置失败:', error)
      throw error
    }
  }

  const deleteReportConfig = async (id: string) => {
    try {
      const response = await fetch(`/api/personalization/report-configs/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('删除报表配置失败')

      setState(prev => ({
        ...prev,
        reportConfigs: prev.reportConfigs.filter(cfg => cfg.id !== id)
      }))
    } catch (error) {
      console.error('删除报表配置失败:', error)
      throw error
    }
  }

  // 用户偏好操作
  const setPreference = async (category: string, key: string, value: any) => {
    try {
      const response = await fetch('/api/personalization/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, key, value })
      })

      if (!response.ok) throw new Error('设置偏好失败')

      const preference = await response.json()
      setState(prev => ({
        ...prev,
        preferences: [
          ...prev.preferences.filter(p => !(p.category === category && p.key === key)),
          preference.data
        ]
      }))
    } catch (error) {
      console.error('设置用户偏好失败:', error)
      throw error
    }
  }

  const getPreference = (category: string, key: string, defaultValue?: any) => {
    const preference = state.preferences.find(p => p.category === category && p.key === key)
    return preference ? preference.value : defaultValue
  }

  const refreshData = async () => {
    await loadPersonalizationData()
  }

  const contextValue: PersonalizationContextType = {
    ...state,
    saveDashboardLayout,
    updateDashboardLayout,
    deleteDashboardLayout,
    setCurrentLayout,
    addFavorite,
    removeFavorite,
    updateFavorite,
    accessFavorite,
    saveReportConfig,
    updateReportConfig,
    deleteReportConfig,
    setPreference,
    getPreference,
    refreshData
  }

  return (
    <PersonalizationContext.Provider value={contextValue}>
      {children}
    </PersonalizationContext.Provider>
  )
}

// 使用个性化功能的Hook
export function usePersonalization() {
  const context = useContext(PersonalizationContext)
  if (!context) {
    throw new Error('usePersonalization must be used within a PersonalizationProvider')
  }
  return context
}
