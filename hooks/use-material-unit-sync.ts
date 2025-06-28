"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"

interface Material {
  id: string
  name: string
  count: number
}

interface Unit {
  id: string
  name: string
  count: number
}

interface MaterialUnitSyncState {
  materials: Material[]
  units: Unit[]
  isLoading: boolean
  lastUpdated: Date | null
}

// 全局状态管理
let globalState: MaterialUnitSyncState = {
  materials: [],
  units: [],
  isLoading: false,
  lastUpdated: null
}

// 订阅者列表
const subscribers = new Set<() => void>()

// 通知所有订阅者
const notifySubscribers = () => {
  console.log(`[GlobalState] 通知 ${subscribers.size} 个订阅者状态更新`)
  subscribers.forEach((callback, index) => {
    try {
      callback()
      console.log(`[GlobalState] 订阅者 ${index} 更新成功`)
    } catch (error) {
      console.error(`[GlobalState] 订阅者 ${index} 更新失败:`, error)
    }
  })
}

// 更新全局状态
const updateGlobalState = (updates: Partial<MaterialUnitSyncState>) => {
  const oldState = { ...globalState }
  globalState = { ...globalState, ...updates, lastUpdated: new Date() }

  console.log(`[GlobalState] 状态更新:`, {
    materials: `${oldState.materials.length} -> ${globalState.materials.length}`,
    units: `${oldState.units.length} -> ${globalState.units.length}`,
    updates: Object.keys(updates)
  })

  // 使用 setTimeout 确保状态更新在下一个事件循环中执行
  setTimeout(() => {
    notifySubscribers()
  }, 0)
}

/**
 * 材质和单位数据同步Hook
 * 提供全局的材质和单位数据管理，支持实时同步
 */
