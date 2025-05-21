"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Product, ProductCategory } from "@/types/product"
import { getProducts, getProductCategories } from "@/lib/actions"

// 缓存数据类型
interface CachedData<T> {
  data: T
  timestamp: number
}

// 缓存过期时间（毫秒）
const CACHE_EXPIRY = 5 * 60 * 1000 // 5分钟

// 缓存键
const PRODUCTS_CACHE_KEY = "cached_products"
const CATEGORIES_CACHE_KEY = "cached_categories"

// 从本地存储获取缓存数据
function getFromCache<T>(key: string): CachedData<T> | null {
  if (typeof window === "undefined") return null
  
  try {
    const cached = localStorage.getItem(key)
    if (!cached) return null
    
    const parsedCache = JSON.parse(cached) as CachedData<T>
    
    // 检查缓存是否过期
    if (Date.now() - parsedCache.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(key)
      return null
    }
    
    return parsedCache
  } catch (error) {
    console.error(`Error retrieving cache for ${key}:`, error)
    return null
  }
}

// 将数据保存到本地存储
function saveToCache<T>(key: string, data: T): void {
  if (typeof window === "undefined") return
  
  try {
    const cacheData: CachedData<T> = {
      data,
      timestamp: Date.now()
    }
    
    localStorage.setItem(key, JSON.stringify(cacheData))
  } catch (error) {
    console.error(`Error saving cache for ${key}:`, error)
  }
}

// 产品数据缓存钩子
export function useCachedProducts(options?: {
  skipCache?: boolean
  refreshInterval?: number
}) {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // 加载产品数据
  const loadProducts = useCallback(async (forceRefresh = false) => {
    // 如果不强制刷新且不跳过缓存，尝试从缓存加载
    if (!forceRefresh && !options?.skipCache) {
      const cachedProducts = getFromCache<Product[]>(PRODUCTS_CACHE_KEY)
      const cachedCategories = getFromCache<ProductCategory[]>(CATEGORIES_CACHE_KEY)
      
      if (cachedProducts && cachedCategories) {
        setProducts(cachedProducts.data)
        setCategories(cachedCategories.data)
        return
      }
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      // 并行加载产品和分类数据
      const [productsData, categoriesData] = await Promise.all([
        getProducts(),
        getProductCategories()
      ])
      
      setProducts(productsData)
      setCategories(categoriesData)
      
      // 保存到缓存
      saveToCache(PRODUCTS_CACHE_KEY, productsData)
      saveToCache(CATEGORIES_CACHE_KEY, categoriesData)
    } catch (err) {
      console.error("Error loading products:", err)
      setError(err instanceof Error ? err : new Error("Failed to load products"))
      
      toast({
        title: "加载失败",
        description: "无法加载产品数据，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [options?.skipCache, toast])
  
  // 初始加载和定时刷新
  useEffect(() => {
    loadProducts()
    
    // 设置定时刷新
    if (options?.refreshInterval) {
      const intervalId = setInterval(() => {
        loadProducts(true) // 强制刷新
      }, options.refreshInterval)
      
      return () => clearInterval(intervalId)
    }
  }, [loadProducts, options?.refreshInterval])
  
  // 刷新数据
  const refreshProducts = useCallback(() => {
    return loadProducts(true)
  }, [loadProducts])
  
  // 添加产品到本地状态（不等待服务器响应）
  const addProductLocally = useCallback((product: Product) => {
    setProducts(prev => {
      const newProducts = [...prev, product]
      saveToCache(PRODUCTS_CACHE_KEY, newProducts)
      return newProducts
    })
  }, [])
  
  // 更新产品在本地状态（不等待服务器响应）
  const updateProductLocally = useCallback((updatedProduct: Product) => {
    setProducts(prev => {
      const newProducts = prev.map(p => 
        p.id === updatedProduct.id ? updatedProduct : p
      )
      saveToCache(PRODUCTS_CACHE_KEY, newProducts)
      return newProducts
    })
  }, [])
  
  // 删除产品从本地状态（不等待服务器响应）
  const deleteProductLocally = useCallback((productId: number) => {
    setProducts(prev => {
      const newProducts = prev.filter(p => p.id !== productId)
      saveToCache(PRODUCTS_CACHE_KEY, newProducts)
      return newProducts
    })
  }, [])
  
  // 添加分类到本地状态
  const addCategoryLocally = useCallback((category: ProductCategory) => {
    setCategories(prev => {
      const newCategories = [...prev, category]
      saveToCache(CATEGORIES_CACHE_KEY, newCategories)
      return newCategories
    })
  }, [])
  
  // 更新分类在本地状态
  const updateCategoryLocally = useCallback((updatedCategory: ProductCategory) => {
    setCategories(prev => {
      const newCategories = prev.map(c => 
        c.id === updatedCategory.id ? updatedCategory : c
      )
      saveToCache(CATEGORIES_CACHE_KEY, newCategories)
      return newCategories
    })
  }, [])
  
  // 删除分类从本地状态
  const deleteCategoryLocally = useCallback((categoryId: number) => {
    setCategories(prev => {
      const newCategories = prev.filter(c => c.id !== categoryId)
      saveToCache(CATEGORIES_CACHE_KEY, newCategories)
      return newCategories
    })
  }, [])
  
  // 清除缓存
  const clearCache = useCallback(() => {
    localStorage.removeItem(PRODUCTS_CACHE_KEY)
    localStorage.removeItem(CATEGORIES_CACHE_KEY)
  }, [])
  
  return {
    products,
    categories,
    isLoading,
    error,
    refreshProducts,
    addProductLocally,
    updateProductLocally,
    deleteProductLocally,
    addCategoryLocally,
    updateCategoryLocally,
    deleteCategoryLocally,
    clearCache
  }
}
