"use client"

import { useState, useCallback } from "react"
import useSWR, { mutate } from "swr"
import { useToast } from "@/components/ui/use-toast"
import {
  Artwork,
  ArtworkCategory,
  ArtworkFormData,
  ArtworkCategoryFormData,
  ArtworkFilter,
  ArtworkApiResponse
} from "@/types/artwork"
import { syncProductInventory } from "@/lib/actions/inventory-actions"

// API 基础URL
const API_BASE = '/api/artworks'

// SWR fetcher 函数
const fetcher = async (url: string) => {
  try {
    console.log(`🔄 SWR获取数据: GET ${url}`)

    const response = await fetch(url)

    console.log(`📡 SWR响应状态: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`

      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorData.details || errorMessage
        console.error(`🔥 SWR错误详情:`, errorData)
      } catch (parseError) {
        console.error(`🔥 无法解析SWR错误响应:`, parseError)
      }

      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log(`✅ SWR获取成功:`, data)
    return data
  } catch (error) {
    console.error(`🔥 SWR获取失败:`, error)

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查网络连接')
    }

    throw error
  }
}

// API 调用函数
const apiCall = async (url: string, options: RequestInit = {}) => {
  try {
    console.log(`🔄 API调用: ${options.method || 'GET'} ${url}`)

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    console.log(`📡 API响应状态: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`

      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorData.details || errorMessage
        console.error(`🔥 API错误详情:`, errorData)
      } catch (parseError) {
        console.error(`🔥 无法解析错误响应:`, parseError)
      }

      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log(`✅ API调用成功:`, data)
    return data
  } catch (error) {
    console.error(`🔥 API调用失败:`, error)

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查网络连接')
    }

    throw error
  }
}

/**
 * 作品管理钩子
 * 封装作品和分类的数据获取、过滤和操作逻辑
 * 使用SWR进行数据缓存和状态管理
 */