export function useMaterialUnitSync() {
  const { toast } = useToast()
  const [state, setState] = useState(globalState)

  // 订阅全局状态变化
  useEffect(() => {
    const updateState = () => {
      console.log(`[Hook] 接收到状态更新通知，当前材质: ${globalState.materials.length}, 单位: ${globalState.units.length}`)
      setState({ ...globalState })
    }

    console.log(`[Hook] 注册订阅者，当前订阅者数量: ${subscribers.size}`)
    subscribers.add(updateState)

    // 立即同步当前状态
    updateState()

    // 如果数据为空，自动加载
    if (globalState.materials.length === 0 && globalState.units.length === 0 && !globalState.isLoading) {
      console.log(`[Hook] 检测到数据为空，自动加载数据`)
      loadAll()
    }

    return () => {
      console.log(`[Hook] 取消订阅者`)
      subscribers.delete(updateState)
    }
  }, [])

  // 加载材质数据
  const loadMaterials = useCallback(async () => {
    try {
      const response = await fetch('/api/products/materials')
      if (response.ok) {
        const data = await response.json()
        const materials = data.materials || []
        updateGlobalState({ materials })
        return materials
      } else {
        throw new Error('Failed to load materials')
      }
    } catch (error) {
      console.error('加载材质失败:', error)
      toast({
        title: "加载失败",
        description: "无法加载材质数据",
        variant: "destructive",
      })
      return []
    }
  }, [toast])

  // 加载单位数据
  const loadUnits = useCallback(async () => {
    try {
      const response = await fetch('/api/products/units')
      if (response.ok) {
        const data = await response.json()
        const units = data.units || []
        updateGlobalState({ units })
        return units
      } else {
        throw new Error('Failed to load units')
      }
    } catch (error) {
      console.error('加载单位失败:', error)
      toast({
        title: "加载失败",
        description: "无法加载单位数据",
        variant: "destructive",
      })
      return []
    }
  }, [toast])

  // 加载所有数据
  const loadAll = useCallback(async () => {
    updateGlobalState({ isLoading: true })
    try {
      await Promise.all([loadMaterials(), loadUnits()])
    } finally {
      updateGlobalState({ isLoading: false })
    }
  }, [loadMaterials, loadUnits])

  // 添加材质
  const addMaterial = useCallback(async (materialName: string) => {
    try {
      const response = await fetch('/api/products/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ material: materialName })
      })

      if (response.ok) {
        await loadMaterials() // 重新加载材质数据
        toast({
          title: "成功",
          description: `材质 "${materialName}" 添加成功`,
        })
        return true
      } else {
        const error = await response.json()
        toast({
          title: "添加失败",
          description: error.details || error.error || "添加材质失败",
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      console.error('添加材质失败:', error)
      toast({
        title: "添加失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      })
      return false
    }
  }, [loadMaterials, toast])

  // 添加单位
  const addUnit = useCallback(async (unitName: string) => {
    try {
      const response = await fetch('/api/products/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unit: unitName })
      })

      if (response.ok) {
        await loadUnits() // 重新加载单位数据
        toast({
          title: "成功",
          description: `单位 "${unitName}" 添加成功`,
        })
        return true
      } else {
        const error = await response.json()
        toast({
          title: "添加失败",
          description: error.details || error.error || "添加单位失败",
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      console.error('添加单位失败:', error)
      toast({
        title: "添加失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      })
      return false
    }
  }, [loadUnits, toast])

  // 删除材质
  const deleteMaterial = useCallback(async (materialId: string) => {
    try {
      console.log(`[useMaterialUnitSync] 开始删除材质: ${materialId}`)
      console.log(`[useMaterialUnitSync] 删除前材质列表:`, globalState.materials.map(m => m.name))

      const response = await fetch('/api/products/materials', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ material: materialId })
      })

      if (response.ok) {
        console.log(`[useMaterialUnitSync] 删除API成功，开始乐观更新`)

        // 立即更新本地状态（乐观更新）
        const currentMaterials = globalState.materials.filter(m => m.name !== materialId)
        console.log(`[useMaterialUnitSync] 乐观更新后材质列表:`, currentMaterials.map(m => m.name))

        updateGlobalState({ materials: currentMaterials })

        // 强制触发状态更新
        console.log(`[useMaterialUnitSync] 强制触发状态更新`)
        notifySubscribers()

        // 然后重新加载确保数据一致性
        console.log(`[useMaterialUnitSync] 开始重新加载数据`)
        await loadMaterials()

        console.log(`[useMaterialUnitSync] 数据重新加载完成`)

        toast({
          title: "成功",
          description: `材质 "${materialId}" 删除成功`,
        })
        return true
      } else {
        const error = await response.json()
        toast({
          title: "删除失败",
          description: error.details || error.error || "删除材质失败",
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      console.error('删除材质失败:', error)
      toast({
        title: "删除失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      })
      return false
    }
  }, [loadMaterials, toast])

  // 删除单位
  const deleteUnit = useCallback(async (unitId: string) => {
    try {
      console.log(`[useMaterialUnitSync] 开始删除单位: ${unitId}`)
      console.log(`[useMaterialUnitSync] 删除前单位列表:`, globalState.units.map(u => u.name))

      const response = await fetch('/api/products/units', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unit: unitId })
      })

      if (response.ok) {
        console.log(`[useMaterialUnitSync] 删除API成功，开始乐观更新`)

        // 立即更新本地状态（乐观更新）
        const currentUnits = globalState.units.filter(u => u.name !== unitId)
        console.log(`[useMaterialUnitSync] 乐观更新后单位列表:`, currentUnits.map(u => u.name))

        updateGlobalState({ units: currentUnits })

        // 强制触发状态更新
        console.log(`[useMaterialUnitSync] 强制触发状态更新`)
        notifySubscribers()

        // 然后重新加载确保数据一致性
        console.log(`[useMaterialUnitSync] 开始重新加载数据`)
        await loadUnits()

        console.log(`[useMaterialUnitSync] 数据重新加载完成`)

        toast({
          title: "成功",
          description: `单位 "${unitId}" 删除成功`,
        })
        return true
      } else {
        const error = await response.json()
        toast({
          title: "删除失败",
          description: error.details || error.error || "删除单位失败",
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      console.error('删除单位失败:', error)
      toast({
        title: "删除失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      })
      return false
    }
  }, [loadUnits, toast])

  // 初始化数据加载
  useEffect(() => {
    if (!globalState.lastUpdated) {
      loadAll()
    }
  }, [loadAll])

  return {
    materials: state.materials,
    units: state.units,
    isLoading: state.isLoading,
    lastUpdated: state.lastUpdated,
    loadMaterials,
    loadUnits,
    loadAll,
    addMaterial,
    addUnit,
    deleteMaterial,
    deleteUnit,
  }
}