export function useArtworks() {
  const { toast } = useToast()
  const [filter, setFilter] = useState<ArtworkFilter>({
    searchQuery: "",
    categoryId: null,
    statusFilter: "all"
  })

  // 使用SWR获取作品数据（5分钟缓存）
  const {
    data: artworksResponse,
    error: artworksError,
    isLoading: artworksLoading,
    mutate: mutateArtworks
  } = useSWR(`${API_BASE}`, fetcher, {
    refreshInterval: 0, // 禁用自动刷新
    revalidateOnFocus: false, // 禁用焦点时重新验证
    dedupingInterval: 300000, // 5分钟去重间隔
    errorRetryCount: 3,
    errorRetryInterval: 1000,
  })

  // 使用SWR获取分类数据（30分钟缓存）
  const {
    data: categoriesResponse,
    error: categoriesError,
    isLoading: categoriesLoading,
    mutate: mutateCategories
  } = useSWR(`${API_BASE}/categories`, fetcher, {
    refreshInterval: 0, // 禁用自动刷新
    revalidateOnFocus: false, // 禁用焦点时重新验证
    dedupingInterval: 1800000, // 30分钟去重间隔
    errorRetryCount: 3,
    errorRetryInterval: 1000,
  })

  // 提取数据
  const artworks: Artwork[] = artworksResponse?.artworks || []
  const categories: ArtworkCategory[] = categoriesResponse?.categories || []
  const isLoading = artworksLoading || categoriesLoading

  // 处理错误
  if (artworksError) {
    console.error("Error loading artworks:", artworksError)
    toast({
      title: "加载失败",
      description: "无法加载作品数据",
      variant: "destructive",
    })
  }

  if (categoriesError) {
    console.error("Error loading artwork categories:", categoriesError)
    toast({
      title: "加载失败",
      description: "无法加载作品分类数据",
      variant: "destructive",
    })
  }

  // 过滤作品
  const filteredArtworks = artworks.filter(artwork => {
    // 搜索过滤
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase()
      const matchesName = artwork.name.toLowerCase().includes(query)
      const matchesSku = artwork.sku?.toLowerCase().includes(query)
      const matchesBarcode = artwork.barcode?.toLowerCase().includes(query)

      if (!matchesName && !matchesSku && !matchesBarcode) {
        return false
      }
    }

    // 分类过滤
    if (filter.categoryId && artwork.categoryId !== filter.categoryId) {
      return false
    }

    // 状态过滤
    if (filter.statusFilter !== "all") {
      const artworkStatus = artwork.status || "active"
      if (artworkStatus !== filter.statusFilter) {
        return false
      }
    }

    return true
  })

  // 更新过滤条件
  const updateFilter = useCallback((newFilter: Partial<ArtworkFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }))
  }, [])

  // 重新加载数据
  const loadData = useCallback(async () => {
    try {
      await Promise.all([
        mutateArtworks(),
        mutateCategories()
      ])
    } catch (error) {
      console.error("Error reloading data:", error)
      toast({
        title: "刷新失败",
        description: "无法刷新数据",
        variant: "destructive",
      })
    }
  }, [mutateArtworks, mutateCategories, toast])

  // 保存作品
  const saveArtwork = useCallback(async (artworkData: ArtworkFormData): Promise<boolean> => {
    try {
      console.log("🔄 [saveArtwork] 保存作品数据:", artworkData)

      // 数据转换和验证
      const processedData = {
        ...artworkData,
        price: Number(artworkData.price),
        commissionRate: Number(artworkData.commissionRate) || 0,
        cost: artworkData.cost ? Number(artworkData.cost) : null,
        inventory: artworkData.inventory ? Number(artworkData.inventory) : null,
        categoryId: artworkData.categoryId || null,
        type: "artwork", // 确保类型为作品
      }

      let result: ArtworkApiResponse<{ artwork: Artwork }>

      if (artworkData.id) {
        // 更新作品
        result = await apiCall(`${API_BASE}/${artworkData.id}`, {
          method: 'PUT',
          body: JSON.stringify(processedData),
        })
      } else {
        // 创建作品
        result = await apiCall(API_BASE, {
          method: 'POST',
          body: JSON.stringify(processedData),
        })
      }

      if (result.success) {
        // 重新获取数据
        await mutateArtworks()

        // 同步库存（如果有库存数据）
        if (result.data?.artwork && processedData.inventory !== null) {
          try {
            await syncProductInventory(result.data.artwork.id!)
          } catch (inventoryError) {
            console.warn("库存同步失败:", inventoryError)
          }
        }

        toast({
          title: "保存成功",
          description: artworkData.id ? "作品更新成功" : "作品创建成功",
        })

        return true
      } else {
        throw new Error(result.error || "保存失败")
      }
    } catch (error) {
      console.error("Error saving artwork:", error)
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
      return false
    }
  }, [mutateArtworks, toast])

  // 删除作品
  const deleteArtwork = useCallback(async (artworkId: number): Promise<boolean> => {
    try {
      console.log("🔄 [deleteArtwork] 删除作品:", artworkId)

      const result = await apiCall(`${API_BASE}/${artworkId}`, {
        method: 'DELETE',
      })

      if (result.success) {
        // 重新获取数据
        await mutateArtworks()

        toast({
          title: "删除成功",
          description: "作品删除成功",
        })

        return true
      } else {
        throw new Error(result.error || "删除失败")
      }
    } catch (error) {
      console.error("Error deleting artwork:", error)
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
      return false
    }
  }, [mutateArtworks, toast])

  // 保存分类
  const saveCategory = useCallback(async (categoryData: ArtworkCategoryFormData): Promise<boolean> => {
    try {
      console.log("🔄 [saveCategory] 保存分类数据:", categoryData)

      let result: ArtworkApiResponse<{ category: ArtworkCategory }>

      if (categoryData.id) {
        // 更新分类
        result = await apiCall(`${API_BASE}/categories/${categoryData.id}`, {
          method: 'PUT',
          body: JSON.stringify(categoryData),
        })
      } else {
        // 创建分类
        result = await apiCall(`${API_BASE}/categories`, {
          method: 'POST',
          body: JSON.stringify(categoryData),
        })
      }

      if (result.success) {
        // 重新获取数据
        await Promise.all([
          mutateCategories(),
          mutateArtworks() // 分类变更可能影响作品显示
        ])

        toast({
          title: "保存成功",
          description: categoryData.id ? "分类更新成功" : "分类创建成功",
        })

        return true
      } else {
        throw new Error(result.error || "保存失败")
      }
    } catch (error) {
      console.error("Error saving category:", error)
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
      return false
    }
  }, [mutateCategories, mutateArtworks, toast])

  // 删除分类
  const deleteCategory = useCallback(async (categoryId: number): Promise<boolean> => {
    try {
      console.log("🔄 [deleteCategory] 删除分类:", categoryId)

      const result = await apiCall(`${API_BASE}/categories/${categoryId}`, {
        method: 'DELETE',
      })

      if (result.success) {
        // 重新获取数据
        await Promise.all([
          mutateCategories(),
          mutateArtworks() // 分类删除可能影响作品显示
        ])

        toast({
          title: "删除成功",
          description: "分类删除成功",
        })

        return true
      } else {
        throw new Error(result.error || "删除失败")
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
      return false
    }
  }, [mutateCategories, mutateArtworks, toast])

  return {
    // 数据
    artworks,
    categories,
    filteredArtworks,
    isLoading,

    // 过滤
    filter,
    updateFilter,

    // 操作
    loadData,
    saveArtwork,
    deleteArtwork,
    saveCategory,
    deleteCategory,
  }
}
